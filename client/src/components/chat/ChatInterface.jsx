import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, Send, ArrowLeft, Phone, Video, MoreVertical, User, Image, Paperclip, Smile, Mic, Calendar, BookOpen, Bookmark, Book, ExternalLink, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

const ChatMessage = ({ message, isCurrentUser }) => {
  const formattedTime = format(new Date(message.createdAt), 'h:mm a');
  
  return (
    <div className={`flex items-end mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <div className="flex-shrink-0 mr-2 mb-1">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
        </div>
      )}
      
      <div className={`max-w-[70%]`}>
        <div className={`px-4 py-2 rounded-lg ${isCurrentUser 
          ? 'bg-blue-500 text-white rounded-br-none' 
          : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right mr-2' : 'ml-2'}`}>
          {formattedTime}
        </div>
      </div>
      
      {isCurrentUser && (
        <div className="flex-shrink-0 ml-2 mb-1">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

// Recommendation component for the sidebar
const ResourceRecommendation = ({ title, type, difficulty, imageUrl, link, onSelect }) => {
  return (
    <Card className="mb-3 hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={onSelect}>
      <CardContent className="p-3">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 bg-orange-100 rounded-md p-2">
            {type === 'course' ? (
              <BookOpen className="h-5 w-5 text-orange-600" />
            ) : type === 'article' ? (
              <Book className="h-5 w-5 text-purple-600" />
            ) : (
              <ExternalLink className="h-5 w-5 text-green-600" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium leading-tight mb-1 text-gray-900">{title}</h4>
            <div className="flex items-center">
              <Badge variant="outline" className="text-xs mr-2">
                {type}
              </Badge>
              <span className="text-xs text-gray-500">
                {difficulty === 'beginner' ? 'Beginner' : 
                 difficulty === 'intermediate' ? 'Intermediate' : 'Advanced'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ChatInterface = ({ otherUser, onClose }) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  
  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Connect to WebSocket
  useEffect(() => {
    if (!user || !token || !otherUser) return;
    
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
        loadMessages();
      } else if (data.type === 'new_message') {
        if (data.message.senderId === otherUser.id || data.message.receiverId === otherUser.id) {
          setMessages(prev => [...prev, data.message]);
          // Mark message as read
          socket.send(JSON.stringify({
            type: 'mark_read',
            senderId: otherUser.id
          }));
        }
      } else if (data.type === 'message_sent') {
        setMessages(prev => [...prev, data.message]);
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
  }, [user, token, otherUser]);
  
  // Load messages
  const loadMessages = async () => {
    if (!user || !otherUser) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/chat/messages/${otherUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
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
      setLoading(false);
    }
  };
  
  // Get course recommendations
  const { data: courseRecommendations = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ["/api/recommendations/anonymous"],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations/anonymous`);
      if (!response.ok) throw new Error("Failed to fetch recommendations");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Function to handle sharing a resource recommendation
  const shareRecommendation = (resource) => {
    if (!connected || !ws) return;
    
    const message = `Check out this resource: ${resource.title} - ${resource.description || 'A great learning resource'}`;
    ws.send(JSON.stringify({
      type: 'chat_message',
      receiverId: otherUser.id,
      content: message
    }));
    
    toast({
      title: "Resource shared",
      description: "You've shared a learning resource",
    });
    
    // Close recommendation panel after sharing
    setShowRecommendations(false);
  };

  // Toggle recommendations panel
  const toggleRecommendations = () => {
    setShowRecommendations(prev => !prev);
  };
  
  // Send message through WebSocket
  const sendMessage = () => {
    if (!input.trim() || !connected || !ws) return;
    
    ws.send(JSON.stringify({
      type: 'chat_message',
      receiverId: otherUser.id,
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
    <div className="flex h-[600px] w-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Main chat content */}
      <div className="flex flex-col flex-grow">
        {/* Chat header */}
        <div 
          className="px-4 py-3 border-b flex items-center justify-between bg-blue-500 text-white shadow-sm"
        >
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="mr-2 text-white hover:bg-blue-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center">
              <div 
                className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center mr-3 border border-white"
              >
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">{otherUser?.username || 'User'}</h3>
                <div className="flex items-center">
                  <span 
                    className="h-2 w-2 rounded-full bg-green-400 mr-2"
                  ></span>
                  <span className="text-xs">Online</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chat actions right side of header */}
          <div className="flex items-center">
            {/* Additional chat actions can be added here if needed */}
          </div>
        </div>
        
        {/* Chat messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div 
                className="rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-500 animate-spin"
              ></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div>
                <MessageSquare className="h-12 w-12 mb-3 text-blue-300" />
              </div>
              <p className="font-medium text-lg text-blue-600 mb-2">No messages yet</p>
              <p className="text-sm text-gray-600">Send a message to start the conversation</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id || index}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, type: "spring" }}
                >
                  <ChatMessage 
                    message={message} 
                    isCurrentUser={message.senderId === user?.id} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Chat input */}
        <div 
          className="p-3 border-t flex items-center bg-gray-50"
        >
          <div className="flex items-center space-x-2 mr-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-blue-500 hover:bg-gray-100"
              disabled={!connected}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-blue-500 hover:bg-gray-100"
              disabled={!connected}
            >
              <Image className="h-5 w-5" />
            </Button>
          </div>
          
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-grow rounded-md border-gray-200 focus:border-blue-500 focus:ring-blue-200 mx-2"
            disabled={!connected}
          />
          <Button 
            onClick={sendMessage} 
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 ml-3"
            disabled={!connected || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Removed learning resources sidebar */}
      
      {!connected && (
        <div 
          className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg z-50"
        >
          <div 
            className="text-center p-6 bg-white shadow-md rounded-md border border-gray-200"
          >
            <div className="mb-4 inline-block">
              <Badge variant="outline" className="mb-2 text-lg bg-gray-50 text-blue-700 border-blue-200 px-4 py-1">
                <WifiOff className="mr-2 h-4 w-4" />
                Disconnected
              </Badge>
            </div>
            <p className="text-gray-600 mb-2">Trying to reconnect to chat service...</p>
            <div 
              className="mx-auto h-6 w-6 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin mt-4"
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;