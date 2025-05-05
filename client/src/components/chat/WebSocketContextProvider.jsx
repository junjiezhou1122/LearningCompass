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
 * and for group chats
 */
export const WebSocketContextProvider = ({ children }) => {
  const { toast } = useToast();
  const { token, user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [mutualFollowers, setMutualFollowers] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [groupMessages, setGroupMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);
        setConnected(false);
        setConnectionStatus('disconnected');
        clearHeartbeat();
        
        // Check for abnormal closure (code 1006)
        if (event.code === 1006) {
          console.warn('Abnormal WebSocket closure detected (Code 1006)');
          setError({
            message: 'Connection lost unexpectedly. This may indicate network issues.'
          });
        }
        
        // Reconnect unless it was a normal closure
        if (event.code !== 1000) {
          scheduleReconnect();
        }
      };
      
      // Connection error
      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        // Create a structured error object with more details
        const errorObj = {
          message: 'Connection to chat service failed',
          originalError: error
        };
        
        // Set the error in state for UI display
        setError(errorObj);
        
        // Log detailed diagnostics
        console.log('WebSocket URL:', getWebSocketUrl());
        console.log('User authenticated:', !!token);
        
        // Only show toast in certain conditions to avoid spamming
        if (reconnectAttempts.current === 0 || reconnectAttempts.current === 5) {
          toast({
            title: 'Connection Error',
            description: 'Could not connect to chat server. Attempting to reconnect...',
            variant: 'destructive'
          });
        }
        
        // The onclose handler will trigger reconnect
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
          // Handle group chat messages
          else if (data.type === 'group_chat_message') {
            // Dispatch a custom event for group chat message
            window.dispatchEvent(new CustomEvent('ws:group_message', {
              detail: data
            }));
          }
          // Handle group message delivery confirmation
          else if (data.type === 'group_message_sent') {
            // Dispatch a custom event for group message acknowledgment
            window.dispatchEvent(new CustomEvent('ws:group_message_ack', {
              detail: data
            }));
          }
          // Handle group messages marked as read confirmation
          else if (data.type === 'marked_group_read_success') {
            // Dispatch event for confirmation of marking group messages as read
            window.dispatchEvent(new CustomEvent('ws:group_message_read', {
              detail: data
            }));
          }
          // Handle group message history response
          else if (data.type === 'group_message_history') {
            // Dispatch event for received message history
            window.dispatchEvent(new CustomEvent('ws:group_message_history', {
              detail: data
            }));
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
    const maxAttempts = 20; // Increased from 10 to 20 for better resilience
    
    if (reconnectAttempts.current <= maxAttempts) {
      // Update connection status to show reconnect attempt
      setConnectionStatus(`reconnecting:${reconnectAttempts.current}`);
      
      // Calculate delay with exponential backoff, but cap it at 30 seconds
      const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts.current - 1), 30000);
      console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxAttempts})`);
      
      // For first few attempts, don't show a toast to avoid UI spam
      if (reconnectAttempts.current === 3) {
        toast({
          title: 'Connection Issues',
          description: 'Trying to reconnect to chat service...',
          variant: 'default'
        });
      }
      
      reconnectTimeout.current = setTimeout(() => {
        console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxAttempts})`);
        connect();
      }, delay);
    } else {
      console.log('Max reconnection attempts reached');
      setConnectionStatus('failed');
      setError({
        message: 'Could not connect to chat service after multiple attempts. Please refresh the page or try again later.'
      });
      toast({
        title: 'Connection Failed',
        description: 'Could not connect to chat service after multiple attempts. Please refresh the page.',
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
  // Helper function to safely parse JSON
  const safeJsonParse = useCallback(async (response) => {
    // Check if response is valid
    if (!response) throw new Error('Empty response received');
    
    // First check the content type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      // Not JSON, so try to read the text
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 100) + '...');
      throw new Error('Expected JSON response but received HTML or other format');
    }
    
    try {
      return await response.json();
    } catch (err) {
      // If still error parsing, try to get the text to see what happened
      try {
        const text = await response.text();
        console.error('Failed to parse JSON from response:', text.substring(0, 100) + '...');
      } catch (textErr) {
        console.error('Failed to parse response body at all');
      }
      throw new Error('Invalid JSON response received');
    }
  }, []);
  
  // Fetch user's group chats
  const fetchGroupChats = useCallback(async () => {
    if (!user || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching group chats with token:', token ? 'token-present' : 'no-token');
      // Updated to use correct API path
      const response = await fetch('/api/chat/groups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await safeJsonParse(response);
        console.log('Group chats data:', data);
        setGroupChats(data);
      } else {
        console.error(`Failed to fetch group chats: ${response.status} ${response.statusText}`);
        // Try to get error details if possible
        try {
          const errorText = await response.text();
          console.error('Error response:', errorText.substring(0, 200));
        } catch (e) {
          // Ignore if we can't read the error text
        }
        setError(`Failed to fetch group chats: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching group chats:', error);
      setError(error.message || 'Error fetching group chats');
      // Add more detailed logging
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.log('Network error detected - check if server is running');
      }
    } finally {
      setLoading(false);
    }
  }, [user, token, safeJsonParse]);
  
  // Create a new group chat
  const createGroup = useCallback(async (groupData) => {
    if (!user || !token) {
      throw new Error('You must be logged in to create a group');
    }
    
    try {
      // Updated to use correct API path
      const response = await fetch('/api/chat/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(groupData)
      });
      
      if (!response.ok) {
        try {
          const errorData = await safeJsonParse(response);
          throw new Error(errorData.message || 'Failed to create group');
        } catch (parseError) {
          throw new Error(`Failed to create group: ${response.status} ${response.statusText}`);
        }
      }
      
      const newGroup = await safeJsonParse(response);
      setGroupChats(prev => [...prev, newGroup]);
      return newGroup;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }, [user, token, safeJsonParse]);
  
  // Add a member to a group
  const addGroupMember = useCallback(async (groupId, userId) => {
    if (!user || !token) {
      throw new Error('You must be logged in to add a member');
    }
    
    try {
      // Updated to use correct API path
      const response = await fetch(`/api/chat/groups/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add member');
      }
      
      // Update the group in state
      fetchGroupChats();
      return true;
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  }, [user, token, fetchGroupChats]);
  
  // Remove a member from a group
  const removeGroupMember = useCallback(async (groupId, userId) => {
    if (!user || !token) {
      throw new Error('You must be logged in to remove a member');
    }
    
    try {
      // Updated to use correct API path
      const response = await fetch(`/api/chat/groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove member');
      }
      
      // If removing self (leaving group), update group list
      if (userId === user.id) {
        setGroupChats(prev => prev.filter(group => group.id !== groupId));
      } else {
        // Otherwise just refresh the group data
        fetchGroupChats();
      }
      
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }, [user, token, fetchGroupChats]);
  
  // Update group details
  const updateGroup = useCallback(async (groupId, groupData) => {
    if (!user || !token) {
      throw new Error('You must be logged in to update a group');
    }
    
    try {
      // Updated to use correct API path
      const response = await fetch(`/api/chat/groups/${groupId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(groupData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update group');
      }
      
      const updatedGroup = await response.json();
      setGroupChats(prev => prev.map(group => 
        group.id === groupId ? updatedGroup : group
      ));
      return updatedGroup;
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }, [user, token]);
  
  // Delete a group
  const deleteGroup = useCallback(async (groupId) => {
    if (!user || !token) {
      throw new Error('You must be logged in to delete a group');
    }
    
    try {
      // Updated to use correct API path
      const response = await fetch(`/api/chat/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete group');
      }
      
      // Remove the group from state
      setGroupChats(prev => prev.filter(group => group.id !== groupId));
      if (activeGroupId === groupId) {
        setActiveGroupId(null);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }, [user, token, activeGroupId]);
  
  // Request group message history
  const getGroupMessageHistory = useCallback((groupId, options = {}) => {
    if (!connected || !ws.current) {
      console.log('Cannot request group message history: not connected');
      return false;
    }
    
    try {
      ws.current.send(JSON.stringify({
        type: 'get_group_message_history',
        groupId,
        ...options
      }));
      return true;
    } catch (error) {
      console.error('Error requesting group message history:', error);
      return false;
    }
  }, [connected]);
  
  // Mark group messages as read
  const markGroupMessagesAsRead = useCallback((groupId) => {
    if (!connected || !ws.current) {
      console.log('Cannot mark group messages as read: not connected');
      return false;
    }
    
    try {
      ws.current.send(JSON.stringify({
        type: 'mark_group_read',
        groupId
      }));
      return true;
    } catch (error) {
      console.error('Error marking group messages as read:', error);
      return false;
    }
  }, [connected]);
  
  // Set the active group ID
  const setActiveGroup = useCallback((groupId) => {
    setActiveGroupId(groupId);
    
    // Fetch messages for this group if not already loaded
    if (groupId && !groupMessages[groupId]) {
      getGroupMessageHistory(groupId);
    }
    
    // Mark messages as read when selecting a group
    if (groupId) {
      markGroupMessagesAsRead(groupId);
    }
  }, [groupMessages, getGroupMessageHistory, markGroupMessagesAsRead]);

  // Handle WebSocket group message event
  const handleGroupMessageEvent = useCallback((event) => {
    const data = event.detail;
    
    if (data.type === 'group_chat_message' || data.type === 'group_message_sent') {
      setGroupMessages(prev => {
        const groupId = data.groupId;
        const messages = prev[groupId] || [];
        
        // If it's a new message
        if (!messages.some(msg => msg.id === data.id)) {
          return {
            ...prev,
            [groupId]: [...messages, data]
          };
        }
        
        // If it's a message update (like a delivery confirmation)
        return {
          ...prev,
          [groupId]: messages.map(msg => 
            (msg.tempId && msg.tempId === data.tempId) || msg.id === data.id 
              ? { ...msg, ...data } 
              : msg
          )
        };
      });
    } else if (data.type === 'group_message_history') {
      // Handle message history response
      setGroupMessages(prev => ({
        ...prev,
        [data.groupId]: data.messages || []
      }));
    }
  }, []);
  
  // Handle group message read status updates
  const handleGroupMessageReadEvent = useCallback((event) => {
    const data = event.detail;
    
    if (data.type === 'group_message_read') {
      // Update read status of messages for the group
      setGroupMessages(prev => {
        const groupId = data.groupId;
        const messages = prev[groupId] || [];
        
        return {
          ...prev,
          [groupId]: messages.map(msg => ({
            ...msg,
            readBy: data.userId ? 
              [...(msg.readBy || []), data.userId] : 
              msg.readBy
          }))
        };
      });
    }
  }, []);
  
  // Add event listeners for WebSocket events
  useEffect(() => {
    // Group message events
    window.addEventListener('ws:group_message', handleGroupMessageEvent);
    window.addEventListener('ws:group_message_ack', handleGroupMessageEvent);
    window.addEventListener('ws:group_message_history', handleGroupMessageEvent);
    window.addEventListener('ws:group_message_read', handleGroupMessageReadEvent);
    
    return () => {
      window.removeEventListener('ws:group_message', handleGroupMessageEvent);
      window.removeEventListener('ws:group_message_ack', handleGroupMessageEvent);
      window.removeEventListener('ws:group_message_history', handleGroupMessageEvent);
      window.removeEventListener('ws:group_message_read', handleGroupMessageReadEvent);
    };
  }, [handleGroupMessageEvent, handleGroupMessageReadEvent]);
  
  // Effects

  // Connect to WebSocket when component mounts or token/user changes
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
  
  // Fetch group chats when connected
  useEffect(() => {
    if (connected && user && token) {
      fetchGroupChats();
    }
  }, [connected, user, token, fetchGroupChats]);
  
  // Local storage for persisting group messages
  useEffect(() => {
    // Load group messages from localStorage when mounting
    try {
      const savedGroupMessages = localStorage.getItem('groupMessages');
      if (savedGroupMessages) {
        setGroupMessages(JSON.parse(savedGroupMessages));
      }
    } catch (error) {
      console.error('Error loading group messages from localStorage:', error);
    }
  }, []);
  
  // Save group messages to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem('groupMessages', JSON.stringify(groupMessages));
    } catch (error) {
      console.error('Error saving group messages to localStorage:', error);
    }
  }, [groupMessages]);
  
  // Send a group message through WebSocket
  const sendGroupMessage = useCallback((message) => {
    if (!connected || !ws.current) {
      // Queue the message for later
      messageQueue.current.push({
        type: 'group_chat_message',
        ...message
      });
      console.log('Group message queued for later sending');
      return false;
    }
    
    try {
      ws.current.send(JSON.stringify({
        type: 'group_chat_message',
        ...message
      }));
      return true;
    } catch (error) {
      console.error('Error sending group message:', error);
      messageQueue.current.push({
        type: 'group_chat_message',
        ...message
      });
      return false;
    }
  }, [connected]);
  
  // Note: Order of function definitions is important
  // getGroupMessageHistory and markGroupMessagesAsRead must be defined before setActiveGroup
  
  // The context value
  const value = {
    // Connection state
    connected,
    connectionStatus,
    loading,
    error,
    
    // Direct message data & methods
    mutualFollowers,
    sendMessage,
    updateUserStatus,
    
    // Group chat data & methods
    groupChats,
    activeGroupId,
    groupMessages,
    fetchGroupChats,
    createGroup,
    addGroupMember,
    removeGroupMember,
    updateGroup,
    deleteGroup,
    setActiveGroup,
    sendGroupMessage,
    getGroupMessageHistory,
    markGroupMessagesAsRead
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
