/**
 * WebSocketProvider.jsx
 * A context provider for WebSocket connections throughout the app
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../contexts/AuthContext";

// Create context for WebSocket
const WebSocketContext = createContext(null);

// Custom hook to use the WebSocket context
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider"
    );
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const socket = useRef(null);
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

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (!user?.id || !token || forcedDisconnect) return;

    try {
      // Close existing connection if any
      if (socket.current && socket.current.readyState !== WebSocket.CLOSED) {
        socket.current.close();
      }

      // Update connection state
      setConnectionState("connecting");

      // Determine WebSocket URL based on environment
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const wsUrl = `${protocol}://${window.location.host}/api/ws?token=${token}`;

      // Create new WebSocket connection
      socket.current = new WebSocket(wsUrl);

      // Connection opened handler
      socket.current.onopen = () => {
        console.log("WebSocket connected");
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
            if (
              socket.current &&
              socket.current.readyState === WebSocket.OPEN
            ) {
              socket.current.send(JSON.stringify(msgToSend));
            }
          });

          // Clear the offline queue
          offlineQueueRef.current = [];
        }
      };

      // Message received handler
      socket.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          // Set last message received for components to use
          setLastMessage(message);

          // Handle specific message types if needed at the provider level
          if (message.type === "error") {
            console.error("WebSocket error message:", message);

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
          console.error("Error parsing WebSocket message:", err);
        }
      };

      // Connection closed handler
      socket.current.onclose = (event) => {
        console.log("WebSocket disconnected", event.code, event.reason);
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
      };

      // Error handler
      socket.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionState("error");
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      setConnectionState("error");
    }
  }, [user?.id, token, reconnectAttempt, forcedDisconnect, toast]);

  // Send message via WebSocket, queue if offline
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
      if (socket.current && socket.current.readyState === WebSocket.OPEN) {
        socket.current.send(JSON.stringify(msgWithUser));
      } else {
        console.log(
          "WebSocket not connected, queueing message for later delivery"
        );
        // Add to offline queue for sending when reconnected
        offlineQueueRef.current.push(msgWithUser);

        // If it's a chat message, emit an event for UI to update
        if (message.type === "chat_message") {
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

    if (socket.current) {
      socket.current.close();
      socket.current = null;
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

  // Initialize connection when user is authenticated
  useEffect(() => {
    // Only connect if we have a user and token
    if (user?.id && token && !forcedDisconnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socket.current) {
        socket.current.close();
      }
    };
  }, [user?.id, token, connect, forcedDisconnect]);

  // Handle network status changes for reconnection
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network is online, reconnecting WebSocket...");
      reconnect();
    };

    const handleOffline = () => {
      console.log("Network is offline, WebSocket will disconnect");
      setConnectionState("offline");
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [reconnect]);

  // Context value
  const contextValue = {
    connected,
    connectionState,
    reconnect,
    disconnect,
    sendMessage,
    lastMessage,
    reconnectAttempt,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
