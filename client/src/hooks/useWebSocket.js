/**
 * useWebSocket.js
 * A React hook for using the WebSocketManager in components
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import WebSocketManager from '../services/WebSocketService';

/**
 * Custom hook for WebSocket communication in React components
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.url - WebSocket URL to connect to 
 * @param {Object} options.connectionParams - Additional connection parameters
 * @param {boolean} options.autoConnect - Whether to connect automatically (default: true)
 * @param {boolean} options.reconnectOnMount - Whether to reconnect when component mounts (default: true)
 * @param {number} options.pingInterval - Interval for sending pings in ms (default: 20000)
 * @param {number} options.reconnectMaxAttempts - Maximum reconnection attempts (default: 10)
 * @param {function} options.onMessage - Callback for messages
 * @param {function} options.onOpen - Callback for connection open
 * @param {function} options.onClose - Callback for connection close
 * @param {function} options.onError - Callback for errors
 * @returns {Object} WebSocket hook state and methods
 */
const useWebSocket = ({
  url,
  connectionParams = {},
  autoConnect = true,
  reconnectOnMount = true,
  pingInterval = 20000,
  reconnectMaxAttempts = 10,
  onMessage = null,
  onOpen = null,
  onClose = null,
  onError = null
}) => {
  // Reference to the WebSocketManager instance
  const wsManagerRef = useRef(null);
  
  // State for connection status and last message
  const [connectionState, setConnectionState] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  
  // Initialize the WebSocketManager
  useEffect(() => {
    wsManagerRef.current = new WebSocketManager({
      pingInterval,
      reconnectMaxAttempts,
      debug: true
    });
    
    // Set up event handlers
    wsManagerRef.current.onOpen(event => {
      if (onOpen) onOpen(event);
    });
    
    wsManagerRef.current.onMessage((data, event) => {
      setLastMessage(data);
      if (onMessage) onMessage(data, event);
    });
    
    wsManagerRef.current.onClose((event, reason) => {
      if (onClose) onClose(event, reason);
    });
    
    wsManagerRef.current.onError(event => {
      if (onError) onError(event);
    });
    
    wsManagerRef.current.onStateChange((newState, oldState) => {
      setConnectionState(newState);
      
      // Track reconnection attempts
      if (newState === 'connecting' && oldState === 'disconnected') {
        setReconnectAttempt(prev => prev + 1);
      } else if (newState === 'connected') {
        setReconnectAttempt(0);
      }
    });
    
    // Connect automatically if requested
    if (url && autoConnect) {
      wsManagerRef.current.connect(url, connectionParams);
    }
    
    // Cleanup on unmount
    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.disconnect(1000, 'Component unmounted');
      }
    };
  }, []);
  
  // Reconnect if URL changes
  useEffect(() => {
    if (!url || !wsManagerRef.current) return;
    
    // Only reconnect if we're supposed to be connected
    if (reconnectOnMount) {
      wsManagerRef.current.connect(url, connectionParams);
    }
  }, [url, reconnectOnMount]);
  
  // Function to send a message
  const sendMessage = useCallback((message) => {
    if (!wsManagerRef.current) return false;
    return wsManagerRef.current.sendMessage(message);
  }, []);
  
  // Function to manually connect
  const connect = useCallback(() => {
    if (!wsManagerRef.current || !url) return;
    wsManagerRef.current.connect(url, connectionParams);
  }, [url, connectionParams]);
  
  // Function to manually disconnect
  const disconnect = useCallback((code, reason) => {
    if (!wsManagerRef.current) return;
    wsManagerRef.current.disconnect(code, reason);
  }, []);
  
  return {
    connectionState,
    connected: connectionState === 'connected',
    connecting: connectionState === 'connecting',
    disconnected: connectionState === 'disconnected',
    lastMessage,
    reconnectAttempt,
    sendMessage,
    connect,
    disconnect
  };
};

export default useWebSocket;