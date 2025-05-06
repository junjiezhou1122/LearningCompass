/**
 * WebSocketProvider.jsx
 * A context provider for WebSocket connections throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useWebSocket from '../../hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';
import { AuthContext } from '../../contexts/AuthContext';

// Create context for WebSocket
const WebSocketContext = createContext(null);

/**
 * Provider component for WebSocket functionality
 */
export const WebSocketProvider = ({ children }) => {
  const { toast } = useToast();
  const { token, user } = useContext(AuthContext); // Get token and user directly from AuthContext
  const [userId, setUserId] = useState(null);
  const [localToken, setLocalToken] = useState(() => {
    // Initialize with localStorage as fallback
    return localStorage.getItem('token');
  });
  
  // Extract user ID from token when it changes
  useEffect(() => {
    console.log('Token from AuthContext:', token ? `${token.substring(0, 15)}...` : 'null');
    console.log('User from AuthContext:', user ? `ID: ${user.id}` : 'null');
    
    // Use token from context, fallback to localStorage if needed
    const authToken = token || localToken;
    
    if (authToken) {
      setLocalToken(authToken); // Keep local copy updated
      
      try {
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        if (payload && payload.id) {
          setUserId(payload.id);
          console.log(`Extracted user ID from token: ${payload.id}`);
        }
      } catch (err) {
        console.error('Error parsing JWT token:', err);
      }
    } else if (user && user.id) {
      // Fallback to user object if available
      setUserId(user.id);
      console.log(`Using user ID from AuthContext: ${user.id}`);
    } else {
      console.warn('No authentication token or user available');
      setUserId(null);
    }
  }, [token, user, localToken]);
  
  // Determine WebSocket URL
  const getWebSocketUrl = () => {
    // Only connect if we have a token from either context or localStorage
    const authToken = token || localToken;
    if (!authToken) return null;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  };
  
  // Set up WebSocket connection
  const ws = useWebSocket({
    url: getWebSocketUrl(),
    reconnectMaxAttempts: 20,
    onOpen: () => {
      console.log('WebSocket connected, authenticating...');
      // Authenticate with the server
      const authToken = token || localToken;
      if (authToken) {
        console.log(`Sending authentication with token: ${authToken.substring(0, 15)}...`);
        ws.sendMessage({
          type: 'auth',
          token: authToken
        });
      } else {
        console.error('Cannot authenticate WebSocket - no token available');
      }
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
      } else if (data && data.type === 'new_message') {
        // Emit a global event for the message that ChatPage/NewChatPage can listen for
        const newMessageEvent = new CustomEvent('chat:message:received', {
          detail: { message: data.message }
        });
        window.dispatchEvent(newMessageEvent);
      } else if (data && data.type === 'message_ack') {
        // Emit a global event for message acknowledgment
        const ackEvent = new CustomEvent('chat:message:ack', {
          detail: { tempId: data.tempId, messageId: data.messageId }
        });
        window.dispatchEvent(ackEvent);
      } else if (data && data.type === 'message_read_receipt') {
        // Emit a global event for read receipts
        const readEvent = new CustomEvent('chat:message:read', {
          detail: { messageId: data.messageId }
        });
        window.dispatchEvent(readEvent);
      } else if (data && data.type === 'unread_messages') {
        // Emit a global event for unread messages
        const unreadEvent = new CustomEvent('chat:unread:messages', {
          detail: { count: data.count, messages: data.messages }
        });
        window.dispatchEvent(unreadEvent);
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
    const authToken = token || localToken;
    if (authToken && !ws.connected && !ws.connecting) {
      ws.connect();
    }
  }, [token, localToken, ws]);
  
  // Handler for abnormal WebSocket closures
  const handleAbnormalClosure = useCallback((event) => {
    console.warn('Abnormal WebSocket closure detected (Code 1006)');
    
    // Only show toast if we're not already reconnecting
    if (!ws.connecting) {
      toast({
        title: 'Connection Issues Detected',
        description: 'Attempting to restore connection automatically...',
        variant: 'warning',
      });
    }
    
    // The WebSocketService will handle reconnection automatically
    // but we can force an immediate reconnection here if needed
    if (!ws.connected && !ws.connecting) {
      ws.connect();
    }
  }, [toast, ws]);

  // Handler for message delivery failures
  const handleMessageFailure = useCallback((event) => {
    const { tempId, message } = event.detail;
    console.log(`Message delivery failed for ID: ${tempId}`);
    
    // Emit a global event that the ChatPage/NewChatPage can listen for
    const globalEvent = new CustomEvent('chat:message:failed', {
      detail: { tempId, message, error: 'Failed to deliver after multiple attempts' }
    });
    window.dispatchEvent(globalEvent);
    
    // Show a toast notification
    toast({
      title: 'Message Delivery Failed',
      description: 'The message could not be delivered. You can retry sending.',
      variant: 'destructive',
    });
  }, [toast]);

  // Handler for WebSocket connection failures
  const handleConnectionFailure = useCallback((event) => {
    const { attempts } = event.detail;
    console.error(`WebSocket connection failed after ${attempts} attempts`);
    
    toast({
      title: 'Connection Failed',
      description: 'Could not establish a connection to the server. Please check your network connection.',
      variant: 'destructive',
    });
  }, [toast]);
  
  // Listen for WebSocket service events
  useEffect(() => {
    // Add event listeners for the custom events from WebSocketService
    window.addEventListener('ws:message:failed', handleMessageFailure);
    window.addEventListener('ws:abnormal:closure', handleAbnormalClosure);
    window.addEventListener('ws:connection:failed', handleConnectionFailure);
    
    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('ws:message:failed', handleMessageFailure);
      window.removeEventListener('ws:abnormal:closure', handleAbnormalClosure);
      window.removeEventListener('ws:connection:failed', handleConnectionFailure);
    };
  }, [handleMessageFailure, handleAbnormalClosure, handleConnectionFailure]);
  
  // Handler for message retry events from elsewhere in the application
  const handleMessageRetry = useCallback((event) => {
    const { message, receiverId } = event.detail;
    
    if (!message || !receiverId) {
      console.error('Message retry event missing required data');
      return;
    }
    
    // Create message object for WebSocket
    const messageToSend = {
      type: 'chat_message',
      receiverId,
      content: message.content,
      tempId: `temp-${Date.now()}`
    };
    
    // Send the message and show toast
    ws.sendMessage(messageToSend);
    toast({
      title: 'Retrying message',
      description: 'Attempting to resend message...',
      variant: 'default',
    });
  }, [ws, toast]);
  
  // Add message retry event listener
  useEffect(() => {
    window.addEventListener('chat:message:retry', handleMessageRetry);
    
    return () => {
      window.removeEventListener('chat:message:retry', handleMessageRetry);
    };
  }, [handleMessageRetry]);

  // Exposed context value
  const contextValue = {
    ...ws,
    userId,
    isAuthenticated: !!userId,
    // updateToken is no longer needed, as we get the token from AuthContext
    // This ensures that token management is centralized in the AuthContext
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
