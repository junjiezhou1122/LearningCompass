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
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 120 }}
      className={`flex items-end mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isCurrentUser && (
        <div className="flex-shrink-0 mr-2 mb-1">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-200 to-pink-100 flex items-center justify-center shadow-md border-2 border-white"
          >
            <User className="h-5 w-5 text-purple-600" />
          </motion.div>
        </div>
      )}
      
      <div className={`max-w-[70%] ${isCurrentUser ? 'order-1' : 'order-2'}`}>
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className={`px-4 py-3 rounded-2xl ${isCurrentUser 
            ? 'bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 text-white rounded-br-none shadow-lg shadow-pink-200/40 border border-pink-400/50' 
            : 'bg-gradient-to-br from-white via-purple-50 to-pink-50 text-gray-800 rounded-bl-none shadow-md shadow-purple-100/30 border border-purple-100'}`}
        >
          <p className="text-sm font-medium">{message.content}</p>
        </motion.div>
        <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right mr-2' : 'ml-2'}`}>
          {formattedTime}
        </div>
      </div>
      
      {isCurrentUser && (
        <div className="flex-shrink-0 ml-2 mb-1">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-200/30 border-2 border-white"
          >
            <User className="h-5 w-5 text-white" />
          </motion.div>
        </div>
      )}
    </motion.div>
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
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, type: "spring" }}
          className="px-4 py-3 border-b flex items-center justify-between bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg"
        >
          <div className="flex items-center">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="mr-2 text-white hover:bg-purple-700 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </motion.div>
            
            <div className="flex items-center">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center mr-3 border-2 border-white"
              >
                <User className="h-6 w-6 text-purple-500" />
              </motion.div>
              <div>
                <h3 className="font-semibold">{otherUser?.username || 'User'}</h3>
                <div className="flex items-center">
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-2 w-2 rounded-full bg-green-400 mr-2"
                  ></motion.span>
                  <span className="text-xs">Online</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chat actions right side of header */}
          <div className="flex items-center">
            {/* Additional chat actions can be added here if needed */}
          </div>
        </motion.div>
        
        {/* Chat messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-500"
              ></motion.div>
            </div>
          ) : messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="flex flex-col items-center justify-center h-full text-gray-500"
            >
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              >
                <MessageSquare className="h-16 w-16 mb-4 text-purple-300" />
              </motion.div>
              <p className="font-medium text-lg text-purple-700 mb-2">No messages yet</p>
              <p className="text-sm text-gray-600">Send a message to start the conversation</p>
            </motion.div>
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="p-4 border-t flex items-center bg-gradient-to-r from-purple-50 to-pink-50 shadow-inner"
        >
          <div className="flex items-center space-x-2 mr-2">
            <motion.div whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.9 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-purple-400 hover:text-purple-700 hover:bg-purple-100 rounded-full shadow-sm"
                disabled={!connected}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1, rotate: -15 }} whileTap={{ scale: 0.9 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-pink-400 hover:text-pink-600 hover:bg-pink-100 rounded-full shadow-sm"
                disabled={!connected}
              >
                <Image className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
          
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-grow rounded-full border-purple-200 focus:border-purple-500 focus:ring-pink-200 shadow-md bg-white/90 py-5"
            disabled={!connected}
          />
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }} 
            whileTap={{ scale: 0.95, rotate: -5 }}
            className="ml-3"
          >
            <Button 
              onClick={sendMessage} 
              className="rounded-full bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 hover:from-purple-700 hover:to-pink-600 shadow-lg px-5 py-6 transition-all duration-300 hover:shadow-pink-300/50 hover:shadow-xl"
              disabled={!connected || !input.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Removed learning resources sidebar */}
      
      {!connected && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center rounded-lg z-50"
        >
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="text-center p-6 bg-white shadow-xl rounded-xl border border-pink-100"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-4 inline-block"
            >
              <Badge variant="outline" className="mb-2 text-lg bg-pink-50 text-purple-800 border-purple-300 px-4 py-1">
                <WifiOff className="mr-2 h-4 w-4" />
                Disconnected
              </Badge>
            </motion.div>
            <p className="text-gray-600 mb-2">Trying to reconnect to chat service...</p>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto h-6 w-6 rounded-full border-2 border-purple-200 border-t-purple-500 mt-4"
            ></motion.div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatInterface;