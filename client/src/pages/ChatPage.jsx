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
import RobustChatConnection from '@/components/chat/RobustChatConnection';

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
  // We no longer need socketRef as we're using RobustChatConnection
  const messagesEndRef = useRef(null);
  const messagesStartRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const previousMessagesLength = useRef(0); // Track previous message count to control auto-scrolling

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

  // Use our robust WebSocket connection with better stability
  const { sendMessage } = RobustChatConnection({
    isAuthenticated,
    user,
    token,
    activeChat,
    onConnectionChange: setIsConnectionOpen,
    onNewMessage: (data) => {
      // Process new messages with requestAnimationFrame to avoid UI blocking
      requestAnimationFrame(() => handleNewMessage(data));
    },
    onChatHistory: (data) => {
      console.log('Received chat history');
      handleChatHistory(data);
    },
    onUserOnline: handleUserOnline,
    onUserOffline: handleUserOffline
  });

  // Fetch chat partners when authenticated
  useEffect(() => {
    if (chatPartners) {
      setContacts(chatPartners);
    }
  }, [chatPartners]);

  // Add diagnostic logging for debugging
  useEffect(() => {
    console.log('ChatPage mounted');
    console.log('Authentication status:', isAuthenticated);
    console.log('User token available:', !!token);
    console.log('WebSocket connection status:', isConnectionOpen);
    return () => {
      console.log('ChatPage unmounted');
    };
  }, [isAuthenticated, token, isConnectionOpen]);

  // Auto-scroll to bottom only when necessary, not on every message or history load
  useEffect(() => {
    // We only want to auto-scroll in these scenarios:
    // 1. When user sends their own message (handled in sendMessage function)
    // 2. When the very first load of messages occurs (handled in handleChatHistory)
    // For other cases (like receiving messages from others), don't auto-scroll
    
    // Update the previous message count for comparing later
    previousMessagesLength.current = messages.length;
  }, [messages, activeChat, isLoadingOlderMessages]);

  // We no longer need the request chat history useEffect as this is handled 
  // by our RobustChatConnection component when activeChat changes

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
    // FIXED: Add additional logging to debug empty messages issue
    console.log('Chat history messages array length:', data.messages?.length || 0);
    console.log('Chat history is array?', Array.isArray(data.messages));
    
    // BUGFIX: Ensure the loading indicator is removed even if there's a problem
    if (!data.messages || !Array.isArray(data.messages)) {
      console.error('Invalid messages format received:', data);
      setIsLoadingOlderMessages(false);
      return;
    }
    
    if (data.messages && Array.isArray(data.messages)) {
      // Log only the first few messages to avoid console clutter
      const sampleSize = Math.min(data.messages.length, 3);
      for (let i = 0; i < sampleSize; i++) {
        const msg = data.messages[i];
        console.log(`Message ${i} - sender: ${msg.senderId}, receiver: ${msg.recipientId}, content: ${msg.content}`);
      }
      
      // Process messages to ensure all have senderId property
      const processedMessages = data.messages.map(msg => {
        // BUGFIX: Add detailed validation and logging for each message
        if (!msg) {
          console.error('Null message object in data.messages');
          return null;
        }
        
        // Generate a guaranteed unique ID if missing
        const messageId = msg.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Handle missing senderId by extracting from sender object or setting a fallback
        let senderId = null;
        if (msg.senderId) {
          senderId = msg.senderId;
        } else if (msg.sender && msg.sender.id) {
          senderId = msg.sender.id;
          console.log(`Message ${messageId} missing senderId, extracted ${senderId} from sender object`);
        } else {
          console.error(`Message ${messageId} missing both senderId and sender.id`);
        }
        
        // Ensure createdAt is a valid date
        let createdAt;
        try {
          createdAt = msg.createdAt ? new Date(msg.createdAt) : new Date();
        } catch (e) {
          console.error(`Invalid date format for message ${messageId}:`, msg.createdAt);
          createdAt = new Date();
        }
        
        return {
          ...msg,
          id: messageId,
          senderId,
          createdAt
        };
      }).filter(Boolean); // Remove any null entries
      
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
          setMessages(sortedMessages);
          setIsLoadingOlderMessages(false);
          
          // Auto-scroll to bottom on initial load after a short delay
          // to allow the DOM to update
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    } else {
      // Ensure loading state is cleared if there's an error
      setIsLoadingOlderMessages(false);
      console.error('Invalid chat history format:', data);
    }
  };
  
  // Handle loading older messages
  const handleLoadOlderMessages = useCallback(() => {
    if (isLoadingOlderMessages || !hasMoreMessages || !activeChat) return;
    
    // Set loading state
    setIsLoadingOlderMessages(true);
    
    // Request older messages using the current first message's ID as a reference
    if (messages.length > 0 && sendMessage) {
      const oldestMessage = messages[0];
      const offset = messages.length;
      
      sendMessage({
        type: 'get_older_messages',
        data: {
          userId: activeChat.id,
          beforeId: oldestMessage.id,
          offset,
          limit: MESSAGES_PER_PAGE
        }
      });
    } else {
      setIsLoadingOlderMessages(false);
      toast({
        title: 'Error',
        description: 'Will load messages when connection is restored.',
        duration: 3000,
      });
    }
  }, [activeChat, hasMoreMessages, isLoadingOlderMessages, messages.length, toast]);

  // Send a new message
  const handleSendMessage = () => {
    if (!message.trim() || !activeChat) return;
    
    // Use our robust connection to send the message
    const messageId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Add to local messages immediately for instant feedback
    const newMessage = {
      id: messageId,
      content: message,
      senderId: user.id,
      recipientId: activeChat.id,
      createdAt: new Date(),
      status: 'sending'
    };
    
    // Add to UI
    setMessages(prev => [...prev, newMessage]);
    
    // Clear input
    setMessage('');
    
    // Scroll to bottom 
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    // Actually send the message
    if (sendMessage) {
      sendMessage({
        type: 'direct_message',
        data: {
          recipientId: activeChat.id,
          content: message,
          messageId,
          senderId: user?.id // Include sender ID explicitly
        }
      });
    }
  };
  
  // Switch to a different chat
  const switchChat = (contact) => {
    setActiveChat(contact);
    
    // Load cached messages if available
    if (messageCache.has(contact.id)) {
      const cachedMessages = Array.from(messageCache.get(contact.id).values());
      if (cachedMessages.length > 0) {
        console.log(`Using ${cachedMessages.length} cached messages for ${contact.username || contact.id}`);
        // Sort by creation time
        setMessages(cachedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      } else {
        // No cached messages, clear and wait for server response
        setMessages([]);
      }
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
                <TabsTrigger value="direct">
                  <User className="h-4 w-4 mr-2" />
                  Direct
                </TabsTrigger>
                <TabsTrigger value="groups">
                  <Users className="h-4 w-4 mr-2" />
                  Groups
                </TabsTrigger>
              </TabsList>
              
              {/* Search input */}
              <div className="relative mt-3">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search contacts..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </Tabs>
          </div>
          
          <ScrollArea className="h-[calc(75vh-120px)]">
            <TabsContent value="direct" className="pt-0 m-0">
              <div className="divide-y">
                {isLoadingPartners ? (
                  // Loading skeleton for contacts
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={`skeleton-${index}`} className="flex items-center p-3 gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))
                ) : (
                  filteredContacts.length === 0 ? (
                    <div className="p-5 text-center text-muted-foreground">
                      {searchQuery ? 'No contacts found' : 'No contacts yet'}
                    </div>
                  ) : (
                    filteredContacts.map(contact => (
                      <div 
                        key={contact.id}
                        className={`flex items-center p-3 cursor-pointer hover:bg-accent transition-colors gap-3 ${activeChat?.id === contact.id ? 'bg-accent' : ''}`}
                        onClick={() => switchChat(contact)}
                      >
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback>{contact.username?.charAt(0) || 'U'}</AvatarFallback>
                            {contact.avatar && <AvatarImage src={contact.avatar} />}
                          </Avatar>
                          {onlineUsers.has(parseInt(contact.id)) && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0"> {/* This ensures proper text overflow handling */}
                          <div className="font-medium truncate">
                            {contact.firstName && contact.lastName ? 
                              `${contact.firstName} ${contact.lastName}` : 
                              contact.username}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {onlineUsers.has(parseInt(contact.id)) ? 'Online now' : 'Offline'}
                          </div>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="groups" className="pt-0 m-0">
              <div className="p-5 text-center text-muted-foreground">
                Group chats coming soon...
              </div>
            </TabsContent>
          </ScrollArea>
        </div>
        
        {/* Chat area */}
        <div className="md:col-span-3 border rounded-lg overflow-hidden flex flex-col h-full">
          {activeChat ? (
            <>
              {/* Chat header */}
              <div className="bg-slate-50 p-4 border-b flex items-center">
                <Avatar className="h-9 w-9 mr-3">
                  <AvatarFallback>{activeChat.username?.charAt(0) || 'U'}</AvatarFallback>
                  {activeChat.avatar && <AvatarImage src={activeChat.avatar} />}
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">
                    {activeChat.firstName && activeChat.lastName ? 
                      `${activeChat.firstName} ${activeChat.lastName}` : 
                      activeChat.username}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {onlineUsers.has(parseInt(activeChat.id)) ? (
                      <span className="text-green-600 flex items-center">
                        <span className="h-2 w-2 bg-green-600 rounded-full mr-1"></span>
                        Online
                      </span>
                    ) : 'Offline'}
                  </div>
                </div>
              </div>
              
              {/* Messages area */}
              <div className="flex-1 flex flex-col overflow-hidden relative">
                <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4">
                  {/* Load older messages button */}
                  {hasMoreMessages && (
                    <div className="flex justify-center mb-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleLoadOlderMessages}
                        disabled={isLoadingOlderMessages}
                      >
                        {isLoadingOlderMessages ? 'Loading...' : 'Load older messages'}
                      </Button>
                    </div>
                  )}
                  
                  {/* Reference to the top for scrolling to when loading older messages */}
                  <div ref={messagesStartRef} />
                  
                  {/* Loading skeleton */}
                  {isLoadingOlderMessages && (
                    <div className="space-y-3 mb-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={`skeleton-${i}`} className="flex items-start">
                          <Skeleton className="h-8 w-8 rounded-full mr-3" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-14 w-60" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Actual message list */}
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      // Ensure message has senderId
                      const senderId = msg.senderId || (msg.sender && msg.sender.id);
                      const isFromMe = senderId === user?.id;
                      
                      return (
                        <div key={msg.id} className={`flex mb-3 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                          {!isFromMe && (
                            <Avatar className="h-8 w-8 mr-2 mt-1">
                              <AvatarFallback>{activeChat.username?.charAt(0) || 'U'}</AvatarFallback>
                              {activeChat.avatar && <AvatarImage src={activeChat.avatar} />}
                            </Avatar>
                          )}
                          
                          <div className={`max-w-[70%] ${isFromMe ? 'bg-primary text-primary-foreground' : 'bg-accent'} rounded-lg p-3 break-words`}>
                            <div>{msg.content}</div>
                            <div className="text-xs mt-1 opacity-70">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {msg.status === 'sending' && ' · Sending...'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {/* Reference to the bottom for auto-scrolling */}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Scroll to bottom button */}
                {showScrollToBottom && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute bottom-20 right-4 rounded-full shadow-md" 
                    onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Message input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={!isConnectionOpen}
                  />
                  <Button 
                    onClick={handleSendMessage} 
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