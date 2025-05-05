import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Users, Search, UserPlus, ArrowLeft, Settings, BellRing, BellOff } from "lucide-react";
import EnhancedChatHeader from "@/components/chat/EnhancedChatHeader";
import MessageItem from "@/components/chat/MessageItem";
import ContactItem from "@/components/chat/ContactItem";
import EmptyState from "@/components/chat/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useWebSocketContext } from "@/components/chat/WebSocketContextProvider";

const EnhancedChatPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { connected, sendMessage: wsSendMessage } = useWebSocketContext();
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  // State
  const [activeTab, setActiveTab] = useState("messages");
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [chatPartners, setChatPartners] = useState([]);
  const [isPartnersLoading, setIsPartnersLoading] = useState(true);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [mutualFollows, setMutualFollows] = useState([]);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch chat partners (users who you can chat with)
  useEffect(() => {
    const fetchChatPartners = async () => {
      try {
        setIsPartnersLoading(true);
        const response = await fetch('/api/chat/partners', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setChatPartners(data.map(partner => ({
            ...partner,
            online: Math.random() > 0.5, // Just for demo, replace with actual online status
            unreadCount: Math.floor(Math.random() * 5) // Just for demo, replace with actual unread count
          })));
        } else {
          console.error('Failed to fetch chat partners');
          setChatPartners([]);
        }
      } catch (error) {
        console.error('Error fetching chat partners:', error);
        setChatPartners([]);
      } finally {
        setIsPartnersLoading(false);
      }
    };
    
    fetchChatPartners();
  }, []);

  // Fetch user network (followers & following)
  useEffect(() => {
    if (!user) return;
    
    const fetchUserNetwork = async () => {
      try {
        setIsLoadingNetwork(true);
        const token = localStorage.getItem('token');
        
        // Fetch followers
        const followersRes = await fetch(`/api/users/${user.id}/followers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Fetch following
        const followingRes = await fetch(`/api/users/${user.id}/following`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (followersRes.ok && followingRes.ok) {
          const followersData = await followersRes.json();
          const followingData = await followingRes.json();
          
          setFollowers(followersData);
          setFollowing(followingData);
          
          // Calculate mutual follows (users who follow you and you follow them)
          const mutual = followersData.filter(follower => 
            followingData.some(following => following.id === follower.id)
          );
          
          setMutualFollows(mutual);
        }
      } catch (error) {
        console.error('Error fetching user network:', error);
      } finally {
        setIsLoadingNetwork(false);
      }
    };
    
    fetchUserNetwork();
  }, [user]);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  }, [messagesEndRef]);

  // Load messages
  const loadMessages = useCallback(async (partnerId) => {
    if (!partnerId) return;

    try {
      setIsLoadingMore(true);
      console.log(`Loading messages with partner ID: ${partnerId}`);
      
      // First check localStorage for cached messages
      const chatHistoryKey = `chat_history_${partnerId}`;
      let cachedMessages = [];
      try {
        const cachedData = localStorage.getItem(chatHistoryKey);
        if (cachedData) {
          cachedMessages = JSON.parse(cachedData);
          console.log(`Found ${cachedMessages.length} cached messages in localStorage`);
        }
      } catch (cacheError) {
        console.error('Error reading from localStorage:', cacheError);
      }
      
      // Fetch messages from the server
      const response = await fetch(`/api/chat/messages/${partnerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Received ${data.length} messages from server`);
        
        // Merge server messages with any pending local messages
        // Mark all server messages as persisted
        const serverMessages = data.map(msg => ({
          ...msg,
          isPending: false,
          isFromServer: true
        }));
        
        // Filter out local messages that are already on the server
        const serverIds = new Set(serverMessages.map(msg => msg.id));
        const localOnlyMessages = cachedMessages.filter(msg => 
          !serverIds.has(msg.id) && msg.id.toString().startsWith('temp-')
        );
        
        console.log(`Found ${localOnlyMessages.length} local-only messages to merge`);
        
        // Combine and sort messages
        const combinedMessages = [...serverMessages, ...localOnlyMessages]
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        setMessages(combinedMessages);
        
        // Update localStorage with the combined set
        localStorage.setItem(chatHistoryKey, JSON.stringify(combinedMessages));
        
        scrollToBottom(false);
      } else {
        console.error('Server returned error fetching messages:', await response.text());
        // If server fetch fails, at least display cached messages
        if (cachedMessages.length > 0) {
          setMessages(cachedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
          scrollToBottom(false);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [scrollToBottom, toast]);

  // Send message
  const sendMessage = useCallback(() => {
    if (!input.trim() || !activeChat || !connected) return;

    const tempId = `temp-${Date.now()}`;
    const messageData = {
      type: "chat_message",
      content: input.trim(),
      receiverId: activeChat.id,
      tempId,
      senderId: user.id
    };

    // Add message to UI immediately
    const newMessage = {
      id: tempId,
      senderId: user.id,
      receiverId: activeChat.id,
      content: input.trim(),
      createdAt: new Date().toISOString(),
      isPending: true,
      sender: user
    };

    setMessages(prev => [...prev, newMessage]);
    setInput("");
    scrollToBottom();
    
    // Store message in localStorage before sending
    try {
      const chatHistoryKey = `chat_history_${activeChat.id}`;
      const existingHistory = JSON.parse(localStorage.getItem(chatHistoryKey) || '[]');
      existingHistory.push(newMessage);
      localStorage.setItem(chatHistoryKey, JSON.stringify(existingHistory));
      console.log(`Saved pending message to localStorage: ${tempId}`);
    } catch (storageError) {
      console.error('Failed to save message to localStorage:', storageError);
    }

    // Send through WebSocket
    wsSendMessage(messageData);
    console.log(`Sent message via WebSocket: ${tempId}`);
  }, [input, activeChat, connected, user, scrollToBottom, wsSendMessage]);

  // Handle key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle WebSocket messages
  useEffect(() => {
    const handleMessage = (event) => {
      const data = event.detail;
      console.log('WebSocket message received:', data.type);
      
      if (data.type === "chat_message") {
        const newMessage = {
          id: data.id || `temp-${Date.now()}`,
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          createdAt: data.createdAt || new Date().toISOString(),
          sender: data.sender,
          isPending: false,
          isFromServer: true
        };
        
        console.log(`Received chat message: from=${newMessage.senderId}, to=${newMessage.receiverId}, id=${newMessage.id}`);

        // Store message in localStorage for all conversations, not just the active one
        try {
          const partnerId = newMessage.senderId === user.id ? newMessage.receiverId : newMessage.senderId;
          const chatHistoryKey = `chat_history_${partnerId}`;
          console.log(`Storing message in localStorage for partner ${partnerId}`);
          
          // Get existing messages
          const existingHistory = JSON.parse(localStorage.getItem(chatHistoryKey) || '[]');
          
          // Avoid duplicates
          if (!existingHistory.some(msg => msg.id === newMessage.id)) {
            existingHistory.push(newMessage);
            localStorage.setItem(chatHistoryKey, JSON.stringify(existingHistory));
            console.log(`Saved message to localStorage: ${newMessage.id}`);
          }
        } catch (storageError) {
          console.error('Failed to save message to localStorage:', storageError);
        }

        // Only add the message to UI if it's relevant to the current chat
        if (activeChat && 
            ((newMessage.senderId === activeChat.id && newMessage.receiverId === user.id) || 
             (newMessage.senderId === user.id && newMessage.receiverId === activeChat.id))) {
          console.log(`Adding message to current chat UI: ${newMessage.id}`);
          setMessages(prev => {
            // Avoid duplicates in UI
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
          scrollToBottom();
          
          // Mark received messages as read
          if (newMessage.senderId !== user.id) {
            console.log(`Marking message ${newMessage.id} as read`);
            wsSendMessage({
              type: 'mark_read',
              messageId: newMessage.id,
              senderId: newMessage.senderId
            });
          }
        } else {
          console.log('Message not relevant to current chat, stored in localStorage only');
        }
      } else if (data.type === 'message_sent' || data.type === 'message_ack') {
        console.log('Message confirmation received:', data);
        // Update message status
        setMessages(prev => prev.map(msg => {
          // Check if this is the message we're looking for using tempId
          if (msg.id === data.tempId) {
            console.log('Found pending message to update:', msg.id);
            // For message_sent response, the message ID is in data.message.id
            const newId = data.message?.id || data.messageId;
            console.log(`Updating message from tempId ${msg.id} to permanent ID ${newId}`);
            
            // Store the updated message ID in localStorage for persistence
            try {
              if (newId && activeChat) {
                // Get current chat history from localStorage or initialize empty
                const chatHistoryKey = `chat_history_${activeChat.id}`;
                const existingHistory = JSON.parse(localStorage.getItem(chatHistoryKey) || '[]');
                
                // Find and update the temp message if it exists
                const updatedHistory = existingHistory.map(historyMsg => 
                  historyMsg.id === msg.id ? { ...historyMsg, id: newId, isPending: false } : historyMsg
                );
                
                // If not found, add it
                if (!updatedHistory.some(historyMsg => historyMsg.id === newId || historyMsg.id === msg.id)) {
                  updatedHistory.push({ ...msg, id: newId, isPending: false });
                }
                
                // Save back to localStorage
                localStorage.setItem(chatHistoryKey, JSON.stringify(updatedHistory));
                console.log(`Updated chat history in localStorage for partner ${activeChat.id}`);
              }
            } catch (storageError) {
              console.error('Failed to update localStorage chat history:', storageError);
            }
            
            return { ...msg, id: newId, isPending: false };
          }
          return msg;
        }));
      } else if (data.type === 'messages_read') {
        console.log('Messages read confirmation received:', data);
        // This would be for read receipts and UI updates to show messages as read
        setMessages(prev => prev.map(msg => {
          if (msg.senderId === user.id && msg.receiverId === data.userId && !msg.isRead) {
            return { ...msg, isRead: true };
          }
          return msg;
        }));
      }
    };

    window.addEventListener('ws:message', handleMessage);
    return () => window.removeEventListener('ws:message', handleMessage);
  }, [activeChat, user, wsSendMessage, scrollToBottom]);

  // Watch for active chat changes to load messages
  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
    }
  }, [activeChat, loadMessages]);

  // Filter contacts based on search query
  const filteredContacts = useCallback((contacts) => {
    if (!searchQuery) return contacts;
    return contacts.filter(contact => 
      contact.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Filter chat partners based on search
  const filteredChatPartners = filteredContacts(chatPartners);
  // Filter mutual follows based on search
  const filteredMutualFollows = filteredContacts(mutualFollows);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - always visible on desktop, toggleable on mobile */}
        <AnimatePresence>
          {(isMobileSidebarOpen || window.innerWidth >= 1024) && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className={`w-80 flex-shrink-0 bg-gradient-to-b from-orange-50 to-white border-r border-orange-200 flex flex-col shadow-lg ${isMobileSidebarOpen ? 'absolute inset-y-0 left-0 z-50 md:relative' : 'hidden lg:flex'}`}
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-orange-200 bg-gradient-to-r from-orange-100/50 via-orange-50 to-orange-100/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-orange-900 font-bold text-xl">Messages</h2>
                  
                  {/* Mobile close button */}
                  {isMobileSidebarOpen && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="lg:hidden text-orange-700 hover:bg-orange-100"
                      onClick={() => setIsMobileSidebarOpen(false)}
                    >
                      <ArrowLeft size={20} />
                    </Button>
                  )}
                  
                  {/* Settings */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-orange-700 hover:bg-orange-100 rounded-full h-8 w-8"
                  >
                    <Settings size={18} />
                  </Button>
                </div>
                
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 h-4 w-4" />
                  <Input
                    placeholder="Search messages or contacts"
                    className="pl-10 bg-white/90 border-orange-200 text-sm rounded-full focus-visible:ring-orange-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Tabs */}
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="w-full justify-start px-4 pt-2 bg-transparent border-b border-orange-100">
                  <TabsTrigger 
                    value="messages" 
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:shadow-none rounded-none px-4 py-2 data-[state=active]:text-orange-800"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                  </TabsTrigger>
                  <TabsTrigger 
                    value="network" 
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:shadow-none rounded-none px-4 py-2 data-[state=active]:text-orange-800"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Network
                  </TabsTrigger>
                </TabsList>
                
                {/* Messages Tab Content */}
                <TabsContent value="messages" className="flex-1 overflow-hidden mt-0 p-0">
                  <ScrollArea className="h-full p-3">
                    {isPartnersLoading ? (
                      <div className="flex justify-center items-center h-20">
                        <div className="animate-spin h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full" />
                      </div>
                    ) : filteredChatPartners.length === 0 ? (
                      <div className="text-center p-8 text-orange-600">
                        {searchQuery ? (
                          <p>No conversations match your search</p>
                        ) : (
                          <div>
                            <p className="mb-2">No conversations yet</p>
                            <p className="text-sm text-orange-500">Connect with users who follow you to start chatting</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredChatPartners.map((partner) => (
                          <ContactItem 
                            key={partner.id}
                            contact={partner}
                            isActive={activeChat?.id === partner.id}
                            onClick={(contact) => {
                              setActiveChat(contact);
                              if (window.innerWidth < 1024) {
                                setIsMobileSidebarOpen(false);
                              }
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                {/* Network Tab Content */}
                <TabsContent value="network" className="flex-1 overflow-hidden mt-0 p-0">
                  <ScrollArea className="h-full p-3">
                    {isLoadingNetwork ? (
                      <div className="flex justify-center items-center h-20">
                        <div className="animate-spin h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full" />
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-sm font-medium text-orange-700 mb-2 px-2">Users You Can Chat With</h3>
                        <p className="text-xs text-orange-500 mb-4 px-2">These users follow you and you follow them</p>
                        
                        {filteredMutualFollows.length === 0 ? (
                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            {searchQuery ? (
                              <p className="text-orange-600">No mutual follows match your search</p>
                            ) : (
                              <div>
                                <p className="text-orange-600 mb-2">No mutual follows yet</p>
                                <p className="text-xs text-orange-500">Follow others and get them to follow you back</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {filteredMutualFollows.map((user) => (
                              <ContactItem 
                                key={user.id}
                                contact={{
                                  ...user,
                                  lastMessage: user.email || 'Mutual follower'
                                }}
                                isActive={false}
                                showUnread={false}
                                onClick={() => {
                                  // Check if this user is already in chat partners
                                  const existingPartner = chatPartners.find(p => p.id === user.id);
                                  setActiveChat(existingPartner || user);
                                  setActiveTab("messages");
                                  if (window.innerWidth < 1024) {
                                    setIsMobileSidebarOpen(false);
                                  }
                                }}
                              />
                            ))}
                          </div>
                        )}
                        
                        {/* Following but not mutual */}
                        <h3 className="text-sm font-medium text-orange-700 mt-6 mb-2 px-2">People You Follow</h3>
                        <p className="text-xs text-orange-500 mb-3 px-2">They need to follow you back to enable chat</p>
                        
                        {following.length === 0 ? (
                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <p className="text-orange-600">You're not following anyone yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {following
                              .filter(f => !mutualFollows.some(m => m.id === f.id))
                              .filter(f => f.username?.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery === "")
                              .slice(0, 5) // Limit to 5
                              .map((user) => (
                                <div key={user.id} className="flex items-center p-3 rounded-lg border border-orange-100">
                                  <Avatar className="h-10 w-10 mr-3">
                                    <AvatarFallback className="bg-gray-100 text-gray-800">
                                      {user.username?.substring(0, 2) || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-gray-700">{user.username}</p>
                                    <p className="text-xs text-gray-500">Waiting for follow-back</p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat area - main content */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {activeChat ? (
            <>
              {/* Chat header */}
              <div className="border-b border-orange-200 p-3 flex items-center bg-gradient-to-r from-orange-50 via-white to-orange-50">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mr-2 lg:hidden text-orange-700 hover:bg-orange-100 h-9 w-9"
                  onClick={() => setIsMobileSidebarOpen(true)}
                >
                  <ArrowLeft size={18} />
                </Button>
                
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback className="bg-orange-100 text-orange-800">
                    {activeChat.username?.substring(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="font-medium text-orange-900">{activeChat.username}</h3>
                  <p className="text-xs text-orange-500">
                    {activeChat.online ? "Online" : "Offline"}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-orange-700 hover:bg-orange-100 h-9 w-9 rounded-full"
                    title="Toggle notifications"
                  >
                    {Math.random() > 0.5 ? <BellRing size={18} /> : <BellOff size={18} />}
                  </Button>
                </div>
              </div>
              
              {/* Chat messages */}
              <ScrollArea ref={scrollAreaRef} className="flex-1">
                {isLoadingMore ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <div className="h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                      <MessageSquare size={36} className="text-orange-500" />
                    </div>
                    <h3 className="text-xl font-medium text-orange-900 mb-2">No messages yet</h3>
                    <p className="text-orange-600">Send a message to start the conversation</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {messages.map((message) => (
                      <MessageItem 
                        key={message.id} 
                        message={message} 
                        isCurrentUser={message.senderId === user?.id} 
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
              
              {/* Chat input */}
              <div className="border-t border-orange-200 p-3 bg-orange-50">
                <div className="flex items-end bg-white rounded-lg border border-orange-200 overflow-hidden shadow-sm">
                  <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${activeChat.username}...`}
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!input.trim() || !connected}
                    className="m-1 bg-orange-500 hover:bg-orange-600 text-white h-9 px-3 rounded-md"
                  >
                    Send
                  </Button>
                </div>
                {!connected && (
                  <p className="text-xs text-red-500 mt-1 text-center">
                    You're offline. Messages will be sent when you reconnect.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="h-full bg-gradient-to-b from-orange-50/50 to-white">
              {/* Mobile toggle for sidebar */}
              <div className="lg:hidden absolute top-4 left-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="h-10 w-10 rounded-full border-orange-200 text-orange-700"
                >
                  <MessageSquare size={20} />
                </Button>
              </div>
              
              <EmptyState
                hasMutualFollowers={mutualFollows.length > 0}
                onStartChat={() => {
                  if (mutualFollows.length > 0) {
                    setIsMobileSidebarOpen(true);
                    setActiveTab('messages');
                  } else {
                    setIsMobileSidebarOpen(true);
                    setActiveTab('network');
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatPage;