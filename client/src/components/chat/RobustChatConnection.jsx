import React, { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * RobustChatConnection - A component to manage WebSocket connections with
 * auto-reconnect, message queuing, and state management.
 *
 * This component does not render anything visible but handles the WebSocket
 * connection logic for chat functionality.
 */
const RobustChatConnection = ({
  isAuthenticated,
  user,
  token,
  activeChat,
  onConnectionChange,
  onNewMessage,
  onChatHistory,
  onUserOnline,
  onUserOffline
}) => {
  const { toast } = useToast();
  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const pendingMessagesRef = useRef([]);
  const isMountedRef = useRef(true);
  const pingIntervalRef = useRef(null);
  const connectionCheckRef = useRef(null);
  
  // Constants for connection management
  const PING_INTERVAL = 10000; // 10 seconds
  const DEFAULT_RECONNECT_TIMEOUT = 2000; // 2 seconds
  const MAX_RECONNECT_DELAY = 30000; // 30 seconds max
  
  // Function to send a message with queueing capability
  const sendMessage = (messageData) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(messageData));
        return true;
      } catch (error) {
        console.warn('Error sending message, will retry:', error.message);
        pendingMessagesRef.current.push(messageData);
        return false;
      }
    } else {
      // Queue for later when connection is established
      pendingMessagesRef.current.push(messageData);
      console.warn('Connection not open, message queued for later');
      return false;
    }
  };
  
  // Clear all timers to prevent memory leaks
  const clearTimers = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (connectionCheckRef.current) {
      clearInterval(connectionCheckRef.current);
      connectionCheckRef.current = null;
    }
  };
  
  // Main WebSocket connection setup
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    
    // Make sendMessage available globally
    window.wsSendMessage = sendMessage;
    isMountedRef.current = true;
    
    const connectWebSocket = () => {
      if (!isMountedRef.current) return;
      
      // Close any existing connections
      if (socketRef.current) {
        try {
          socketRef.current.close(1000, 'Creating new connection');
          socketRef.current = null;
        } catch (error) {
          console.error('Error closing socket:', error.message);
        }
      }
      
      // Calculate backoff delay with exponential increase
      const reconnectDelay = Math.min(
        DEFAULT_RECONNECT_TIMEOUT * Math.pow(1.5, reconnectAttemptsRef.current),
        MAX_RECONNECT_DELAY
      );
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      try {
        // Create new WebSocket
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;
        
        // Connection established handler
        socket.onopen = () => {
          console.log('WebSocket connection established');
          onConnectionChange(true);
          reconnectAttemptsRef.current = 0; // Reset counter on success
          
          // Send authentication
          socket.send(JSON.stringify({
            type: 'auth',
            data: { token }
          }));
          
          // Process any pending messages
          if (pendingMessagesRef.current.length > 0) {
            const messagesToSend = [...pendingMessagesRef.current];
            pendingMessagesRef.current = [];
            
            // Small delay to ensure auth is processed
            setTimeout(() => {
              messagesToSend.forEach(msg => {
                if (socket.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify(msg));
                } else {
                  pendingMessagesRef.current.push(msg);
                }
              });
            }, 500);
          }
          
          // Setup ping to keep connection alive
          clearTimers();
          pingIntervalRef.current = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'ping' }));
            }
          }, PING_INTERVAL);
          
          // Request chat history for active chat
          if (activeChat) {
            setTimeout(() => {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                  type: 'get_chat_history',
                  data: { userId: activeChat.id }
                }));
              }
            }, 1000); // Delay to ensure auth is processed
          }
        };
        
        // Message handler
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'direct_message':
                onNewMessage(data.data);
                break;
                
              case 'chat_history':
                if (data?.data) {
                  onChatHistory(data.data);
                } else {
                  console.error('Invalid chat history format');
                  toast({
                    title: 'Error',
                    description: 'Could not load chat history. Please try again.',
                    variant: 'destructive'
                  });
                }
                break;
                
              case 'user_online':
                onUserOnline(data.data.userId);
                break;
                
              case 'user_offline':
                onUserOffline(data.data.userId);
                break;
                
              case 'error':
                toast({
                  title: 'Chat Error',
                  description: data.data.message,
                  variant: 'destructive'
                });
                break;
                
              case 'pong':
                // Keepalive response, no action needed
                break;
                
              default:
                console.log('Unhandled message type:', data.type);
            }
          } catch (error) {
            console.error('Error parsing message:', error.message);
          }
        };
        
        // Connection close handler
        socket.onclose = (event) => {
          if (!isMountedRef.current) return;
          
          onConnectionChange(false);
          clearTimers();
          
          // Don't reconnect on normal closure or component unmount
          if (event.code === 1000 || event.code === 1001) {
            return;
          }
          
          // Schedule reconnection with backoff
          reconnectAttemptsRef.current++;
          console.log(`Connection lost. Reconnecting in ${reconnectDelay/1000}s (attempt ${reconnectAttemptsRef.current})`);
          
          setTimeout(() => {
            if (isMountedRef.current) {
              connectWebSocket();
            }
          }, reconnectDelay);
        };
        
        // Error handler
        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          // The onclose handler will handle reconnection
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error.message);
        
        // Retry with backoff
        if (isMountedRef.current) {
          reconnectAttemptsRef.current++;
          setTimeout(connectWebSocket, reconnectDelay);
        }
      }
    };
    
    // Start the connection
    connectWebSocket();
    
    // Monitor connection state less frequently
    connectionCheckRef.current = setInterval(() => {
      if (socketRef.current) {
        const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
        
        // Only log if not in OPEN state
        if (socketRef.current.readyState !== WebSocket.OPEN) {
          console.log(`WebSocket state: ${states[socketRef.current.readyState]}`);
          
          // Auto-reconnect if we find it's closed
          if (socketRef.current.readyState === WebSocket.CLOSED) {
            console.log('Detected closed state without onclose event, reconnecting');
            connectWebSocket();
          }
        }
      }
    }, 60000); // Once per minute
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
      clearTimers();
      delete window.wsSendMessage;
      
      if (socketRef.current) {
        try {
          socketRef.current.close(1000, 'Component unmounted');
          socketRef.current = null;
        } catch (error) {
          console.error('Error during cleanup:', error.message);
        }
      }
    };
  }, [isAuthenticated, user?.id, token, activeChat]);
  
  // Return the sendMessage function for use in the parent component
  return { sendMessage };
};

export default RobustChatConnection;
