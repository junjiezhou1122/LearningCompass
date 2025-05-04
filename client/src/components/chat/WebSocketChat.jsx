import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Send, User, Users, UserPlus, Bell, Menu } from 'lucide-react';

export default function WebSocketChat() {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const bottomRef = useRef(null);

  // Set up WebSocket connection
  useEffect(() => {
    if (!user) return;

    // Determine WebSocket URL based on the current protocol (ws or wss)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log('WebSocket connection established');
      setConnected(true);
      setError('');
      
      // Authenticate with the WebSocket server
      // In a real app, you'd use a proper JWT token
      if (user && user.id) {
        newSocket.send(JSON.stringify({
          type: 'auth',
          token: user.id.toString(), // This is a simplified approach; use proper JWT in production
        }));
      }
    };
    
    newSocket.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
    };
    
    newSocket.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Failed to connect to chat server');
      setConnected(false);
    };
    
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        
        switch (data.type) {
          case 'direct_message':
            handleDirectMessage(data);
            break;
          case 'user_online':
            handleUserOnline(data);
            break;
          case 'user_offline':
            handleUserOffline(data);
            break;
          case 'error':
            setError(data.data.message);
            break;
          case 'pong':
            // Received pong from server (keep-alive)
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    setSocket(newSocket);
    
    // Clean up function
    return () => {
      if (newSocket && newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    };
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Handle direct message received
  const handleDirectMessage = (data) => {
    setChatHistory((prevHistory) => [
      ...prevHistory,
      {
        id: data.data.messageId || Date.now(),
        sender: data.data.sender || { id: user?.id, username: 'You' },
        content: data.data.content,
        timestamp: data.timestamp,
        isIncoming: data.data.sender?.id !== user?.id,
      },
    ]);
  };

  // Handle user coming online
  const handleUserOnline = (data) => {
    const userId = data.data.userId;
    setOnlineUsers((prevUsers) => {
      if (!prevUsers.includes(userId)) {
        return [...prevUsers, userId];
      }
      return prevUsers;
    });
  };

  // Handle user going offline
  const handleUserOffline = (data) => {
    const userId = data.data.userId;
    setOnlineUsers((prevUsers) => prevUsers.filter((id) => id !== userId));
  };

  // Send a message
  const sendMessage = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !message.trim() || !recipient) {
      return;
    }

    const messageData = {
      type: 'direct_message',
      data: {
        senderId: user.id,
        recipientId: recipient.id,
        content: message.trim(),
      },
    };

    socket.send(JSON.stringify(messageData));
    setMessage('');
  };

  // For demo purposes: get some test users
  useEffect(() => {
    // In a real app, you'd fetch this from your API
    setAvailableUsers([
      { id: 1, username: 'alice', avatar: null },
      { id: 2, username: 'bob', avatar: null },
      { id: 3, username: 'charlie', avatar: null },
    ]);
    
    // Simulate some online users
    setOnlineUsers([1, 3]);
  }, []);

  // Select a recipient for direct messaging
  const selectRecipient = (selectedUser) => {
    setRecipient(selectedUser);
    // In a real app, you'd fetch the chat history with this user
    setChatHistory([]);
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    return name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
      : '?';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] container mx-auto px-4 py-6">
      <Card className="flex flex-col h-full shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Chat</CardTitle>
            <Badge variant={connected ? 'success' : 'destructive'}>
              {connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </CardHeader>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Contacts sidebar */}
          <div className="w-1/4 border-r p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Contacts</h3>
              <Button size="icon" variant="ghost">
                <UserPlus size={18} />
              </Button>
            </div>
            
            <div className="space-y-2">
              {availableUsers.map((contact) => (
                <div 
                  key={contact.id} 
                  className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ${recipient?.id === contact.id ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                  onClick={() => selectRecipient(contact)}
                >
                  <Avatar className="h-9 w-9 mr-2">
                    <AvatarImage src={contact.avatar} alt={contact.username} />
                    <AvatarFallback>{getInitials(contact.username)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium">{contact.username}</span>
                      {onlineUsers.includes(contact.id) && (
                        <div className="ml-2 h-2 w-2 rounded-full bg-green-500" title="Online"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {recipient ? (
              <>
                {/* Chat header */}
                <div className="border-b p-3 flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={recipient.avatar} alt={recipient.username} />
                    <AvatarFallback>{getInitials(recipient.username)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{recipient.username}</h3>
                    <p className="text-xs text-slate-500">
                      {onlineUsers.includes(recipient.id) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatHistory.length === 0 ? (
                      <div className="text-center text-slate-500 pt-8">
                        <p>No messages yet</p>
                        <p className="text-sm">Send a message to start the conversation</p>
                      </div>
                    ) : (
                      chatHistory.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex ${msg.isIncoming ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`max-w-[70%] ${msg.isIncoming ? 'bg-slate-100 dark:bg-slate-800' : 'bg-primary text-primary-foreground'} rounded-lg p-3`}>
                            <p>{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>
                
                {/* Message input */}
                <div className="border-t p-3">
                  {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                  <div className="flex items-center gap-2">
                    <Input 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      disabled={!connected}
                    />
                    <Button disabled={!connected} onClick={sendMessage}>
                      <Send size={18} />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <Users size={48} className="mx-auto text-slate-400 mb-4" />
                  <h3 className="text-xl font-medium mb-2">Select a contact</h3>
                  <p className="text-slate-500">
                    Choose someone from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
