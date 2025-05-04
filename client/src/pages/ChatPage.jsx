import React, { useState, useEffect, useRef } from 'react';
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
import { MessagesSquare, MessageCircle, Send, User, Users, Search } from 'lucide-react';

const DEFAULT_WS_RECONNECT_TIMEOUT = 2000;

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
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
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

    const connectWebSocket = () => {
      // Determine the correct protocol (ws or wss)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      // Create WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnectionOpen(true);
        
        // Authenticate with the server
        // Use actual auth token for authentication, or user ID as fallback
        console.log('Auth token available:', !!token);
        socket.send(JSON.stringify({
          type: 'auth',
          data: { token: token }
        }));
        
        console.log('Sending authentication to WebSocket server');

        // Setup ping interval to keep connection alive
        const pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        return () => clearInterval(pingInterval);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        switch (data.type) {
          case 'direct_message':
            handleNewMessage(data.data);
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
      };

      socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event);
        setIsConnectionOpen(false);
        
        // Attempt to reconnect after timeout
        setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          connectWebSocket();
        }, DEFAULT_WS_RECONNECT_TIMEOUT);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        socket.close();
      };
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

  // Auto-scroll to bottom only when loading initial history, not on every message
  useEffect(() => {
    // Only scroll when messages are first loaded or cleared
    if (messages.length <= 1 || previousMessagesLength.current === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // Keep track of previous messages length
    previousMessagesLength.current = messages.length;
  }, [messages]);

  // Request chat history when a chat is selected
  useEffect(() => {
    if (activeChat && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'get_chat_history',
        data: { userId: activeChat.id }
      }));
    }
  }, [activeChat]);

  // Handle new incoming message
  const handleNewMessage = (messageData) => {
    console.log('Received message:', messageData);
    // Log the sender ID and user ID to debug message alignment issue
    const senderIdNum = parseInt(messageData.senderId);
    const userIdNum = parseInt(user?.id);
    const isFromMe = !isNaN(senderIdNum) && !isNaN(userIdNum) && senderIdNum === userIdNum;
    console.log('Message sender ID:', messageData.senderId, '(', senderIdNum, ')');
    console.log('Current user ID:', user?.id, '(', userIdNum, ')');
    console.log('Is from me?', isFromMe);
    
    // Ensure senderId is present as a number for proper display logic and timestamp is normalized
    const processedMessage = {
      ...messageData,
      senderId: messageData.senderId || (messageData.sender && messageData.sender.id) || null,
      createdAt: messageData.createdAt ? new Date(messageData.createdAt) : new Date()
    };
    
    // Add message to state and ensure proper sorting
    setMessages(prevMessages => {
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
    
    // Only add to contacts list if this is a message from someone else (not self-messages)
    // and only if the contact doesn't already exist in the list
    if (messageData.sender && !isFromMe && 
        !contacts.some(contact => contact.id === messageData.sender.id)) {
      console.log('Adding new contact from message:', messageData.sender);
      setContacts(prevContacts => [...prevContacts, messageData.sender]);
    }
  };

  // Handle received chat history
  const handleChatHistory = (data) => {
    console.log('Received chat history:', data);
    if (data.messages) {
      // Log each message to check sender and receiver IDs
      data.messages.forEach((msg, index) => {
        console.log(`Message ${index} - sender: ${msg.senderId}, receiver: ${msg.recipientId}, content: ${msg.content}`);
      });
      
      // Process messages to ensure all have senderId property
      const processedMessages = data.messages.map(msg => ({
        ...msg,
        senderId: msg.senderId || (msg.sender && msg.sender.id) || null,
        // 确保消息时间有正确格式，便于排序
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date()
      }));
      
      // 按时间排序消息
      const sortedMessages = processedMessages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      setMessages(sortedMessages);
    }
  };

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

  // Select a chat
  const selectChat = (contact) => {
    setActiveChat(contact);
    setMessages([]);
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
                            e.stopPropagation(); // 阻止冒泡到通话选择
                            window.location.href = `/profile/${contact.id}`;
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
                    onClick={() => window.location.href = `/profile/${activeChat.id}`}
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
              
              <ScrollArea className="flex-1 p-4">
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
                              onClick={() => window.location.href = `/profile/${sender.id}`}
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
                              onClick={() => window.location.href = `/profile/${user.id}`}
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
