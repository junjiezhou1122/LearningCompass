/**
 * use-chat-messaging.js
 * Enhanced custom hook for handling chat messaging operations with better
 * error handling and connection management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './use-toast';

/**
 * Custom hook for managing chat messaging operations
 * 
 * @param {Object} options Configuration options
 * @param {Object} options.webSocket WebSocket context from useWebSocketContext
 * @param {number} options.messagesPerPage Number of messages to load per page
 * @returns {Object} Chat messaging state and methods
 */
export function useMessaging({
  webSocket,
  messagesPerPage = 15
}) {
  // Authentication and toast
  const { token } = useAuth();
  const { toast } = useToast();
  
  // Chat state
  const [partners, setPartners] = useState([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // Connection state
  const [isPolling, setIsPolling] = useState(false);
  
  // Refs to track message operations
  const pendingMessagesRef = useRef(new Map());
  const messageRetriesRef = useRef(new Map());
  const pollingTimeoutRef = useRef(null);
  
  /**
   * Fetch chat partners from the API
   */
  const fetchPartners = useCallback(async () => {
    if (!token) return;
    
    try {
      setIsLoadingPartners(true);
      const response = await fetch('/api/chat/partners', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chat partners: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setPartners(data);
    } catch (error) {
      console.error('Error fetching chat partners:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat partners',
        variant: 'destructive',
      });
      setPartners([]);
    } finally {
      setIsLoadingPartners(false);
    }
  }, [token, toast]);
  
  /**
   * Load messages for a specific chat conversation
   * @param {number} partnerId Partner ID
   * @param {boolean} loadOlder Whether to load older messages (for pagination)
   */
  const loadMessages = useCallback(async (partnerId, loadOlder = false) => {
    if (!token || !partnerId) return [];
    
    try {
      // Only reset message state when loading a new conversation
      if (!loadOlder) {
        setMessages([]);
        setPage(1);
        setHasMoreMessages(true);
      }
      
      setIsLoadingMessages(true);
      
      const response = await fetch(`/api/chat/messages/${partnerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
      }
      
      const allMessages = await response.json();
      
      // Sort messages by date (oldest to newest)
      const sortedMessages = [...allMessages].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      // Handle pagination
      const totalMessages = sortedMessages.length;
      const currentPage = loadOlder ? page + 1 : 1;
      const startIndex = Math.max(0, totalMessages - currentPage * messagesPerPage);
      const endIndex = totalMessages;
      const paginatedMessages = sortedMessages.slice(startIndex, endIndex);
      
      // Update message state
      if (loadOlder) {
        // Prepend older messages to existing ones, avoiding duplicates
        setMessages(prev => [
          ...paginatedMessages.filter(msg => 
            !prev.some(existing => existing.id === msg.id)
          ),
          ...prev
        ]);
        setPage(currentPage);
      } else {
        // Replace all messages
        setMessages(paginatedMessages);
      }
      
      // Update pagination state
      setHasMoreMessages(startIndex > 0);
      
      // Mark messages as read
      if (sortedMessages.length > 0) {
        markMessagesAsRead(partnerId);
      }
      
      return paginatedMessages;
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoadingMessages(false);
    }
  }, [token, page, messagesPerPage, toast]);
  
  /**
   * Load older messages (for infinite scrolling)
   */
  const loadOlderMessages = useCallback(() => {
    if (!activeChat || isLoadingMessages || !hasMoreMessages) return;
    return loadMessages(activeChat.id, true);
  }, [activeChat, isLoadingMessages, hasMoreMessages, loadMessages]);
  
  /**
   * Send a message to a partner
   * @param {string} content Message content
   * @param {number} receiverId Recipient ID
   * @returns {Object} Result object with tempId and success status
   */
  const sendMessage = useCallback((content, receiverId) => {
    if (!content || !receiverId) {
      return { sent: false, tempId: null };
    }
    
    // Create a temporary message object to display immediately
    const tempId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const tempMessage = {
      id: tempId,
      content,
      senderId: webSocket?.userId, // Using optional chaining for safety
      receiverId,
      createdAt: new Date().toISOString(),
      isPending: true,
      isRead: false,
      isError: false,
      isRetrying: false,
    };
    
    // Add to UI immediately
    setMessages(prev => [...prev, tempMessage]);
    
    // Track pending message
    pendingMessagesRef.current.set(tempId, tempMessage);
    messageRetriesRef.current.set(tempId, 0);
    
    // Try primary sending mechanism (WebSocket)
    let sent = false;
    if (webSocket?.connected) {
      // Send via WebSocket with retry capability
      const result = webSocket.sendWithRetry(content, receiverId, activeChat?.id);
      sent = result.sent;
      
      // If WebSocket send failed immediately, we'll try fallback mechanism
      if (!sent) {
        console.warn(`WebSocket send failed for message ${tempId}, using fallback`);
      }
    } else {
      console.warn('WebSocket not connected, using fallback mechanism');
    }
    
    // Fallback: If WebSocket failed or is not connected, try regular API
    if (!sent) {
      // Use REST API as fallback
      fallbackSendMessage(content, receiverId, tempId)
        .then(success => {
          if (success) {
            console.log(`Fallback message delivery succeeded for ${tempId}`);
          } else {
            console.error(`Fallback message delivery failed for ${tempId}`);
            // Mark as error after delay
            setTimeout(() => {
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === tempId 
                    ? { ...msg, isError: true, isPending: false } 
                    : msg
                )
              );
            }, 5000);
          }
        });
    }
    
    return { sent, tempId };
  }, [webSocket, activeChat]);
  
  /**
   * Fallback mechanism to send messages via REST API
   */
  const fallbackSendMessage = useCallback(async (content, receiverId, tempId) => {
    if (!token || !content || !receiverId) return false;
    
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId,
          content,
          tempId
        })
      });
      
      if (!response.ok) {
        throw new Error(`API message send failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update UI with the real message ID
      if (data && data.id) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? {
              ...msg,
              id: data.id,
              isPending: false,
              isError: false
            } : msg
          )
        );
        
        // Clean up tracking
        pendingMessagesRef.current.delete(tempId);
        messageRetriesRef.current.delete(tempId);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error sending message via API:', error);
      return false;
    }
  }, [token]);
  
  /**
   * Retry sending a failed message
   * @param {string} tempId Temporary message ID
   */
  const retryMessage = useCallback((tempId) => {
    const message = pendingMessagesRef.current.get(tempId);
    if (!message || !activeChat) return false;
    
    // Update UI to show retrying status
    setMessages(prev => 
      prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, isPending: true, isError: false, isRetrying: true } 
          : msg
      )
    );
    
    // Track retry count
    const retryCount = (messageRetriesRef.current.get(tempId) || 0) + 1;
    messageRetriesRef.current.set(tempId, retryCount);
    
    // First try WebSocket if available
    if (webSocket?.connected) {
      // Create custom event for the WebSocketProvider to handle
      window.dispatchEvent(new CustomEvent('chat:message:retry', {
        detail: {
          message,
          receiverId: activeChat.id,
          conversationId: activeChat.id,
          originalTempId: tempId
        }
      }));
      
      return true;
    } else {
      // Fallback to REST API
      fallbackSendMessage(message.content, message.receiverId, tempId)
        .then(success => {
          if (!success) {
            // Mark as failed again
            setMessages(prev => 
              prev.map(msg => 
                msg.id === tempId 
                  ? { ...msg, isPending: false, isError: true, isRetrying: false } 
                  : msg
              )
            );
          }
        });
      
      return true;
    }
  }, [activeChat, webSocket, fallbackSendMessage]);
  
  /**
   * Mark messages as read
   * @param {number} partnerId Partner ID
   */
  const markMessagesAsRead = useCallback(async (partnerId) => {
    if (!token || !partnerId) return;
    
    try {
      // First try WebSocket if connected
      let sent = false;
      if (webSocket?.connected) {
        try {
          webSocket.sendMessage({
            type: 'mark_read',
            senderId: partnerId
          });
          sent = true;
        } catch (err) {
          console.warn('WebSocket read receipt failed, using API fallback');
        }
      }
      
      // Fallback to REST API
      if (!sent) {
        await fetch(`/api/chat/messages/${partnerId}/read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [token, webSocket]);
  
  // Load chat partners on mount
  useEffect(() => {
    if (token) {
      fetchPartners();
    }
  }, [token, fetchPartners]);
  
  // Polling mechanism for when WebSocket is not available
  useEffect(() => {
    // Start polling if we have an active chat but WebSocket is not connected
    const shouldPoll = activeChat && (!webSocket?.connected);
    
    const startPolling = () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
      
      // Set polling state for UI
      setIsPolling(true);
      
      // Poll every 5 seconds
      pollingTimeoutRef.current = setTimeout(async () => {
        if (activeChat) {
          console.log('WebSocket not connected, using polling fallback');
          await loadMessages(activeChat.id);
        }
        
        // Continue polling
        startPolling();
      }, 5000);
    };
    
    if (shouldPoll) {
      startPolling();
    } else {
      // Clear polling when WebSocket is connected or no active chat
      setIsPolling(false);
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    }
    
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, [activeChat, webSocket?.connected, loadMessages]);
  
  // Set up event listeners for message status updates
  useEffect(() => {
    // Message acknowledgment handler
    const handleMessageAck = (event) => {
      const { tempId, messageId, status } = event.detail;
      
      if (tempId && messageId) {
        // Update message in UI
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? {
              ...msg,
              id: messageId, // Replace temp ID with server ID
              isPending: false,
              isError: false,
              isRetrying: false
            } : msg
          )
        );
        
        // Remove from pending messages
        pendingMessagesRef.current.delete(tempId);
        messageRetriesRef.current.delete(tempId);
      }
    };
    
    // Message read receipt handler
    const handleReadReceipt = (event) => {
      const { messageId } = event.detail;
      
      if (messageId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, isRead: true } : msg
          )
        );
      }
    };
    
    // New message handler
    const handleNewMessage = (event) => {
      const { message } = event.detail;
      
      if (message && activeChat && 
         (message.senderId === activeChat.id || message.receiverId === activeChat.id)) {
        // Add message to UI if it's part of current conversation
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(msg => msg.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
        
        // Mark as read immediately
        markMessagesAsRead(activeChat.id);
      }
    };
    
    // Message failure handler
    const handleMessageFailure = (event) => {
      const { tempId, permanent } = event.detail;
      
      if (tempId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? {
              ...msg,
              isPending: false,
              isError: true,
              isRetrying: false,
              permanent: !!permanent
            } : msg
          )
        );
      }
    };
    
    // Message retry status
    const handleMessageRetrying = (event) => {
      const { tempId } = event.detail;
      
      if (tempId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? {
              ...msg,
              isPending: true,
              isError: false,
              isRetrying: true
            } : msg
          )
        );
      }
    };
    
    // Add event listeners
    window.addEventListener('chat:message:ack', handleMessageAck);
    window.addEventListener('chat:message:read', handleReadReceipt);
    window.addEventListener('chat:message:received', handleNewMessage);
    window.addEventListener('chat:message:failed', handleMessageFailure);
    window.addEventListener('chat:message:retrying', handleMessageRetrying);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('chat:message:ack', handleMessageAck);
      window.removeEventListener('chat:message:read', handleReadReceipt);
      window.removeEventListener('chat:message:received', handleNewMessage);
      window.removeEventListener('chat:message:failed', handleMessageFailure);
      window.removeEventListener('chat:message:retrying', handleMessageRetrying);
    };
  }, [activeChat, markMessagesAsRead]);
  
  // Handle active chat changes
  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
    }
  }, [activeChat, loadMessages]);
  
  return {
    // State
    partners,
    isLoadingPartners,
    activeChat,
    messages,
    isLoadingMessages,
    hasMoreMessages,
    isPolling,
    
    // Connection state
    isWebSocketConnected: webSocket?.connected || false,
    connectionState: webSocket?.connectionState || 'disconnected',
    reconnectAttempt: webSocket?.reconnectAttempt || 0,
    
    // Actions
    setActiveChat,
    fetchPartners,
    loadMessages,
    loadOlderMessages,
    sendMessage,
    retryMessage,
    markMessagesAsRead
  };
}
