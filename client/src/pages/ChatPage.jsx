import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User,
  Search,
  Hash,
  Send,
  Settings,
  Bell,
  MessageSquare,
  PlusCircle,
  AtSign,
  Image,
  Paperclip,
  Smile,
  Mic,
  WifiOff,
  Menu,
  Phone,
  Video,
  UserPlus,
  Info
} from 'lucide-react';

// Chat message component
const ChatMessage = ({ message, isCurrentUser }) => {
  const formattedTime = format(new Date(message.createdAt), 'h:mm a');
  const formattedDate = format(new Date(message.createdAt), 'MMMM d, yyyy');
  
  return (
    <div className={`relative flex items-start mb-1 py-1 px-2 group hover:bg-gray-50 rounded ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <div className="flex-shrink-0 mr-3 mt-1">
          <Avatar className="h-9 w-9 border border-gray-200">
            <AvatarFallback className="bg-indigo-100 text-indigo-600">
              {message.sender?.username?.substring(0, 2) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className={`max-w-[75%]`}>
        {!isCurrentUser && (
          <div className="flex items-center mb-1">
            <span className="text-sm font-medium text-indigo-600 hover:underline cursor-pointer">
              {message.sender?.username || 'User'}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-gray-500 ml-2 cursor-default">{formattedTime}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formattedDate}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        <div className={`px-4 py-2 rounded-lg ${isCurrentUser 
          ? 'bg-indigo-500 text-white' 
          : 'bg-gray-100 text-gray-800'}`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        {isCurrentUser && (
          <div className="text-xs text-gray-500 mt-1 text-right mr-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default">{formattedTime}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formattedDate}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {message.isRead && <span className="ml-1">• Read</span>}
          </div>
        )}
      </div>
      
      {isCurrentUser && (
        <div className="flex-shrink-0 ml-3 mt-1">
          <Avatar className="h-9 w-9 border border-gray-200">
            <AvatarFallback className="bg-indigo-600 text-white">
              {message.sender?.username?.substring(0, 2) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex space-x-1 bg-white rounded-md border border-gray-200 shadow-sm p-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:bg-gray-100 rounded-full">
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reply</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

// Server/Channel component
const Channel = ({ name, isActive, unreadCount, onClick }) => {
  return (
    <div 
      className={`flex items-center py-1 px-2 rounded-md mb-1 cursor-pointer ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
      onClick={onClick}
    >
      <Hash className="h-4 w-4 mr-2" />
      <span className="text-sm font-medium truncate">{name}</span>
      {unreadCount > 0 && (
        <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs">
          {unreadCount}
        </Badge>
      )}
    </div>
  );
};

// Direct message component
const DirectMessage = ({ user, isActive, isOnline, unreadCount, onClick }) => {
  return (
    <div 
      className={`flex items-center py-2 px-3 rounded-md mb-1 cursor-pointer ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
      onClick={onClick}
    >
      <div className="relative mr-3">
        <Avatar className="h-8 w-8 border border-gray-200">
          <AvatarFallback className={`${isActive ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-700'}`}>
            {user.username?.substring(0, 2) || 'U'}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border border-white"></span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{user.username}</span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">
          {isOnline ? 'Online' : 'Offline'}
        </p>
      </div>
    </div>
  );
};

const ChatPage = () => {
  const { user, token } = useAuth();
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const { toast } = useToast();
  const MESSAGES_PER_PAGE = 15; // Number of messages to load per page
  
  // Scroll to bottom when new messages arrive - with optimized performance
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  };
  
  // Handle scroll events for detecting when to load more messages
  const handleScroll = useCallback((event) => {
    // Load older messages when user scrolls to the top
    const scrollTop = event.currentTarget.scrollTop;
    if (scrollTop < 50 && hasMore && !isLoadingMore) {
      loadOlderMessages();
    }
  }, [hasMore, isLoadingMore, loadOlderMessages]);
  
  // Set up scroll event listener
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('div[role="presentation"]');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  
  // Scroll to bottom when messages change (new message received or sent)
  useEffect(() => {
    if (messages.length > 0) {
      // Use non-smooth scroll when loading a chat for the first time or older messages
      // Use smooth scroll when just receiving a new message
      scrollToBottom(messages.length < MESSAGES_PER_PAGE);
    }
  }, [messages]);
  
  // Keep chat container sized properly when window resizes
  useEffect(() => {
    const handleResize = () => {
      // Force recalculation of container heights
      const chatContainer = document.querySelector('.chat-container');
      const messagesContainer = document.querySelector('.messages-container');
      const sidebarScrollArea = document.querySelector('.sidebar-scroll-area');
      const emptyStateContainer = document.querySelector('.empty-state-container');
      
      if (chatContainer) {
        const headerHeight = 132; // Height of the site header + top bar
        const viewportHeight = window.innerHeight;
        chatContainer.style.height = `${viewportHeight - headerHeight}px`;
      }
      
      if (messagesContainer) {
        // Set the messages container height by accounting for the chat input and header
        const chatHeaderHeight = 56; // 14px height and padding
        const chatInputHeight = 72; // 3px padding * 2 + inputs height
        const messagesContainerHeight = chatContainer.offsetHeight - chatHeaderHeight - chatInputHeight;
        messagesContainer.style.height = `${messagesContainerHeight}px`;
      }
      
      if (sidebarScrollArea) {
        // Handle the sidebar scroll area height - account for search input height
        const searchInputHeight = 57; // Height of search input area including padding
        const sidebarAreaHeight = chatContainer.offsetHeight - searchInputHeight;
        sidebarScrollArea.style.height = `${sidebarAreaHeight}px`;
      }
      
      if (emptyStateContainer) {
        // Handle the empty state container height
        emptyStateContainer.style.height = `${chatContainer.offsetHeight}px`;
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Initial calculation
    handleResize();
    
    // Re-run handleResize when activeChat changes
    if (activeChat) {
      // Adding a slight delay to ensure the DOM has updated
      setTimeout(handleResize, 100);
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, [activeChat]);
  
  // Get chat partners
  const { data: chatPartners = [], isLoading: isPartnersLoading } = useQuery({
    queryKey: ["/api/chat/partners"],
    queryFn: async () => {
      if (!token) return [];
      const response = await fetch(`/api/chat/partners`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch chat partners");
      const partners = await response.json();
      // Filter out the current user since users can't chat with themselves
      return partners.filter(partner => partner.id !== user?.id);
    },
    enabled: !!token,
    staleTime: 30 * 1000, // 30 seconds
  });
  
  // Connect to WebSocket
  useEffect(() => {
    if (!user || !token) return;
    
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    
    // Connection opened
    socket.addEventListener('open', () => {
      console.log('WebSocket Connected');
      // Authenticate with the server
      socket.send(JSON.stringify({
        type: 'auth',
        token: token
      }));
    });
    
    // Listen for messages
    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'auth_success') {
        setConnected(true);
        // If there's an active chat, load its messages
        if (activeChat) {
          loadMessages(activeChat.id);
        }
      } else if (data.type === 'new_message') {
        // Handle incoming messages
        const newMessage = data.message;
        
        // Add to messages if it's part of the active chat
        if (activeChat && (newMessage.senderId === activeChat.id || newMessage.receiverId === activeChat.id)) {
          setMessages(prev => {
            const updatedMessages = [...prev, newMessage].sort((a, b) => 
              new Date(a.createdAt) - new Date(b.createdAt)
            );
            return updatedMessages;
          });
          
          // Mark as read
          socket.send(JSON.stringify({
            type: 'mark_read',
            senderId: activeChat.id
          }));
          
          // Scroll to bottom after receiving a new message
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        } else {
          // Show notification for messages from other chats
          toast({
            title: `New message from ${newMessage.sender?.username || 'User'}`,
            description: newMessage.content.length > 30 ? 
              `${newMessage.content.substring(0, 30)}...` :
              newMessage.content,
          });
        }
      } else if (data.type === 'message_sent') {
        // Add message to chat
        setMessages(prev => {
          const updatedMessages = [...prev, data.message].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          );
          
          // Scroll to bottom after sending a message
          setTimeout(() => {
            scrollToBottom();
          }, 100);
          
          return updatedMessages;
        });
      } else if (data.type === 'messages_read') {
        // Update read status of sent messages
        setMessages(prev => 
          prev.map(msg => 
            msg.senderId === user.id && msg.receiverId === data.readBy
              ? { ...msg, isRead: true }
              : msg
          )
        );
      } else if (data.type === 'error') {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        });
      }
    });
    
    // Handle errors and connection close
    socket.addEventListener('error', (error) => {
      console.error('WebSocket Error:', error);
      setConnected(false);
      toast({
        title: "Connection Error",
        description: "Unable to connect to chat server",
        variant: "destructive"
      });
    });
    
    socket.addEventListener('close', () => {
      console.log('WebSocket Disconnected');
      setConnected(false);
    });
    
    setWs(socket);
    
    // Clean up on unmount
    return () => {
      socket.close();
    };
  }, [user, token]);
  
  // Load messages when changing active chat
  useEffect(() => {
    if (activeChat && connected) {
      loadMessages(activeChat.id);
    }
  }, [activeChat, connected]);
  
  // Load messages for a specific chat - now with pagination to only load recent messages first
  const loadMessages = async (partnerId, isLoadingOlder = false) => {
    if (!token) return;
    
    try {
      // Only clear messages when loading a new chat (not when loading older messages)
      if (!isLoadingOlder) {
        setMessages([]);
        setPage(1);
        setHasMore(true);
      }
      
      // Show loading indicator
      setIsLoadingMore(true);
      
      // In a real implementation, we would add pagination parameters to the API endpoint
      // For this mock, we'll simulate pagination client-side
      const response = await fetch(`/api/chat/messages/${partnerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const allData = await response.json();
        // Sort messages by date (oldest to newest)
        const sortedData = [...allData].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        // Simulate pagination by only returning the most recent messages
        // This would normally be handled by the server
        const totalMessages = sortedData.length;
        const currentPage = isLoadingOlder ? page + 1 : 1;
        const startIndex = Math.max(0, totalMessages - (currentPage * MESSAGES_PER_PAGE));
        const endIndex = totalMessages;
        const paginatedData = sortedData.slice(startIndex, endIndex);
        
        // Update state
        if (isLoadingOlder) {
          // If loading older messages, prepend them to existing messages
          setMessages(prev => [...paginatedData.filter(msg => 
            !prev.some(existing => existing.id === msg.id)
          ), ...prev]);
          setPage(currentPage);
          
          // Check if there are more messages to load
          setHasMore(startIndex > 0);
        } else {
          // If loading a new chat, replace all messages
          setMessages(paginatedData);
          setHasMore(startIndex > 0);
          
          // After setting messages, scroll to bottom with a slight delay
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      } else {
        console.error('Error fetching messages:', await response.text());
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  // Function to load older messages when the user scrolls up
  const loadOlderMessages = () => {
    if (!hasMore || isLoadingMore || !activeChat) return;
    loadMessages(activeChat.id, true);
  };
  
  // Send message through WebSocket
  const sendMessage = () => {
    if (!input.trim() || !connected || !ws || !activeChat) return;
    
    ws.send(JSON.stringify({
      type: 'chat_message',
      receiverId: activeChat.id,
      content: input.trim()
    }));
    
    setInput('');
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Top control bar */}
      <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 shadow-sm z-10">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden text-gray-600 hover:bg-gray-100 mr-2"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-800">Messages</h1>
        </div>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-100">
                  <Bell className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-100">
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden chat-container">
        {/* Sidebar */}
        <div 
          className={`w-64 bg-gray-50 border-r flex flex-col ${isMobileSidebarOpen ? 'block' : 'hidden'} lg:block overflow-hidden`}
          style={{ minWidth: '256px', maxWidth: '256px' }}
        >
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Find or start a conversation" 
                className="pl-8 bg-gray-100 border-gray-200 text-sm"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1 sidebar-scroll-area">
            <div className="p-3">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Direct Messages</h3>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-500 hover:text-indigo-600">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="h-px bg-gray-200 my-2"></div>
                
                {isPartnersLoading ? (
                  <div className="flex justify-center py-2">
                    <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : chatPartners.length === 0 ? (
                  <div className="text-center py-2 text-sm text-gray-500">
                    <p>No conversations yet</p>
                    <p className="text-xs mt-1">Follow users to chat with them</p>
                  </div>
                ) : (
                  <div>
                    {chatPartners.map(partner => (
                      <DirectMessage 
                        key={partner.id}
                        user={partner}
                        isActive={activeChat?.id === partner.id}
                        isOnline={true} // You might want to add real online status
                        unreadCount={0} // Add real unread count
                        onClick={() => {
                          setActiveChat(partner);
                          setIsMobileSidebarOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suggested Peers</h3>
                </div>
                <div className="h-px bg-gray-200 my-2"></div>
                
                <div className="text-center py-2 text-sm text-gray-500">
                  <p>Follow more users to expand</p>
                  <p className="text-xs mt-1">your learning network</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
        
        {/* Main chat area */}
        <div className="flex-1 flex flex-col bg-white">
          {activeChat ? (
            <>
              {/* Chat header */}
              <div className="h-14 border-b flex items-center justify-between px-4 py-2">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-3 border border-gray-200">
                    <AvatarFallback className="bg-gray-100 text-gray-800">
                      {activeChat.username?.substring(0, 2) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-medium text-gray-900">{activeChat.username}</h2>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-indigo-600 hover:bg-gray-100">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Call</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-indigo-600 hover:bg-gray-100">
                          <Video className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Video Call</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-indigo-600 hover:bg-gray-100">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add Friend</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              {/* Chat messages - Fixed height container */}
              <div className="flex-1 relative overflow-hidden messages-container">
                <ScrollArea ref={scrollAreaRef} className="absolute inset-0 px-4 py-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <div className="bg-gray-100 p-4 rounded-full mb-4">
                        <MessageSquare className="h-12 w-12 text-indigo-400" />
                      </div>
                      <p className="font-medium text-lg text-gray-700 mb-2">No messages yet</p>
                      <p className="text-sm text-gray-500">Start the conversation with {activeChat.username}</p>
                    </div>
                  ) : (
                    <div>
                      {/* Load Older Messages Button - Only show if there are more messages to load */}
                      {hasMore && (
                        <div className="flex justify-center py-2 mb-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                            onClick={loadOlderMessages}
                            disabled={isLoadingMore}
                          >
                            {isLoadingMore ? (
                              <div className="animate-spin h-3 w-3 border border-indigo-500 border-t-transparent rounded-full mr-1"></div>
                            ) : (
                              <span>⟲</span>
                            )}
                            {isLoadingMore ? 'Loading...' : 'Load older messages'}
                          </Button>
                        </div>
                      )}
                      
                      {/* Messages List */}
                      {messages.map((message, index) => (
                        <ChatMessage 
                          key={message.id || index}
                          message={message} 
                          isCurrentUser={message.senderId === user?.id} 
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </div>
              
              {/* Chat input */}
              <div className="border-t p-3">
                <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <div className="flex items-center space-x-1 pl-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-400 hover:text-indigo-500 hover:bg-gray-100 rounded-full"
                    >
                      <PlusCircle className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-400 hover:text-indigo-500 hover:bg-gray-100 rounded-full"
                    >
                      <Image className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-400 hover:text-indigo-500 hover:bg-gray-100 rounded-full"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${activeChat.username}...`}
                    className="flex-1 border-0 bg-transparent focus:ring-0"
                    disabled={!connected}
                  />
                  
                  <div className="flex items-center space-x-1 pr-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-400 hover:text-indigo-500 hover:bg-gray-100 rounded-full"
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-400 hover:text-indigo-500 hover:bg-gray-100 rounded-full"
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                    <Button 
                      onClick={sendMessage} 
                      className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-md px-3 py-1 h-8"
                      disabled={!connected || !input.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 empty-state-container">
              <div className="relative">
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-50 rounded-full blur-xl opacity-70"></div>
                <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-blue-50 rounded-full blur-xl opacity-70"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="bg-indigo-100 p-6 rounded-full mb-6 shadow-md">
                    <MessageSquare className="h-16 w-16 text-indigo-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Learning Chat</h2>
                  <p className="text-gray-600 max-w-md mb-8">
                    Connect with fellow learners to discuss courses, share resources, and collaborate on projects.
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-left text-gray-700 text-sm max-w-md shadow-sm">
                    <div className="flex items-center mb-3">
                      <Info className="h-5 w-5 text-indigo-500 mr-2" />
                      <p className="font-medium">Getting Started</p>
                    </div>
                    <ol className="list-decimal list-inside space-y-2 ml-1">
                      <li>Follow users you're interested in connecting with</li>
                      <li>Once they follow you back, you can start chatting</li>
                      <li>Select a conversation from the sidebar to begin</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {!connected && activeChat && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
              <div className="text-center p-6 bg-white shadow-lg rounded-lg border border-gray-200">
                <div className="mb-4 inline-block">
                  <Badge variant="outline" className="mb-2 text-lg bg-gray-50 text-indigo-700 border-indigo-200 px-4 py-1">
                    <WifiOff className="mr-2 h-4 w-4" />
                    Disconnected
                  </Badge>
                </div>
                <p className="text-gray-600 mb-2">Trying to reconnect to chat service...</p>
                <div className="mx-auto h-6 w-6 rounded-full border-2 border-gray-200 border-t-indigo-500 animate-spin mt-4"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
