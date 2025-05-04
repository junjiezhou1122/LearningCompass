import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessagesSquare, MessageCircle, Send, User, Users, Search, CornerDownLeft, ArrowDown } from 'lucide-react';

const DEFAULT_WS_RECONNECT_TIMEOUT = 2000;

// Message cache to persist messages between page reloads
const messageCache = new Map();
const MESSAGES_PER_PAGE = 20; // Number of messages to load at once

export default function ChatPage() {
  const { user, isAuthenticated, token } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('direct');
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnectionOpen, setIsConnectionOpen] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesStartRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const previousMessagesLength = useRef(0); // Track previous message count to control auto-scrolling

  // Query to fetch user's chat partners
  const { data: chatPartners, isLoading: isLoadingPartners } = useQuery({
    queryKey: ['chat-partners'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await fetch('/api/chat/partners', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch chat partners');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Setup WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    
    // Close any existing connection before creating a new one
    if (socketRef.current) {
      console.log('Closing existing WebSocket connection before creating a new one');
      try {
        socketRef.current.close();
      } catch (err) {
        console.error('Error closing WebSocket:', err);
      }
    }

    const connectWebSocket = () => {
      // Determine the correct protocol (ws or wss)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket at:', wsUrl);

      try {
        // Create WebSocket connection
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;
        
        // Monitor connection state for debugging
        const connectionStateLog = setInterval(() => {
          if (socket) {
            const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
            console.log(`WebSocket connection state: ${states[socket.readyState]}`);
          } else {
            clearInterval(connectionStateLog);
          }
        }, 5000); // Log every 5 seconds

        socket.onopen = () => {
          console.log('WebSocket connection established successfully');
          setIsConnectionOpen(true);
          
          // Authenticate with the server
          console.log('Auth token available:', !!token);
          // Ensure we send token in the format expected by the server
          socket.send(JSON.stringify({
            type: 'auth',
            data: { token: token }
          }));
          
          // Additional log to confirm the exact auth payload
          console.log('Auth payload sent:', JSON.stringify({
            type: 'auth',
            data: { token: token }
          }));
          
          console.log('Sending authentication to WebSocket server');

          // Setup ping interval to keep connection alive
          const pingInterval = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'ping' }));
              console.log('Ping sent to server to keep connection alive');
            } else {
              console.log('Socket not open, clearing ping interval');
              clearInterval(pingInterval);
            }
          }, 30000);
          
          // If we have an active chat, request chat history immediately
          // after successful authentication
          if (activeChat) {
            setTimeout(() => {
              if (socket && socket.readyState === WebSocket.OPEN) {
                console.log('Auto-requesting chat history for active chat:', activeChat.id);
                socket.send(JSON.stringify({
                  type: 'get_chat_history',
                  data: { userId: activeChat.id }
                }));
              }
            }, 500); // Small delay to ensure auth is processed first
          }

          return () => {
            clearInterval(pingInterval);
            clearInterval(connectionStateLog);
          };
        };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);

          switch (data.type) {
            case 'direct_message':
              // Use requestAnimationFrame to debounce and wait for React's next render cycle
              requestAnimationFrame(() => {
                handleNewMessage(data.data);
              });
              break;
            case 'chat_history':
              handleChatHistory(data.data);
              break;
            case 'user_online':
              handleUserOnline(data.data.userId);
              break;
            case 'user_offline':
              handleUserOffline(data.data.userId);
              break;
            case 'error':
              toast({
                title: 'Chat Error',
                description: data.data.message,
                variant: 'destructive'
              });
              break;
            case 'pong':
              // Handle ping response (keep-alive)
              break;
            default:
              console.log('Unhandled message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, event.data);
        }
      };

      socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnectionOpen(false);
        
        // Log more detail about connection close
        if (event.wasClean) {
          console.log('WebSocket closed cleanly');
        } else {
          console.error('WebSocket connection died unexpectedly');
        }
        
        // Only attempt to reconnect if not a normal closure or closing due to component unmount
        // Normal closure = 1000, Going Away = 1001 (typically browser navigating away)  
        if (event.code !== 1000 && event.code !== 1001) {
          console.log('Scheduling reconnection attempt...');
          const reconnectTimer = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket after timeout...');
            connectWebSocket();
          }, DEFAULT_WS_RECONNECT_TIMEOUT);
          
          // Store the timer in a ref to be able to clear it if component unmounts
          // This helps prevent memory leaks and attempts to update state on unmounted components
          return () => {
            console.log('Clearing reconnection timer');
            clearTimeout(reconnectTimer);
          };
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error occurred:', error);
        // Don't immediately close, just log the error
        // The onclose handler will be called automatically if the error causes disconnection
        // This gives the WebSocket implementation a chance to recover if possible
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      // Attempt to reconnect after a short delay
      setTimeout(() => {
        console.log('Attempting to reconnect after connection setup error...');
        connectWebSocket();
      }, DEFAULT_WS_RECONNECT_TIMEOUT);
    }
    };

    connectWebSocket();

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [isAuthenticated, user?.id, token, toast]);

  // Fetch chat partners when authenticated
  useEffect(() => {
    if (chatPartners) {
      setContacts(chatPartners);
    }
  }, [chatPartners]);

  // Auto-scroll to bottom only when necessary, not on every message or history load
  useEffect(() => {
    // We only want to auto-scroll in these scenarios:
    // 1. When user sends their own message (handled in sendMessage function)
    // 2. When the very first load of messages occurs (handled in handleChatHistory)
    // For other cases (like receiving messages from others), don't auto-scroll
    
    // Update the previous message count for comparing later
    previousMessagesLength.current = messages.length;
  }, [messages]);

  // Request chat history when a chat is selected
  useEffect(() => {
    if (activeChat && socketRef.current) {
      // If connection is open, request immediately
      if (socketRef.current.readyState === WebSocket.OPEN) {
        console.log('Requesting chat history for user:', activeChat.id);
        socketRef.current.send(JSON.stringify({
          type: 'get_chat_history',
          data: { userId: activeChat.id }
        }));
      } else {
        // If connection isn't open yet, set up a check that tries again after a short delay
        console.log('WebSocket not ready, will retry requesting chat history');
        const checkInterval = setInterval(() => {
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            console.log('WebSocket now ready, requesting chat history for:', activeChat.id);
            socketRef.current.send(JSON.stringify({
              type: 'get_chat_history',
              data: { userId: activeChat.id }
            }));
            clearInterval(checkInterval);
          }
        }, 500); // Check every 500ms
        
        // Clean up interval on component unmount or chat change
        return () => clearInterval(checkInterval);
      }
      
      // Always set this user as the active recipient for future messages
      socketRef.current.activeRecipient = activeChat.id;
    }
  }, [activeChat]);

  // Handle new incoming message with cache support
  const handleNewMessage = (messageData) => {
    console.log('Received message:', messageData);
    
    // Check if the message belongs to the active chat
    // If there's no active chat, don't process the message
    const activeChatId = activeChat?.id;
    const messageRecipientId = parseInt(messageData.recipientId);
    const messageSenderId = parseInt(messageData.senderId);
    const currentUserId = parseInt(user?.id);
    
    console.log('Message belongs to chat:', 
      activeChatId === messageRecipientId || activeChatId === messageSenderId,
      'Active chat:', activeChatId,
      'Message recipient:', messageRecipientId,
      'Message sender:', messageSenderId);
    
    // Ensure the message has an ID for caching
    const messageId = messageData.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const processedMessage = {
      ...messageData,
      id: messageId,
      senderId: messageData.senderId || (messageData.sender && messageData.sender.id) || null,
      createdAt: messageData.createdAt ? new Date(messageData.createdAt) : new Date()
    };
    
    // Determine the chat partner ID (the other user in this conversation)
    const chatPartnerId = currentUserId === messageSenderId ? messageRecipientId : messageSenderId;
    
    // Add message to cache regardless of active chat
    if (!messageCache.has(chatPartnerId)) {
      messageCache.set(chatPartnerId, new Map());
    }
    
    // Only add to cache if it doesn't already exist
    const chatCache = messageCache.get(chatPartnerId);
    const messageExists = chatCache.has(messageId) || Array.from(chatCache.values()).some(
      msg => msg.content === processedMessage.content && 
             msg.senderId === processedMessage.senderId &&
             Math.abs(new Date(msg.createdAt) - new Date(processedMessage.createdAt)) < 1000
    );
    
    if (!messageExists) {
      chatCache.set(messageId, processedMessage);
      console.log(`Added message to cache for user ${chatPartnerId}. Cache now has ${chatCache.size} messages`);
    }
      
    // Only process messages relevant to the current active chat
    const isRelevantToActiveChat = 
      (activeChatId === messageRecipientId && currentUserId === messageSenderId) || 
      (activeChatId === messageSenderId && currentUserId === messageRecipientId);
    
    // If this is a message from/to the active chat, process it
    if (isRelevantToActiveChat || !activeChat) {
      // Log the sender ID and user ID to debug message alignment issue
      const senderIdNum = messageSenderId;
      const userIdNum = currentUserId;
      const isFromMe = !isNaN(senderIdNum) && !isNaN(userIdNum) && senderIdNum === userIdNum;
      console.log('Message sender ID:', messageData.senderId, '(', senderIdNum, ')');
      console.log('Current user ID:', user?.id, '(', userIdNum, ')');
      console.log('Is from me?', isFromMe);
      
      // Add message to state and ensure proper sorting
      setMessages(prevMessages => {
        // Check if this message is already in our list (avoid duplicates)
        const messageExistsInState = prevMessages.some(msg => 
          msg.id === processedMessage.id || 
          (msg.content === processedMessage.content && 
           msg.senderId === processedMessage.senderId &&
           Math.abs(new Date(msg.createdAt) - new Date(processedMessage.createdAt)) < 1000));
           
        if (messageExistsInState) {
          console.log('Message already exists in state, not adding duplicate');
          return prevMessages;
        }
        
        const newMessages = [...prevMessages, processedMessage];
        // Sort by timestamp to ensure consistent ordering
        return newMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
      
      // Only auto-scroll when message is from the current user (you send a message)
      // This prevents unwanted scrolling when receiving messages from others
      if (isFromMe) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      console.log('Message not for active chat, ignoring for current view');
      // TODO: Add a notification indicator for chats with unread messages
    }
    
    // Regardless of active chat, add to contacts list if this is a new contact
    // Only add to contacts list if this is a message from someone else (not self-messages)
    // and only if the contact doesn't already exist in the list
    if (messageData.sender && messageSenderId !== currentUserId && 
        !contacts.some(contact => contact.id === messageData.sender.id)) {
      console.log('Adding new contact from message:', messageData.sender);
      setContacts(prevContacts => [...prevContacts, messageData.sender]);
    }
  };

  // Handle received chat history with caching support
  const handleChatHistory = (data) => {
    console.log('Received chat history:', data);
    if (data.messages) {
      // Log only the first few messages to avoid console clutter
      const sampleSize = Math.min(data.messages.length, 3);
      for (let i = 0; i < sampleSize; i++) {
        const msg = data.messages[i];
        console.log(`Message ${i} - sender: ${msg.senderId}, receiver: ${msg.recipientId}, content: ${msg.content}`);
      }
      
      // Process messages to ensure all have senderId property
      const processedMessages = data.messages.map(msg => ({
        ...msg,
        id: msg.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        senderId: msg.senderId || (msg.sender && msg.sender.id) || null,
        // Ensure message times have correct format for sorting
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date()
      }));
      
      // Sort messages by time
      const sortedMessages = processedMessages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      // Check for duplicates before setting state
      const messageMap = new Map();
      sortedMessages.forEach(msg => messageMap.set(msg.id, msg));
      
      // Handle pagination logic and update message cache
      const isInitialLoad = !data.pagination || data.pagination.offset === 0;
      const chatId = activeChat?.id;
      
      if (chatId) {
        // Cache these messages for this chat
        if (!messageCache.has(chatId)) {
          messageCache.set(chatId, new Map());
        }
        
        // Add all messages to the cache
        const chatCache = messageCache.get(chatId);
        sortedMessages.forEach(msg => chatCache.set(msg.id, msg));
        
        // Check if we have more messages to load based on pagination info
        // We have more messages if we received the full page size
        setHasMoreMessages(data.pagination?.hasMore || sortedMessages.length >= MESSAGES_PER_PAGE);
        
        // If loading older messages, prepend them to the existing list
        if (!isInitialLoad && data.pagination?.offset > 0) {
          console.log('Loading older messages, appending to existing messages');
          setMessages(prevMessages => {
            // Create a set of existing message IDs for faster lookup
            const existingMessageIds = new Set(prevMessages.map(msg => msg.id));
            
            // Add only messages that don't already exist
            const newMessages = sortedMessages.filter(msg => !existingMessageIds.has(msg.id));
            console.log(`Adding ${newMessages.length} new messages to existing ${prevMessages.length}`);
            
            // Combine and sort all messages by time
            const combinedMessages = [...prevMessages, ...newMessages].sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
            
            return combinedMessages;
          });
          
          // Mark loading as complete
          setIsLoadingOlderMessages(false);
        } else {
          console.log('Initial message load, setting messages directly');
          // For initial load, just set the messages
          // When we get chat history, we want to prevent auto-scrolling that happens in the useEffect
          // Setting previousMessagesLength to a non-zero value prevents unwanted auto-scrolling
          previousMessagesLength.current = sortedMessages.length;
          
          // We're seeing only the most recent messages (up to MESSAGES_PER_PAGE)
          setMessages(sortedMessages);
          
          // Only scroll to bottom automatically if this is the first load of history
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    }
  };
  
  // Handle scroll events to detect scrolling near the top
  const handleScroll = useCallback((e) => {
    if (!scrollAreaRef.current) return;
    
    // Show scroll to bottom button when not at the bottom
    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // If we're more than 200px from the bottom, show the scroll-to-bottom button
      setShowScrollToBottom(distanceFromBottom > 200);
      
      // If we're near the top (first 50px) and have more messages, load them
      if (scrollTop < 50 && hasMoreMessages && !isLoadingOlderMessages) {
        loadOlderMessages();
      }
    }
  }, [hasMoreMessages, isLoadingOlderMessages]);
  
  // Function to scroll to the bottom of the messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  // Load older messages when scrolling to the top
  const loadOlderMessages = useCallback(() => {
    if (isLoadingOlderMessages || !hasMoreMessages || !activeChat || !socketRef.current) return;
    
    setIsLoadingOlderMessages(true);
    console.log('Loading older messages for chat with', activeChat.id);
    
    if (socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'get_chat_history',
        data: {
          userId: activeChat.id,
          offset: messages.length,
          limit: MESSAGES_PER_PAGE
        }
      }));
    } else {
      setIsLoadingOlderMessages(false);
      toast({
        title: 'Connection Error',
        description: 'Unable to load older messages. Please try again later.',
        variant: 'destructive'
      });
    }
  }, [activeChat, hasMoreMessages, isLoadingOlderMessages, messages.length, toast]);
  


  // Handle user online status update
  const handleUserOnline = (userId) => {
    setOnlineUsers(prev => new Set(prev).add(parseInt(userId)));
  };

  // Handle user offline status update
  const handleUserOffline = (userId) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(parseInt(userId));
      return newSet;
    });
  };

  // Send a new message
  const sendMessage = () => {
    if (!message.trim() || !activeChat || !socketRef.current) return;
    
    if (socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'direct_message',
        data: {
          recipientId: activeChat.id,
          content: message.trim()
        }
      }));
      
      setMessage('');
    } else {
      toast({
        title: 'Connection Error',
        description: 'Unable to send message. Please try again later.',
        variant: 'destructive'
      });
    }
  };

  // Select a chat with cache support
  const selectChat = (contact) => {
    // We're about to change chats, so set previousMessagesLength to non-zero
    // This prevents auto-scrolling when chat history loads for the new chat
    previousMessagesLength.current = 1;
    
    // Reset state for the new chat
    setActiveChat(contact);
    setHasMoreMessages(true);
    setIsLoadingOlderMessages(false);
    
    // Check if we have cached messages for this contact
    if (messageCache.has(contact.id)) {
      console.log(`Loading ${messageCache.get(contact.id).size} cached messages for chat with ${contact.id}`);
      // Convert Map values to array and sort by timestamp
      const cachedMessages = Array.from(messageCache.get(contact.id).values())
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      setMessages(cachedMessages);
      
      // Still request latest messages from server to make sure cache is up-to-date
      // But we don't need to clear the messages display while loading
      setTimeout(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'get_chat_history',
            data: { userId: contact.id }
          }));
        }
      }, 100);
    } else {
      // No cached messages, clear and wait for server response
      setMessages([]);
    }
  };

  // Filter contacts based on search query and exclude current user
  const filteredContacts = contacts
    .filter(contact => contact.id !== user?.id) // 排除自己
    .filter(contact => 
      contact.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.firstName && contact.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.lastName && contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  if (!isAuthenticated) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Chat</CardTitle>
            <CardDescription>Please sign in to access chat.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[75vh]">
        {/* Left sidebar */}
        <div className="md:col-span-1 border rounded-lg overflow-hidden">
          <div className="bg-slate-50 p-4 border-b">
            <Tabs defaultValue="direct" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="direct">Direct</TabsTrigger>
                <TabsTrigger value="groups">Groups</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="mt-3 relative">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <ScrollArea className="h-[calc(75vh-9rem)]">
            {isLoadingPartners ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeTab === 'direct' ? (
              <div className="divide-y">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map(contact => (
                    <div 
                      key={contact.id}
                      className={`p-3 cursor-pointer hover:bg-slate-50 flex items-center ${activeChat?.id === contact.id ? 'bg-slate-100' : ''} ${contact.id === user?.id ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-400' : ''}`}
                      onClick={() => selectChat(contact)}
                    >
                      <div className="relative">
                        <Avatar 
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent propagation to chat selection
                            // Use router navigation instead of direct window.location to avoid page refresh
                            const profileUrl = `/users/${contact.id}`;
                            // Open in new tab if modifier key is pressed
                            if (e.ctrlKey || e.metaKey) {
                              window.open(profileUrl, '_blank');
                            } else {
                              window.location.href = profileUrl;
                            }
                          }}
                        >
                          <AvatarFallback>{contact.username?.[0] || contact.firstName?.[0] || '?'}</AvatarFallback>
                          {contact.avatar && <AvatarImage src={contact.avatar} />}
                        </Avatar>
                        {onlineUsers.has(contact.id) && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                        )}
                      </div>
                      <div className="ml-3 flex-1 overflow-hidden">
                        <div className="font-medium truncate">
                          {contact.firstName && contact.lastName 
                            ? `${contact.firstName} ${contact.lastName}` 
                            : contact.username}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {/* Last message preview (if available) */}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No contacts found.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Group chat feature coming soon...
              </div>
            )}
          </ScrollArea>
        </div>
        
        {/* Chat area */}
        <div className="md:col-span-3 border rounded-lg flex flex-col overflow-hidden">
          {activeChat ? (
            <>
              <div className="bg-slate-50 p-4 border-b flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar 
                    className="cursor-pointer"
                    onClick={(e) => {
                      // Use router navigation instead of direct window.location to avoid page refresh
                      const profileUrl = `/users/${activeChat.id}`;
                      // Open in new tab if modifier key is pressed
                      if (e.ctrlKey || e.metaKey) {
                        window.open(profileUrl, '_blank');
                      } else {
                        window.location.href = profileUrl;
                      }
                    }}
                  >
                    <AvatarFallback>{activeChat.username?.[0] || activeChat.firstName?.[0] || '?'}</AvatarFallback>
                    {activeChat.avatar && <AvatarImage src={activeChat.avatar} />}
                  </Avatar>
                  <div className="ml-3">
                    <div className="font-medium">
                      {activeChat.firstName && activeChat.lastName 
                        ? `${activeChat.firstName} ${activeChat.lastName}` 
                        : activeChat.username}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {onlineUsers.has(activeChat.id) ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  title="Scroll to bottom"
                  className="flex items-center gap-1 text-xs"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Latest
                </Button>
              </div>
              
              <ScrollArea 
                className="flex-1 p-4" 
                ref={scrollAreaRef}
                onScroll={handleScroll}
              >
                {/* Loading indicator at the top for older messages */}
                <div ref={messagesStartRef} className="py-2 text-center">
                  {isLoadingOlderMessages && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
                      Loading older messages...
                    </div>
                  )}
                  {!isLoadingOlderMessages && hasMoreMessages && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={loadOlderMessages}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Load more messages
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {messages.length > 0 ? (
                    messages.map((msg, index) => {
                      // 强制显示所有接收到的消息都在左侧，自己发送的都在右侧
                      // 使用 parseInt 确保 ID 类型一致进行比较
                      const senderIdNum = parseInt(msg.senderId);
                      const userIdNum = parseInt(user?.id);
                      const isFromMe = !isNaN(senderIdNum) && !isNaN(userIdNum) && senderIdNum === userIdNum;
                      console.log(`Message ${index} - from me? ${isFromMe}, senderId: ${msg.senderId}(${senderIdNum}), myId: ${user?.id}(${userIdNum})`);
                      
                      // 使用发送者ID对应的用户或当前选中的用户
                      const sender = isFromMe ? user : activeChat;
                      const prevMsg = index > 0 ? messages[index - 1] : null;
                      const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId; // 只在消息组的第一条消息显示头像
                      
                      return (
                        <div 
                          key={index} 
                          className={`flex items-end space-x-2 ${isFromMe ? 'justify-end' : 'justify-start'} mb-2`}
                        >
                          {/* Avatar for other user's messages */}
                          {!isFromMe && showAvatar && (
                            <Avatar 
                              className="h-8 w-8 flex-shrink-0 cursor-pointer"
                              onClick={(e) => {
                                const profileUrl = `/users/${sender.id}`;
                                if (e.ctrlKey || e.metaKey) {
                                  window.open(profileUrl, '_blank');
                                } else {
                                  window.location.href = profileUrl;
                                }
                              }}
                            >
                              <AvatarFallback>{sender?.username?.[0] || sender?.firstName?.[0] || '?'}</AvatarFallback>
                              {sender?.avatar && <AvatarImage src={sender.avatar} />}
                            </Avatar>
                          )}
                          
                          {/* Spacer div when we don't show the avatar but need to maintain alignment */}
                          {!isFromMe && !showAvatar && <div className="w-8 flex-shrink-0"></div>}
                          
                          {/* Message content */}
                          <div 
                            className={`relative max-w-[70%] px-4 py-2 rounded-lg ${isFromMe 
                              ? 'bg-primary text-primary-foreground rounded-tr-none' 
                              : 'bg-muted rounded-tl-none'}`}
                          >
                            {/* Sender name (only for other user's messages) */}
                            {!isFromMe && showAvatar && (
                              <div className="text-xs font-semibold mb-1 text-slate-600">
                                {sender?.firstName || sender?.username}
                              </div>
                            )}
                            
                            <div className="break-words">{msg.content}</div>
                            <div className="text-xs mt-1 opacity-70 text-right">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          
                          {/* Avatar for my messages */}
                          {isFromMe && showAvatar && (
                            <Avatar 
                              className="h-8 w-8 flex-shrink-0 cursor-pointer"
                              onClick={(e) => {
                                const profileUrl = `/users/${user.id}`;
                                if (e.ctrlKey || e.metaKey) {
                                  window.open(profileUrl, '_blank');
                                } else {
                                  window.location.href = profileUrl;
                                }
                              }}
                            >
                              <AvatarFallback>{user?.username?.[0] || user?.firstName?.[0] || '?'}</AvatarFallback>
                              {user?.avatar && <AvatarImage src={user.avatar} />}
                            </Avatar>
                          )}
                          
                          {/* Spacer div when we don't show the avatar but need to maintain alignment */}
                          {isFromMe && !showAvatar && <div className="w-8 flex-shrink-0"></div>}
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No messages yet.</p>
                        <p className="text-sm">Start the conversation!</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Scroll to bottom button */}
                {showScrollToBottom && (
                  <Button
                    className="fixed bottom-20 right-12 z-10 rounded-full bg-primary p-2 text-primary-foreground shadow-lg hover:bg-primary/90"
                    size="icon"
                    onClick={scrollToBottom}
                    aria-label="Scroll to bottom"
                  >
                    <ArrowDown className="h-5 w-5" />
                  </Button>
                )}
              </ScrollArea>
              
              <div className="p-4 border-t bg-white">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={!isConnectionOpen}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!message.trim() || !isConnectionOpen}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {!isConnectionOpen && (
                  <div className="mt-2 text-sm text-destructive">
                    Connection lost. Reconnecting...
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center p-6">
                <MessagesSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-medium mb-2">Your Messages</h3>
                <p className="mb-4">Select a contact to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
