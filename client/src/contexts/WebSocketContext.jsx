/**
 * WebSocketContext.jsx
 * A React context provider for WebSocket connections
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import webSocketService from '../services/WebSocketService2';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

// Create the context
const WebSocketContext = createContext(null);

/**
 * WebSocketProvider component
 * Provides WebSocket functionality throughout the application
 */
export const WebSocketProvider = ({ children }) => {
  const { toast } = useToast();
  const { token, user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [groups, setGroups] = useState([]);
  const [groupMessages, setGroupMessages] = useState({});
  const [chatPartners, setChatPartners] = useState([]);
  const [directMessages, setDirectMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Connect to WebSocket when component mounts or auth state changes
  useEffect(() => {
    if (token && user) {
      // Set loading state while connecting
      setLoading(true);
      setError(null);
      
      webSocketService.connect(token)
        .then(() => {
          console.log('WebSocket connected and authenticated');
          setConnected(true);
          setConnectionStatus('connected');
          // Fetch initial data
          fetchGroups();
        })
        .catch(err => {
          console.error('WebSocket connection error:', err);
          setError(err.message);
          setConnectionStatus('error');
          toast({
            title: 'Connection Error',
            description: err.message,
            variant: 'destructive'
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
    
    // Clean up on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, [token, user, toast]);

  // Setup event listeners for WebSocket events
  useEffect(() => {
    // Status change handler
    const handleStatusChange = (data) => {
      setConnectionStatus(data.status);
      if (data.status === 'connected') {
        setConnected(true);
      } else if (data.status === 'disconnected' || data.status === 'failed') {
        setConnected(false);
      }
    };
    
    // Error handler
    const handleError = (data) => {
      setError(data.message || 'An unknown error occurred');
      toast({
        title: 'WebSocket Error',
        description: data.message || 'An unknown error occurred',
        variant: 'destructive'
      });
    };
    
    // Group message handler
    const handleGroupMessage = (data) => {
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
        
        // If it's an update to an existing message
        return {
          ...prev,
          [groupId]: messages.map(msg => 
            (msg.tempId && msg.tempId === data.tempId) || msg.id === data.id 
              ? { ...msg, ...data } 
              : msg
          )
        };
      });
    };
    
    // Group message history handler
    const handleGroupMessageHistory = (data) => {
      if (data.groupId && data.messages) {
        setGroupMessages(prev => ({
          ...prev,
          [data.groupId]: data.messages
        }));
      }
    };
    
    // Direct message handler
    const handleDirectMessage = (data) => {
      setDirectMessages(prev => {
        const partnerId = data.senderId === user?.id ? data.recipientId : data.senderId;
        const messages = prev[partnerId] || [];
        
        // If it's a new message
        if (!messages.some(msg => msg.id === data.id)) {
          return {
            ...prev,
            [partnerId]: [...messages, data]
          };
        }
        
        // If it's an update to an existing message
        return {
          ...prev,
          [partnerId]: messages.map(msg => 
            (msg.tempId && msg.tempId === data.tempId) || msg.id === data.id 
              ? { ...msg, ...data } 
              : msg
          )
        };
      });
    };
    
    // Direct message history handler
    const handleDirectMessageHistory = (data) => {
      if (data.partnerId && data.messages) {
        setDirectMessages(prev => ({
          ...prev,
          [data.partnerId]: data.messages
        }));
      }
    };
    
    // Register event listeners
    webSocketService.addEventListener('status:change', handleStatusChange);
    webSocketService.addEventListener('error', handleError);
    webSocketService.addEventListener('group:message', handleGroupMessage);
    webSocketService.addEventListener('group:message:ack', handleGroupMessage);
    webSocketService.addEventListener('group:message:history', handleGroupMessageHistory);
    webSocketService.addEventListener('direct:message', handleDirectMessage);
    webSocketService.addEventListener('direct:message:ack', handleDirectMessage);
    webSocketService.addEventListener('direct:message:history', handleDirectMessageHistory);
    
    // Clean up listeners on unmount
    return () => {
      webSocketService.removeEventListener('status:change', handleStatusChange);
      webSocketService.removeEventListener('error', handleError);
      webSocketService.removeEventListener('group:message', handleGroupMessage);
      webSocketService.removeEventListener('group:message:ack', handleGroupMessage);
      webSocketService.removeEventListener('group:message:history', handleGroupMessageHistory);
      webSocketService.removeEventListener('direct:message', handleDirectMessage);
      webSocketService.removeEventListener('direct:message:ack', handleDirectMessage);
      webSocketService.removeEventListener('direct:message:history', handleDirectMessageHistory);
    };
  }, [toast, user]);

  // Fetch groups from API
  const fetchGroups = useCallback(async () => {
    if (!token || !user) return;
    
    setLoading(true);
    try {
      const groups = await webSocketService.fetchGroupChats();
      setGroups(groups);
    } catch (err) {
      console.error('Error fetching group chats:', err);
      setError(`Failed to fetch groups: ${err.message}`);
      toast({
        title: 'Error',
        description: `Failed to fetch groups: ${err.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [token, user, toast]);

  // Get message history for a group
  const getGroupMessageHistory = useCallback((groupId, options = {}) => {
    return webSocketService.getGroupMessageHistory(groupId, options);
  }, []);

  // Send a message to a group
  const sendGroupMessage = useCallback((groupId, content) => {
    return webSocketService.sendGroupMessage(groupId, content);
  }, []);

  // Mark group messages as read
  const markGroupMessagesAsRead = useCallback((groupId) => {
    return webSocketService.markGroupMessagesAsRead(groupId);
  }, []);

  // Create a new group
  const createGroup = useCallback((groupData) => {
    return webSocketService.createGroup(groupData)
      .then(response => {
        // Refresh groups after creation
        fetchGroups();
        return response;
      });
  }, [fetchGroups]);

  // Update a group's name
  const updateGroupName = useCallback((groupId, name) => {
    return webSocketService.updateGroupName(groupId, name)
      .then(response => {
        // Update the local group state
        setGroups(prev => 
          prev.map(group => 
            group.id === groupId ? { ...group, name } : group
          )
        );
        return response;
      });
  }, []);

  // Add a member to a group
  const addGroupMember = useCallback((groupId, userId) => {
    return webSocketService.addGroupMember(groupId, userId)
      .then(response => {
        // Refresh groups to get updated member list
        fetchGroups();
        return response;
      });
  }, [fetchGroups]);

  // Remove a member from a group
  const removeGroupMember = useCallback((groupId, userId) => {
    return webSocketService.removeGroupMember(groupId, userId)
      .then(response => {
        // Refresh groups to get updated member list
        fetchGroups();
        return response;
      });
  }, [fetchGroups]);

  // Leave a group
  const leaveGroup = useCallback((groupId) => {
    return webSocketService.leaveGroup(groupId)
      .then(response => {
        // Remove the group from local state
        setGroups(prev => prev.filter(group => group.id !== groupId));
        return response;
      });
  }, []);

  // Delete a group
  const deleteGroup = useCallback((groupId) => {
    return webSocketService.deleteGroup(groupId)
      .then(response => {
        // Remove the group from local state
        setGroups(prev => prev.filter(group => group.id !== groupId));
        return response;
      });
  }, []);

  // Fetch chat partners from API
  const fetchPartners = useCallback(async () => {
    if (!token || !user) return;
    
    setLoading(true);
    try {
      const partners = await webSocketService.fetchChatPartners();
      setChatPartners(partners);
    } catch (err) {
      console.error('Error fetching chat partners:', err);
      setError(`Failed to fetch chat partners: ${err.message}`);
      toast({
        title: 'Error',
        description: `Failed to fetch chat partners: ${err.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [token, user, toast]);

  // Get message history with a direct message partner
  const getDirectMessageHistory = useCallback((partnerId, options = {}) => {
    return webSocketService.getDirectMessageHistory(partnerId, options);
  }, []);

  // Send a direct message to a user
  const sendDirectMessage = useCallback((recipientId, content) => {
    return webSocketService.sendDirectMessage(recipientId, content);
  }, []);

  // Mark direct messages as read
  const markDirectMessagesAsRead = useCallback((partnerId) => {
    return webSocketService.markDirectMessagesAsRead(partnerId);
  }, []);

  // Context value to be provided
  const contextValue = {
    connected,
    connectionStatus,
    loading,
    error,
    groups,
    groupMessages,
    chatPartners,
    directMessages,
    // Group functions
    getGroupMessageHistory,
    sendGroupMessage,
    markGroupMessagesAsRead,
    createGroup,
    updateGroupName,
    addGroupMember,
    removeGroupMember,
    leaveGroup,
    deleteGroup,
    // Direct message functions
    getDirectMessageHistory,
    sendDirectMessage,
    markDirectMessagesAsRead,
    // Refreshers
    refreshGroups: fetchGroups,
    refreshPartners: fetchPartners
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
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
