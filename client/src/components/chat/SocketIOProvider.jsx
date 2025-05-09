import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../contexts/AuthContext";

// Create context for Socket.IO
const SocketIOContext = createContext(null);

// Custom hook to use the Socket.IO context
export const useSocketIO = () => {
  const context = useContext(SocketIOContext);
  if (!context) {
    throw new Error("useSocketIO must be used within a SocketIOProvider");
  }
  return context;
};

export const SocketIOProvider = ({ children }) => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const messageQueueRef = useRef([]);
  const offlineQueueRef = useRef([]);

  // State for tracking connection status
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState("disconnected");
  const [lastMessage, setLastMessage] = useState(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [forcedDisconnect, setForcedDisconnect] = useState(false);

  // Max reconnect attempts
  const MAX_RECONNECT_ATTEMPTS = 20;
  // Base reconnect delay in ms (will be multiplied by attempt count for backoff)
  const BASE_RECONNECT_DELAY = 1000;

  // Connect to Socket.IO server
  const connect = useCallback(() => {
    if (!user?.id || !token || forcedDisconnect) return;

    try {
      // Update connection state
      setConnectionState("connecting");

      console.log("Attempting to connect to Socket.IO server...");

      // Create Socket.IO connection with token authentication
      // Use the same URL as the current page (dynamic approach)
      const serverUrl = window.location.origin;
      console.log(`Using server URL: ${serverUrl}`);

      socketRef.current = io(serverUrl, {
        path: "/socket.io",
        auth: {
          token,
        },
        reconnection: false, // Handle reconnection manually to maintain consistent behavior
      });

      // Connection opened handler
      socketRef.current.on("connect", () => {
        console.log("Socket.IO successfully connected");
        setConnected(true);
        setConnectionState("connected");
        setReconnectAttempt(0);

        // Send any queued messages that couldn't be sent while disconnected
        if (offlineQueueRef.current.length > 0) {
          console.log(
            `Sending ${offlineQueueRef.current.length} queued messages`
          );

          // Process each queued message
          offlineQueueRef.current.forEach((queuedMsg) => {
            // Clone message to avoid modifying the original object in the queue
            const msgToSend = { ...queuedMsg };

            // Send the message
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit("message", msgToSend);
            }
          });

          // Clear the offline queue
          offlineQueueRef.current = [];
        }
      });

      // Message received handler
      socketRef.current.on("message", (message) => {
        try {
          // Set last message received for components to use
          setLastMessage(message);

          // Handle specific message types if needed at the provider level
          if (message.type === "error") {
            console.error("Socket.IO error message:", message);

            // If the message has a tempId, it's a message sending error
            if (message.tempId) {
              // Dispatch custom event for message failures
              const failEvent = new CustomEvent("chat:message:failed", {
                detail: {
                  tempId: message.tempId,
                  error: message.message,
                },
              });
              window.dispatchEvent(failEvent);
            }
          }
        } catch (err) {
          console.error("Error handling Socket.IO message:", err);
        }
      });

      // Chat message specific handler
      socketRef.current.on("chat_message", (message) => {
        console.log("Received chat message:", message);
        setLastMessage({
          ...message,
          type: "chat_message",
        });
      });

      // Group message specific handler
      socketRef.current.on("group_message", (message) => {
        console.log("Received group message:", message);
        setLastMessage({
          ...message,
          type: "group_message",
        });
      });

      // Connection closed handler
      socketRef.current.on("disconnect", (reason) => {
        console.log("Socket.IO disconnected", reason);
        setConnected(false);
        setConnectionState("disconnected");

        // Only attempt to reconnect if not forcibly disconnected
        if (!forcedDisconnect && reconnectAttempt < MAX_RECONNECT_ATTEMPTS) {
          const nextAttempt = reconnectAttempt + 1;
          setReconnectAttempt(nextAttempt);
          setConnectionState("reconnecting");

          // Exponential backoff for reconnect attempts
          const delay = Math.min(
            BASE_RECONNECT_DELAY * Math.pow(1.5, nextAttempt),
            30000 // Max delay of 30 seconds
          );

          console.log(
            `Reconnecting in ${delay}ms (attempt ${nextAttempt}/${MAX_RECONNECT_ATTEMPTS})`
          );

          // Set timeout for reconnection
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
          setConnectionState("failed");
          toast({
            title: "Connection Failed",
            description:
              "Could not connect to chat. Please refresh the page to try again.",
            variant: "destructive",
          });
        }
      });

      // Error handler
      socketRef.current.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error);
        setConnectionState("error");
      });
    } catch (error) {
      console.error("Error creating Socket.IO connection:", error);
      setConnectionState("error");
    }
  }, [user?.id, token, reconnectAttempt, forcedDisconnect, toast]);

  // Send message via Socket.IO, queue if offline
  const sendMessage = useCallback(
    (message) => {
      // Don't process if no user
      if (!user?.id) return;

      // Add user ID to all messages
      const msgWithUser = {
        ...message,
        userId: user.id,
      };

      // Queue message (for tracking sent messages)
      messageQueueRef.current.push(msgWithUser);

      // If socket is connected, send immediately
      if (socketRef.current && socketRef.current.connected) {
        // Use the specific event channel based on message type
        const eventType =
          message.type === "chat_message"
            ? "chat_message"
            : message.type === "group_message"
            ? "group_message"
            : "message";

        socketRef.current.emit(eventType, msgWithUser);
      } else {
        console.log(
          "Socket.IO not connected, queueing message for later delivery"
        );
        // Add to offline queue for sending when reconnected
        offlineQueueRef.current.push(msgWithUser);

        // If it's a chat message, emit an event for UI to update
        if (
          message.type === "chat_message" ||
          message.type === "group_message"
        ) {
          // After a delay, emit a message failed event if still offline
          setTimeout(() => {
            if (
              !connected &&
              offlineQueueRef.current.some((m) => m.tempId === message.tempId)
            ) {
              // Dispatch custom event for message failures
              const failEvent = new CustomEvent("chat:message:failed", {
                detail: {
                  tempId: message.tempId,
                  error:
                    "You appear to be offline. Message will be sent when you reconnect.",
                },
              });
              window.dispatchEvent(failEvent);
            }
          }, 3000); // 3 second delay
        }
      }
    },
    [user?.id, connected]
  );

  // Force disconnect (used when navigating away)
  const disconnect = useCallback(() => {
    setForcedDisconnect(true);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnected(false);
    setConnectionState("disconnected");
  }, []);

  // Reconnect manually
  const reconnect = useCallback(() => {
    setForcedDisconnect(false);
    setReconnectAttempt(0);
    connect();
  }, [connect]);

  // Handle online status
  const handleOnline = () => {
    console.log("Browser reports online status");
    if (!forcedDisconnect) {
      reconnect();
    }
  };

  // Handle offline status
  const handleOffline = () => {
    console.log("Browser reports offline status");
    setConnected(false);
    setConnectionState("disconnected");
  };

  // Connect on component mount or when user/token changes
  useEffect(() => {
    if (user?.id && token && !forcedDisconnect) {
      connect();
    }

    // Add online/offline event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user?.id, token, connect, forcedDisconnect]);

  // Expose the context value
  const contextValue = {
    connected,
    connectionState,
    sendMessage,
    reconnect,
    disconnect,
    lastMessage,
  };

  return (
    <SocketIOContext.Provider value={contextValue}>
      {children}
    </SocketIOContext.Provider>
  );
};

export default SocketIOProvider;
