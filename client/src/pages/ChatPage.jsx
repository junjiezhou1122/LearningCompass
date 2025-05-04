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
        socket.send(JSON.stringify({
          type: 'auth',
          data: { token: user.id.toString() }
        }));

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
  }, [isAuthenticated, user?.id, toast]);

  // Fetch chat partners when authenticated
  useEffect(() => {
    if (chatPartners) {
      setContacts(chatPartners);
    }
  }, [chatPartners]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    setMessages(prevMessages => [...prevMessages, messageData]);
    
    // If this is a message from a new contact, update the contacts list
    if (messageData.sender && !contacts.find(contact => contact.id === messageData.sender.id)) {
      setContacts(prevContacts => [...prevContacts, messageData.sender]);
    }
  };

  // Handle received chat history
  const handleChatHistory = (data) => {
    if (data.messages) {
      setMessages(data.messages);
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

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => 
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
                      className={`p-3 cursor-pointer hover:bg-slate-50 flex items-center ${activeChat?.id === contact.id ? 'bg-slate-100' : ''}`}
                      onClick={() => selectChat(contact)}
                    >
                      <div className="relative">
                        <Avatar>
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
                  <Avatar>
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
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length > 0 ? (
                    messages.map((msg, index) => {
                      const isFromMe = msg.senderId === user.id || !msg.sender;
                      
                      return (
                        <div 
                          key={index} 
                          className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-[70%] px-4 py-2 rounded-lg ${isFromMe 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'}`}
                          >
                            <div className="break-words">{msg.content}</div>
                            <div className="text-xs mt-1 opacity-70 text-right">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
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
