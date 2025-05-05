/**
 * WebSocketProvider.jsx
 * A context provider for WebSocket connections throughout the app
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import useWebSocket from '../../hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';

// Create context for WebSocket
const WebSocketContext = createContext(null);

/**
 * Provider component for WebSocket functionality
 */
export const WebSocketProvider = ({ children }) => {
  const { toast } = useToast();
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  
  // Get auth token from storage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      
      // Extract user ID from token if possible
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        if (payload && payload.id) {
          setUserId(payload.id);
        }
      } catch (err) {
        console.error('Error parsing JWT token:', err);
      }
    }
  }, []);
  
  // Determine WebSocket URL
  const getWebSocketUrl = () => {
    // Only connect if we have a token
    if (!token) return null;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  };
  
  // Set up WebSocket connection
  const ws = useWebSocket({
    url: getWebSocketUrl(),
    reconnectMaxAttempts: 20,
    onOpen: () => {
      console.log('WebSocket connected');
      // Authenticate with the server
      ws.sendMessage({
        type: 'auth',
        token
      });
    },
    onMessage: (data) => {
      // Handle common message types
      if (data && data.type === 'error') {
        toast({
          title: 'WebSocket Error',
          description: data.message,
          variant: 'destructive',
        });
      } else if (data && data.type === 'auth_success') {
        console.log('WebSocket authenticated successfully');
      }
    },
    onClose: (event, reason) => {
      console.log(`WebSocket closed: ${reason}`);
      if (event.code === 1008) { // Policy violation (often auth failure)
        toast({
          title: 'Authentication Failed',
          description: 'Please log in again.',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      // Most WebSocket errors result in the onClose handler being called
      console.warn('WebSocket error occurred');
    }
  });
  
  // Update WebSocket URL when token changes
  useEffect(() => {
    if (token && !ws.connected && !ws.connecting) {
      ws.connect();
    }
  }, [token, ws]);
  
  // Exposed context value
  const contextValue = {
    ...ws,
    userId,
    isAuthenticated: !!userId,
    updateToken: (newToken) => {
      setToken(newToken);
      if (newToken) {
        try {
          const payload = JSON.parse(atob(newToken.split('.')[1]));
          if (payload && payload.id) {
            setUserId(payload.id);
          }
        } catch (err) {
          console.error('Error parsing JWT token:', err);
        }
      } else {
        setUserId(null);
      }
    }
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Hook to use the WebSocket context
 */
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};
