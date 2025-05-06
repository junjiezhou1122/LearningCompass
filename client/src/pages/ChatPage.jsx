import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useWebSocketContext } from "@/components/chat/WebSocketProvider";

// Import our new chat components
import ChatHeader from "@/components/chat/ChatHeader";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatConversationHeader from "@/components/chat/ChatConversationHeader";
import ChatMessagesList from "@/components/chat/ChatMessagesList";
import ChatInput from "@/components/chat/ChatInput";
import ChatEmptyState from "@/components/chat/ChatEmptyState";

const ChatPage = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  // State variables
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Get WebSocket context
  const { sendMessage: wsSendMessage, connected: wsConnected, connectionState: wsConnectionState } = useWebSocketContext();
  
  // Constants
  const MESSAGES_PER_PAGE = 15; // Number of messages to load per page

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(
    (smooth = true) => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: smooth ? "smooth" : "auto",
          block: "end",
        });
      }
    },
    [messagesEndRef]
  );

  // Load chat partners from API
  // For now, we'll use a very minimal placeholder that will be replaced with real API data
  const [chatPartners, setChatPartners] = useState([]);
  const [isPartnersLoading, setIsPartnersLoading] = useState(true);

  // Fetch chat partners from API
  useEffect(() => {
    if (!token) return;
    
    const fetchChatPartners = async () => {
      try {
        setIsPartnersLoading(true);
        const response = await fetch('/api/chat/partners', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setChatPartners(data);
        } else {
          console.error('Failed to fetch chat partners');
          setChatPartners([]); // Set empty array on failure
        }
      } catch (error) {
        console.error('Error fetching chat partners:', error);
        setChatPartners([]); // Set empty array on error
      } finally {
        setIsPartnersLoading(false);
      }
    };
    
    fetchChatPartners();
  }, [token]);

  // Function to load older messages when user scrolls to the top of the chat
  const loadOlderMessages = useCallback(() => {
    if (!hasMore || isLoadingMore || !activeChat || !token) return;

    setIsLoadingMore(true);

    fetch(`/api/chat/messages/${activeChat.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.ok) return response.json();
        throw new Error("Failed to load older messages");
      })
      .then((allData) => {
        // Sort messages by date (oldest to newest)
        const sortedData = [...allData].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        // Simulate pagination
        const totalMessages = sortedData.length;
        const currentPage = page + 1;
        const startIndex = Math.max(
          0,
          totalMessages - currentPage * MESSAGES_PER_PAGE
        );
        const endIndex = totalMessages;
        const paginatedData = sortedData.slice(startIndex, endIndex);

        // Update messages
        setMessages((prev) => [
          ...paginatedData.filter(
            (msg) => !prev.some((existing) => existing.id === msg.id)
          ),
          ...prev,
        ]);

        setPage(currentPage);
        setHasMore(startIndex > 0);
      })
      .catch((error) => {
        console.error("Error loading older messages:", error);
        toast({
          title: "Error",
          description: "Failed to load older messages",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  }, [
    hasMore,
    isLoadingMore,
    activeChat,
    token,
    page,
    MESSAGES_PER_PAGE,
    toast,
  ]);

  // Function to load messages for a chat conversation
  const loadMessages = useCallback(
    async (partnerId, isLoadingOlder = false) => {
      if (!token) return;

      try {
        // Only clear messages when loading a new chat (not when loading older messages)
        if (!isLoadingOlder) {
          setMessages([]);
          setPage(1);
          setHasMore(true);
        }

        // Show loading indicator
        setIsLoadingMore(true);

        const response = await fetch(`/api/chat/messages/${partnerId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const allData = await response.json();
          // Sort messages by date (oldest to newest)
          const sortedData = [...allData].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );

          // Simulate pagination
          const totalMessages = sortedData.length;
          const currentPage = isLoadingOlder ? page + 1 : 1;
          const startIndex = Math.max(
            0,
            totalMessages - currentPage * MESSAGES_PER_PAGE
          );
          const endIndex = totalMessages;
          const paginatedData = sortedData.slice(startIndex, endIndex);

          // Update state
          if (isLoadingOlder) {
            // If loading older messages, prepend them to existing messages
            setMessages((prev) => [
              ...paginatedData.filter(
                (msg) => !prev.some((existing) => existing.id === msg.id)
              ),
              ...prev,
            ]);
            setPage(currentPage);

            // Check if there are more messages to load
            setHasMore(startIndex > 0);
          } else {
            // If loading a new chat, replace all messages
            setMessages(paginatedData);
            setHasMore(startIndex > 0);

            // After setting messages, scroll to bottom with a slight delay
            setTimeout(() => {
              scrollToBottom();
            }, 100);
          }
        } else {
          console.error("Error fetching messages:", await response.text());
          toast({
            title: "Error",
            description: "Failed to load messages",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      } finally {
        setIsLoadingMore(false);
      }
    },
    [token, page, MESSAGES_PER_PAGE, toast, scrollToBottom]
  );

  // Handle scroll events for detecting when to load more messages
  const handleScroll = useCallback(
    (event) => {
      // Load older messages when user scrolls to the top
      const scrollTop = event.currentTarget.scrollTop;
      if (scrollTop < 50 && hasMore && !isLoadingMore) {
        loadOlderMessages();
      }
    },
    [hasMore, isLoadingMore, loadOlderMessages]
  );

  // Set up scroll event listener
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector(
      'div[role="presentation"]'
    );
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(messages.length < MESSAGES_PER_PAGE);
    }
  }, [messages, scrollToBottom, MESSAGES_PER_PAGE]);

  // Handle viewport and container resizing
  useEffect(() => {
    const handleResize = () => {
      // Force recalculation of container heights
      const chatContainer = document.querySelector(".chat-container");
      const messagesContainer = document.querySelector(".messages-container");
      const sidebarScrollArea = document.querySelector(".sidebar-scroll-area");
      const emptyStateContainer = document.querySelector(
        ".empty-state-container"
      );

      if (chatContainer) {
        const headerHeight = 64; // Height of the main app header
        const viewportHeight = window.innerHeight;
        chatContainer.style.height = `${viewportHeight - headerHeight}px`;
      }

      if (messagesContainer) {
        // Set the messages container height by accounting for the chat input and header
        const chatHeaderHeight = 64; // Estimated
        const chatInputHeight = 68; // Estimated
        const messagesContainerHeight =
          chatContainer.offsetHeight - chatHeaderHeight - chatInputHeight;
        messagesContainer.style.height = `${messagesContainerHeight}px`;
      }

      if (sidebarScrollArea) {
        // Handle the sidebar scroll area height - account for search input height
        const searchInputHeight = 72; // Estimated
        const sidebarAreaHeight =
          chatContainer.offsetHeight - searchInputHeight;
        sidebarScrollArea.style.height = `${sidebarAreaHeight}px`;
      }

      if (emptyStateContainer) {
        // Handle the empty state container height
        emptyStateContainer.style.height = `${chatContainer.offsetHeight}px`;
      }
    };

    // Initial calculation
    setTimeout(handleResize, 100);

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Clean up on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Define references for WebSocket variables that persist between renders
  const wsRef = useRef({
    socket: null,
    reconnectTimeout: null,
    reconnectAttempts: 0,
    heartbeatInterval: null,
    pendingMessages: [], // Queue for messages that couldn't be sent
    connectionStatus: 'disconnected', // 'disconnected', 'connecting', 'connected'
    lastMessageTime: 0
  });
  
  // Handle message acknowledgement from server
  const handleMessageAck = useCallback((data) => {
    if (data.type === 'message_ack' && data.tempId && data.messageId) {
      // Update the temporary message with the real message ID and mark as delivered
      setMessages(prev => 
        prev.map(msg => {
          if (msg.id === data.tempId) {
            return {
              ...msg,
              id: data.messageId,
              isPending: false,
              // Keep isRead as is since this is just delivery confirmation, not read receipt
            };
          }
          return msg;
        })
      );
      
      // Remove the message from pending queue if it exists there
      const ws = wsRef.current;
      if (ws && ws.pendingMessages) {
        ws.pendingMessages = ws.pendingMessages.filter(m => m.tempId !== data.tempId);
      }
      
      console.log(`Message ${data.tempId} acknowledged with server ID ${data.messageId}`);
    } else if (data.type === 'message_read_receipt') {
      // Handle read receipts
      setMessages(prev => 
        prev.map(msg => {
          if (msg.id === data.messageId || msg.id === data.tempId) {
            return {
              ...msg,
              isRead: true
            };
          }
          return msg;
        })
      );
      
      console.log(`Message ${data.messageId} marked as read`);
    }
  }, []);

  // Set up WebSocket connection when component mounts
  useEffect(() => {
    if (!user || !token) return;

    const ws = wsRef.current;
    const maxReconnectAttempts = 10;
    
    // Function to calculate exponential backoff time
    const getReconnectDelay = () => {
      // Start with 1s, then 2s, 4s, 8s, etc. but cap at 30s
      return Math.min(1000 * Math.pow(2, ws.reconnectAttempts), 30000);
    };
    
    // Function to add missing WebSocket ping/pong methods in some browsers
    const addWebSocketPingPongMethods = (socket) => {
      // Some browsers don't fully implement WebSocket ping/pong methods
      if (!socket.ping) {
        socket.ping = function() {
          const buffer = new Uint8Array(2);
          buffer[0] = 137; // 0x89, ping frame
          buffer[1] = 0; // zero length payload
          this.send(buffer.buffer);
          console.log('Sent WebSocket protocol ping frame');
        };
      }
      
      if (!socket.pong) {
        socket.pong = function() {
          const buffer = new Uint8Array(2);
          buffer[0] = 138; // 0x8A, pong frame
          buffer[1] = 0; // zero length payload
          this.send(buffer.buffer);
          console.log('Sent WebSocket protocol pong frame');
        };
      }
    };

    // Function to send a pong response to keep the connection alive
    const sendPong = () => {
      if (ws.socket && ws.socket.readyState === WebSocket.OPEN) {
        try {
          // Send application-level pong JSON message
          ws.socket.send(JSON.stringify({ type: 'pong' }));
          console.log('Application-level pong response sent to server');
          
          // Also try to send a protocol-level pong frame if supported
          if (typeof ws.socket.pong === 'function') {
            try {
              ws.socket.pong();
              console.log('Protocol-level pong frame sent');
            } catch (err) {
              console.log('Failed to send protocol-level pong, but application pong was sent');
            }
          }
          
          // Update the last activity timestamp
          ws.lastMessageTime = Date.now();
        } catch (error) {
          console.error('Error sending pong response:', error);
        }
      }
    };

    // Function to process any pending messages in the queue
    const processPendingMessages = () => {
      if (ws.pendingMessages.length === 0 || !ws.socket || ws.socket.readyState !== WebSocket.OPEN) {
        return;
      }

      console.log(`Processing ${ws.pendingMessages.length} pending messages`);
      
      // Clone and clear the queue to avoid processing the same message multiple times
      const messagesToProcess = [...ws.pendingMessages];
      ws.pendingMessages = [];

      messagesToProcess.forEach(msg => {
        try {
          ws.socket.send(JSON.stringify(msg));
          console.log('Sent pending message:', msg.type);
          
          // For chat messages, update UI to show they're no longer pending
          if (msg.type === 'chat_message' && msg.tempId) {
            setMessages(prev => 
              prev.map(m => 
                m.id === msg.tempId ? { ...m, isPending: false } : m
              )
            );
          }
        } catch (error) {
          console.error('Failed to send pending message:', error);
          // Put the message back in the queue
          ws.pendingMessages.push(msg);
        }
      });
    };

    // Function to establish WebSocket connection
    const connectWebSocket = () => {
      // Update connection status
      ws.connectionStatus = 'connecting';
      setConnected(false);

      // Create the WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      try {
        ws.socket = new WebSocket(wsUrl);
        console.log("WebSocket connection created");
        
        // Add ping/pong methods to ensure cross-browser compatibility
        addWebSocketPingPongMethods(ws.socket);
        
        // Add native ping/pong support through the WebSocket protocol
        ws.socket.addEventListener('ping', (event) => {
          console.log('Received WebSocket protocol ping');
          // Send a pong frame response
          if (ws.socket.pong) {
            ws.socket.pong();
          }
          ws.lastMessageTime = Date.now();
        });
        
        ws.socket.addEventListener('pong', (event) => {
          console.log('Received WebSocket protocol pong');
          ws.lastMessageTime = Date.now();
        });
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        toast({
          title: "Connection Error",
          description: "Failed to establish WebSocket connection. Please try again later.",
          variant: "destructive",
        });
        return;
      }

      ws.socket.addEventListener("open", () => {
        // Reset reconnect attempts when successfully connected
        ws.reconnectAttempts = 0;
        ws.connectionStatus = 'connected';
        ws.lastMessageTime = Date.now();
        
        // Authenticate with the server
        ws.socket.send(
          JSON.stringify({
            type: "auth",
            token,
          })
        );

        console.log("WebSocket connected");
        setConnected(true);
        
        // Set up heartbeat to keep connection alive
        if (ws.heartbeatInterval) clearInterval(ws.heartbeatInterval);
        ws.heartbeatInterval = setInterval(sendPong, 20000); // Send pong every 20 seconds
        
        // Process any pending messages that couldn't be sent while disconnected
        setTimeout(processPendingMessages, 1000); // Slight delay to ensure authentication has been processed
      });

      ws.socket.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          ws.lastMessageTime = Date.now(); // Update last message time

          // Handle different message types
          if (data.type === "ping") {
            // Server sent a ping, respond with pong
            ws.socket.send(JSON.stringify({ type: "pong" }));
            console.log("Received ping, sent pong response");
            return;
          }
          else if (data.type === "auth_success") {
            console.log("WebSocket authenticated successfully");
            // Process any pending messages after successful authentication
            processPendingMessages();
          } 
          else if (data.type === "message_sent" || data.type === "message_ack") {
            // Handle confirmation of our sent message
            const { message, tempId, messageId } = data;
            
            // Update the temporary message with the actual saved version
            // Use handleMessageAck which includes updating message in queue
            handleMessageAck({
              type: "message_ack",
              tempId: tempId,
              messageId: messageId || (message ? message.id : null)
            });
          }
          else if (data.type === "new_message") {
            // Handle incoming message from other user
            const message = data.message;
            
            // Only process if we have an active chat and it's relevant
            if (activeChat && (message.senderId === activeChat.id || message.receiverId === activeChat.id)) {
              // Add message to the list if it's not already there
              setMessages((prev) => {
                // Check if message already exists (by id)
                if (prev.some(msg => msg.id === message.id)) {
                  return prev;
                }
                return [...prev, message];
              });
              scrollToBottom();
              
              // Mark message as read if we're in the active chat
              if (ws.socket && ws.socket.readyState === WebSocket.OPEN) {
                ws.socket.send(JSON.stringify({
                  type: "mark_read",
                  senderId: message.senderId
                }));
              }
            } else {
              // Show a notification for messages in non-active chats
              const sender = message.sender?.username || 'Someone';
              toast({
                title: `New message from ${sender}`,
                description: message.content.length > 50 ? `${message.content.substring(0, 50)}...` : message.content,
                variant: "default",
              });
            }
          }
          else if (data.type === "unread_messages") {
            // Handle list of unread messages
            console.log(`You have ${data.count} unread messages`);
            
            // We could add visual indicators for unread messages in the sidebar
            // or add notifications here
          }
          else if (data.type === "messages_read" || data.type === "message_read_receipt") {
            // Handle read receipt - update the UI to show messages as read
            if (activeChat && (data.readBy === activeChat.id || data.senderId === activeChat.id)) {
              // For single message read receipt
              if (data.messageId) {
                handleMessageAck({
                  type: 'message_read_receipt',
                  messageId: data.messageId,
                  tempId: data.tempId
                });
              } 
              // For bulk read status update
              else {
                setMessages(prev => prev.map(msg => 
                  msg.senderId === user.id && msg.receiverId === activeChat.id
                    ? { ...msg, isRead: true }
                    : msg
                ));
              }
            }
          }
          else if (data.type === "error") {
            console.error("WebSocket error:", data.message);
            toast({
              title: "Error",
              description: data.message,
              variant: "destructive",
            });
            
            // If this was an authentication error, attempt to reconnect
            if (data.message.includes("authentication")) {
              ws.socket.close();
            }
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      });

      ws.socket.addEventListener("close", (event) => {
        // Clear any existing intervals
        if (ws.heartbeatInterval) clearInterval(ws.heartbeatInterval);
        if (ws.reconnectTimeout) clearTimeout(ws.reconnectTimeout);
        
        ws.connectionStatus = 'disconnected';
        setConnected(false);
        
        // Log close event with more contextual information
        const closeReasons = {
          1000: "Normal closure",
          1001: "Going away",
          1002: "Protocol error",
          1003: "Unsupported data",
          1005: "No status received",
          1006: "Abnormal closure",
          1007: "Invalid frame payload data",
          1008: "Policy violation",
          1009: "Message too big",
          1010: "Mandatory extension",
          1011: "Internal server error",
          1012: "Service restart",
          1013: "Try again later",
          1014: "Bad gateway",
          1015: "TLS handshake"
        };
        
        const reason = closeReasons[event.code] || "Unknown reason";
        console.log(`WebSocket closed: ${event.code} (${reason})${event.reason ? ': ' + event.reason : ''}`);
        
        // Always reconnect for codes 1000 (normal closure), 1001 (going away),
        // 1005 (no status), 1006 (abnormal closure), 1012 (service restart), 1013 (try again later)
        const shouldReconnect = [
          1000, 1001, 1005, 1006, 1012, 1013
        ].includes(event.code) || event.code === undefined;
        
        // Don't reconnect for permanent errors
        const permanentError = [1002, 1003, 1007, 1008, 1009, 1010, 1011].includes(event.code);
        
        // Attempt to reconnect if appropriate and we haven't exceeded max attempts
        if ((shouldReconnect || !permanentError) && ws.reconnectAttempts < maxReconnectAttempts) {
          ws.reconnectAttempts++;
          const delay = getReconnectDelay();
          console.log(`Attempting to reconnect (${ws.reconnectAttempts}/${maxReconnectAttempts}) in ${delay}ms...`);
          
          // Show toast for first reconnection attempt
          if (ws.reconnectAttempts === 1) {
            toast({
              title: "Connection Lost",
              description: "Attempting to reconnect...",
              variant: "warning",
            });
          }
          
          ws.reconnectTimeout = setTimeout(connectWebSocket, delay);
        } else if (ws.reconnectAttempts >= maxReconnectAttempts) {
          toast({
            title: "Connection Failed",
            description: "Could not establish a stable connection. Please refresh the page.",
            variant: "destructive",
          });
        } else if (permanentError) {
          // For permanent errors, show appropriate message
          toast({
            title: "Connection Error",
            description: reason,
            variant: "destructive",
          });
        }
      });

      ws.socket.addEventListener("error", (error) => {
        // Only log full error in development, show simplified message in production
        if (process.env.NODE_ENV === 'development') {
          console.warn("WebSocket connection error - this is normal during reconnections");
          // Store error details without logging full object
          ws.lastError = { 
            time: new Date().toISOString(),
            message: error?.message || 'Unknown error'
          };
        }
        ws.connectionStatus = 'disconnected';
        setConnected(false);
      });

      // Set the socket in state for later use
      setWs(ws.socket);
    };

    // Connect to WebSocket
    connectWebSocket();

    // Set up connection health check
    const healthCheckInterval = setInterval(() => {
      // If we haven't received any message in 40 seconds, the connection may be dead
      const timeSinceLastMessage = Date.now() - ws.lastMessageTime;
      if (ws.connectionStatus === 'connected' && timeSinceLastMessage > 40000) {
        console.log('Connection appears to be dead, attempting to reconnect...');
        if (ws.socket) ws.socket.close(); // This will trigger the reconnection logic
      }
    }, 15000); // Check every 15 seconds

    // Set up polling as a fallback for message retrieval
    const pollingInterval = setInterval(() => {
      if (activeChat && (!connected || ws.connectionStatus !== 'connected')) {
        console.log("Using polling fallback to fetch messages");
        loadMessages(activeChat.id);
      }
    }, 10000); // Poll every 10 seconds if WebSocket is not connected

    // Clean up on component unmount
    return () => {
      if (ws.reconnectTimeout) clearTimeout(ws.reconnectTimeout);
      if (ws.heartbeatInterval) clearInterval(ws.heartbeatInterval);
      clearInterval(healthCheckInterval);
      clearInterval(pollingInterval);
      if (ws.socket) ws.socket.close();
    };
  }, [user, token, activeChat, toast, scrollToBottom, connected, loadMessages, handleMessageAck]);
  
  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      // Load messages through REST API
      loadMessages(activeChat.id);
      
      // Also request message history through WebSocket for real-time updates
      if (connected) {
        wsSendMessage({
          type: 'get_message_history',
          partnerId: activeChat.id,
          limit: MESSAGES_PER_PAGE
        });
      }
    }
  }, [activeChat, loadMessages, connected, wsSendMessage, MESSAGES_PER_PAGE]);

  // Connection state is updated from WebSocketContext

  // Update local connection state when WebSocketContext connection state changes
  useEffect(() => {
    setConnected(wsConnected);
    setConnectionState(wsConnected ? 'connected' : 'disconnected');
  }, [wsConnected]);

  // Register event listeners for WebSocket events
  useEffect(() => {
    // Handler for received messages
    const handleReceivedMessage = (event) => {
      const { message } = event.detail;
      
      if (!message || !user) return;
      
      // If message is for the current chat, add it to the messages list
      if (activeChat && ((message.senderId === user.id && message.receiverId === activeChat.id) ||
          (message.receiverId === user.id && message.senderId === activeChat.id))) {
        
        // Check if we don't already have this message to avoid duplicates
        const isDuplicate = messages.some(m => 
          (m.id === message.id) || 
          (m.tempId && m.tempId === message.id)
        );
        
        if (!isDuplicate) {
          // Add the message to our local state
          setMessages(prev => [...prev, message]);
          
          // Scroll to bottom
          setTimeout(scrollToBottom, 50);
          
          // If the message is from the partner, mark it as read
          if (activeChat && message.senderId === activeChat.id) {
            // Send read receipt
            wsSendMessage({
              type: 'mark_as_read',
              messageId: message.id
            });
          }
        }
      } else if (message.receiverId === user.id) {
        // Message is for us but not in the current chat
        const senderName = message.sender?.username || 
                           (message.sender?.firstName ? `${message.sender.firstName} ${message.sender.lastName || ''}`.trim() : 'someone');
        
        toast({
          title: 'New Message',
          description: `You have a new message from ${senderName}`,
          variant: 'default',
        });
      }
    };

    // Handler for message acknowledgments
    const handleMessageAck = (event) => {
      const { tempId, messageId } = event.detail;
      if (tempId && messageId) {
        setMessages(prev => 
          prev.map(m => 
            m.id === tempId ? 
            { ...m, id: messageId, isPending: false } : 
            m
          )
        );
        console.log(`Message ${tempId} acknowledged as ${messageId}`);
      }
    };

    // Handler for message read receipts
    const handleMessageRead = (event) => {
      const { messageId } = event.detail;
      if (messageId) {
        setMessages(prev => 
          prev.map(m => 
            m.id === messageId ? 
            { ...m, isRead: true } : 
            m
          )
        );
        console.log(`Message ${messageId} marked as read`);
      }
    };

    // Handler for message delivery failures
    const handleMessageFailed = (event) => {
      const { tempId } = event.detail;
      if (tempId) {
        setMessages(prev => 
          prev.map(m => 
            m.id === tempId ? 
            { ...m, deliveryFailed: true, isPending: false } : 
            m
          )
        );

        toast({
          title: 'Message Failed',
          description: 'Your message could not be delivered. Please try again.',
          variant: 'destructive',
        });
        
        console.log(`Message ${tempId} delivery failed`);
      }
    };
    
    // Handler for unread messages count
    const handleUnreadMessages = (event) => {
      const { count, messages: unreadMessages } = event.detail;
      
      // If we receive unread messages and we're not already looking at them,
      // show a notification with the count
      if (count > 0 && unreadMessages && unreadMessages.length > 0) {
        const lastMessage = unreadMessages[unreadMessages.length - 1];
        const senderName = lastMessage.sender?.username || 'someone';
        
        toast({
          title: `${count} Unread Message${count > 1 ? 's' : ''}`,
          description: `Latest from ${senderName}: ${lastMessage.content.substring(0, 30)}${lastMessage.content.length > 30 ? '...' : ''}`,
          variant: 'default',
        });
      }
    };

    // Add event listeners
    window.addEventListener('chat:message:received', handleReceivedMessage);
    window.addEventListener('chat:message:ack', handleMessageAck);
    window.addEventListener('chat:message:read', handleMessageRead);
    window.addEventListener('chat:message:failed', handleMessageFailed);
    window.addEventListener('chat:unread:messages', handleUnreadMessages);

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('chat:message:received', handleReceivedMessage);
      window.removeEventListener('chat:message:ack', handleMessageAck);
      window.removeEventListener('chat:message:read', handleMessageRead);
      window.removeEventListener('chat:message:failed', handleMessageFailed);
      window.removeEventListener('chat:unread:messages', handleUnreadMessages);
    };
  }, [user, activeChat, messages, toast, scrollToBottom, wsSendMessage]);
  
  // Send message function
  const sendMessage = () => {
    if (!input.trim() || !activeChat) return;
    
    const tempId = `temp-${Date.now()}`; // temporary ID with 'temp-' prefix
    
    // Create a temporary message with local ID
    const tempMessage = {
      id: tempId,
      senderId: user.id,
      receiverId: activeChat.id,
      content: input.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
      sender: user,
      isPending: true // Mark as pending so we can style it differently
    };
    
    // Create message object to send to server
    const messageToSend = {
      type: "chat_message",
      receiverId: activeChat.id,
      content: tempMessage.content,
      tempId // Include temporary ID so we can update the message when we get a response
    };
    
    // Add message locally for immediate display
    setMessages((prev) => [...prev, tempMessage]);
    
    // Clear input field immediately
    setInput("");
    
    // Scroll to bottom
    setTimeout(scrollToBottom, 50);
    
    // Send the message using our WebSocketContext
    const success = wsSendMessage(messageToSend);
    
    // If message couldn't be sent, show a notification
    if (!success) {
      console.log('Message queued for later delivery');
      
      toast({
        title: "Message queued",
        description: "We'll send your message when connection is restored",
        variant: "warning",
      });
    } else {
      console.log('Message sent successfully');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // New message button handler
  const handleNewMessage = () => {
    // This would typically open a new message dialog
    toast({
      title: "New Message",
      description: "This feature is coming soon!",
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-orange-50 to-white">
      {/* Top control bar with mobile sidebar toggle */}
      <div className="flex items-center h-12 border-b border-orange-200 px-4 bg-gradient-to-r from-orange-50 via-orange-100 to-orange-50 text-orange-800 shadow-sm z-10">
        <motion.div 
          whileHover={{ rotate: 15 }} 
          whileTap={{ scale: 0.9 }}
          className="mr-2 lg:hidden"
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-orange-700 hover:bg-orange-200/70 h-8 w-8 rounded-full transition-colors duration-200 shadow-sm"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </motion.div>
        
        <ChatHeader 
          isMobileSidebarOpen={isMobileSidebarOpen} 
          setIsMobileSidebarOpen={setIsMobileSidebarOpen} 
        />
      </div>

      <div className="flex-1 flex overflow-hidden chat-container">
        {/* Chat sidebar */}
        <ChatSidebar 
          isMobileSidebarOpen={isMobileSidebarOpen}
          setActiveChat={setActiveChat}
          activeChat={activeChat}
          chatPartners={chatPartners}
          isPartnersLoading={isPartnersLoading}
        />

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {activeChat ? (
            <>
              {/* Chat header for active conversation */}
              <ChatConversationHeader activeChat={activeChat} />
              
              {/* Chat messages */}
              <ChatMessagesList 
                scrollAreaRef={scrollAreaRef}
                isLoadingMore={isLoadingMore}
                page={page}
                hasMore={hasMore}
                loadOlderMessages={loadOlderMessages}
                messages={messages.map(msg => ({
                  ...msg,
                  onRetry: msg.deliveryFailed || msg.isFailed ? () => {
                    // Create new message object to resend
                    const messageToResend = {
                      type: "chat_message",
                      receiverId: activeChat.id,
                      content: msg.content,
                      tempId: `temp-${Date.now()}` // Create new tempId for tracking
                    };
                    
                    // Replace the failed message with a new pending one
                    setMessages(prev => prev.map(m => 
                      m.id === msg.id ? 
                      { 
                        ...m, 
                        id: messageToResend.tempId,
                        isPending: true,
                        deliveryFailed: false,
                        isFailed: false,
                        error: null,
                        createdAt: new Date().toISOString()
                      } : m
                    ));
                    
                    // Send the message
                    wsSendMessage(messageToResend);
                    
                    // Show toast indicating message is being retried
                    toast({
                      title: "Retrying message",
                      description: "Attempting to resend message...",
                      variant: "default",
                    });
                  } : undefined
                }))}
                user={user}
                messagesEndRef={messagesEndRef}
              />
              
              {/* Chat input */}
              <ChatInput 
                input={input}
                setInput={setInput}
                handleKeyDown={handleKeyDown}
                sendMessage={sendMessage}
                connected={connected}
                activeChat={activeChat}
                connectionStatus={connectionState}
              />
            </>
          ) : (
            /* Empty state when no chat is selected */
            <ChatEmptyState 
              connected={connected} 
              onNewMessage={handleNewMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;