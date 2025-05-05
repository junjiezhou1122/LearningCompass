/**
 * WebSocketContextProvider.jsx
 * A specialized context provider for WebSocket connections focused on chat between mutual followers
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Create context for WebSocket
const WebSocketContext = createContext(null);

/**
 * Provider component for WebSocket chat functionality between mutual followers
 */
export const WebSocketContextProvider = ({ children }) => {
  const { toast } = useToast();
  const { token, user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [mutualFollowers, setMutualFollowers] = useState([]);
  
  // WebSocket reference
  const ws = useRef(null);
  
  // Queue for unsent messages
  const messageQueue = useRef([]);
  
  // Track reconnection attempts
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef(null);
  const heartbeatInterval = useRef(null);
  
  // Get WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }, []);
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!token || !user) return;
    
    try {
      // Close existing connection if any
      if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
        ws.current.close();
      }
      
      setConnectionStatus('connecting');
      ws.current = new WebSocket(getWebSocketUrl());
      
      // Connection opened
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        
        // Authenticate
        ws.current.send(JSON.stringify({
          type: 'auth',
          token
        }));
        
        // Process any queued messages
        processQueue();
        
        // Start heartbeat
        startHeartbeat();
      };
      
      // Connection closed
      ws.current.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code}`);
        setConnected(false);
        setConnectionStatus('disconnected');
        clearHeartbeat();
        
        // Reconnect unless it was a normal closure
        if (event.code !== 1000) {
          scheduleReconnect();
        }
      };
      
      // Connection error
      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: 'Connection Error',
          description: 'Could not connect to chat server',
          variant: 'destructive'
        });
      };
      
      // Message received
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle authentication success
          if (data.type === 'auth_success') {
            console.log('WebSocket authenticated successfully');
            
            // Trigger event to let components know we're connected
            window.dispatchEvent(new CustomEvent('ws:authenticated', {
              detail: { userId: data.userId }
            }));
            
            // Fetch mutual followers now that we're authenticated
            fetchMutualFollowers();
          }
          // Handle ping from server (keep connection alive)
          else if (data.type === 'ping') {
            // Respond with pong
            ws.current.send(JSON.stringify({ type: 'pong' }));
          }
          // Handle message delivery confirmation
          else if (data.type === 'message_ack') {
            // Dispatch a custom event for message acknowledgment
            window.dispatchEvent(new CustomEvent('ws:message', {
              detail: data
            }));
          }
          // Handle incoming chat message
          else if (data.type === 'chat_message') {
            // Dispatch a custom event for the chat message
            window.dispatchEvent(new CustomEvent('ws:message', {
              detail: data
            }));
            
            // Send read receipt if we're the receiver
            if (data.receiverId === user?.id) {
              ws.current.send(JSON.stringify({
                type: 'mark_read',
                messageId: data.id,
                senderId: data.senderId
              }));
            }
          }
          // Handle message read receipt
          else if (data.type === 'message_read') {
            // Dispatch a custom event for message read receipt
            window.dispatchEvent(new CustomEvent('ws:message', {
              detail: data
            }));
          }
          // Handle unread messages (sent on initial connection)
          else if (data.type === 'unread_messages') {
            // Dispatch a custom event for unread messages
            window.dispatchEvent(new CustomEvent('ws:unread_messages', {
              detail: data
            }));
          }
          // Handle user online status updates
          else if (data.type === 'user_status') {
            // Update online status for users
            // This would update a specific user's online status
            updateUserStatus(data.userId, data.status);
          }
          // Handle error messages
          else if (data.type === 'error') {
            console.error('WebSocket error from server:', data.message);
            toast({
              title: 'Error',
              description: data.message,
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      scheduleReconnect();
    }
  }, [token, user, getWebSocketUrl, toast]);
  
  // Process queued messages
  const processQueue = useCallback(() => {
    if (!connected || !ws.current || messageQueue.current.length === 0) return;
    
    console.log(`Processing ${messageQueue.current.length} queued messages`);
    const queue = [...messageQueue.current];
    messageQueue.current = [];
    
    queue.forEach(message => {
      try {
        ws.current.send(JSON.stringify(message));
        console.log('Sent queued message');
      } catch (error) {
        console.error('Error sending queued message:', error);
        messageQueue.current.push(message);
      }
    });
  }, [connected]);
  
  // Heartbeat to keep connection alive
  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    heartbeatInterval.current = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
        console.log('Heartbeat ping sent');
      }
    }, 20000); // 20 seconds
  }, []);
  
  // Clear heartbeat interval
  const clearHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []);
  
  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    
    reconnectAttempts.current += 1;
    const maxAttempts = 10;
    
    if (reconnectAttempts.current <= maxAttempts) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 30000);
      console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxAttempts})`);
      
      reconnectTimeout.current = setTimeout(() => {
        console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxAttempts})`);
        connect();
      }, delay);
    } else {
      console.log('Max reconnection attempts reached');
      setConnectionStatus('failed');
      toast({
        title: 'Connection Failed',
        description: 'Could not connect to chat server after multiple attempts',
        variant: 'destructive'
      });
    }
  }, [connect, toast]);
  
  // Send a message through WebSocket
  const sendMessage = useCallback((message) => {
    if (!connected || !ws.current) {
      // Queue the message for later
      messageQueue.current.push(message);
      console.log('Message queued for later sending');
      return false;
    }
    
    try {
      ws.current.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      messageQueue.current.push(message);
      return false;
    }
  }, [connected]);
  
  // Fetch mutual followers (users who follow each other)
  const fetchMutualFollowers = useCallback(async () => {
    if (!user || !token) return;
    
    try {
      const response = await fetch(`/api/users/${user.id}/mutual-followers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMutualFollowers(data);
      } else {
        console.error('Failed to fetch mutual followers');
      }
    } catch (error) {
      console.error('Error fetching mutual followers:', error);
    }
  }, [user, token]);
  
  // Update user status (online/offline)
  const updateUserStatus = useCallback((userId, status) => {
    setMutualFollowers(prev => prev.map(follower => {
      if (follower.id === userId) {
        return { ...follower, online: status === 'online' };
      }
      return follower;
    }));
  }, []);
  
  // Connect when component mounts or token/user changes
  useEffect(() => {
    if (token && user) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      if (ws.current) {
        ws.current.close(1000, 'Component unmounted');
      }
      clearHeartbeat();
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [token, user, connect, clearHeartbeat]);
  
  // The context value
  const value = {
    connected,
    connectionStatus,
    mutualFollowers,
    sendMessage,
    updateUserStatus
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use the WebSocket context
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketContextProvider');
  }
  return context;
};
