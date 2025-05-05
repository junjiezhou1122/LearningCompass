import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Import chat components
import ChatHeader from "@/components/chat/ChatHeader";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatConversationHeader from "@/components/chat/ChatConversationHeader";
import ChatMessagesList from "@/components/chat/ChatMessagesList";
import ChatInput from "@/components/chat/ChatInput";
import ChatEmptyState from "@/components/chat/ChatEmptyState";
import { useWebSocketContext } from "@/components/chat/WebSocketProvider";

const ChatPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { connected, sendMessage: wsSendMessage } = useWebSocketContext();
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  // State
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [chatPartners, setChatPartners] = useState([]);
  const [isPartnersLoading, setIsPartnersLoading] = useState(true);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  }, [messagesEndRef]);

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

    // Add message locally
    const tempMessage = {
      id: tempId,
      content: input.trim(),
      senderId: user.id,
      receiverId: activeChat.id,
      createdAt: new Date().toISOString(),
      isPending: true,
      sender: user
    };

    setMessages(prev => [...prev, tempMessage]);
    setInput("");
    scrollToBottom();

    // Send via WebSocket
    wsSendMessage(messageData);
  }, [input, activeChat, connected, user, wsSendMessage, scrollToBottom]);

  // Message handler
  useEffect(() => {
    const handleMessage = (data) => {
      if (!data) return;

      if (data.type === 'new_message' && data.message) {
        const newMessage = data.message;
        if (activeChat && (newMessage.senderId === activeChat.id || newMessage.receiverId === activeChat.id)) {
          setMessages(prev => {
            if (!prev.some(msg => msg.id === newMessage.id)) {
              return [...prev, newMessage].sort((a, b) => 
                new Date(a.createdAt) - new Date(b.createdAt)
              );
            }
            return prev;
          });
          scrollToBottom();

          // Mark received messages as read
          if (newMessage.senderId !== user.id) {
            wsSendMessage({
              type: 'mark_read',
              messageId: newMessage.id,
              senderId: newMessage.senderId
            });
          }
        }
      } else if (data.type === 'message_sent' || data.type === 'message_ack') {
        // Update message status
        setMessages(prev => prev.map(msg => 
          msg.id === data.tempId ? { ...msg, id: data.messageId, isPending: false } : msg
        ));
      }
    };

    window.addEventListener('ws:message', handleMessage);
    return () => window.removeEventListener('ws:message', handleMessage);
  }, [activeChat, user, wsSendMessage, scrollToBottom]);

  // Load messages
  const loadMessages = useCallback(async (partnerId) => {
    if (!partnerId) return;

    try {
      setIsLoadingMore(true);
      const response = await fetch(`/api/chat/messages/${partnerId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
        scrollToBottom(false);
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

  // Load chat partners
  useEffect(() => {
    const loadPartners = async () => {
      try {
        setIsPartnersLoading(true);
        const response = await fetch('/api/chat/partners');
        if (response.ok) {
          const data = await response.json();
          setChatPartners(data);
        }
      } catch (error) {
        console.error('Error loading chat partners:', error);
      } finally {
        setIsPartnersLoading(false);
      }
    };

    loadPartners();
  }, []);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
    }
  }, [activeChat, loadMessages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-orange-50 to-white">
      <div className="flex items-center h-12 border-b border-orange-200 px-4 bg-gradient-to-r from-orange-50 via-orange-100 to-orange-50 text-orange-800 shadow-sm z-10">
        <motion.div 
          whileHover={{ rotate: 15 }} 
          whileTap={{ scale: 0.9 }}
          className="mr-2 lg:hidden"
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-orange-700 hover:bg-orange-200/70 h-8 w-8 rounded-full transition-colors duration-200 shadow-sm"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </motion.div>

        <ChatHeader 
          isMobileSidebarOpen={isMobileSidebarOpen} 
          setIsMobileSidebarOpen={setIsMobileSidebarOpen} 
        />
      </div>

      <div className="flex-1 flex overflow-hidden chat-container">
        <ChatSidebar 
          isMobileSidebarOpen={isMobileSidebarOpen}
          setActiveChat={setActiveChat}
          activeChat={activeChat}
          chatPartners={chatPartners}
          isPartnersLoading={isPartnersLoading}
        />

        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {activeChat ? (
            <>
              <ChatConversationHeader activeChat={activeChat} />
              <ChatMessagesList 
                scrollAreaRef={scrollAreaRef}
                isLoadingMore={isLoadingMore}
                messages={messages}
                user={user}
                messagesEndRef={messagesEndRef}
              />
              <ChatInput 
                input={input}
                setInput={setInput}
                handleKeyDown={handleKeyDown}
                sendMessage={sendMessage}
                connected={connected}
                activeChat={activeChat}
              />
            </>
          ) : (
            <ChatEmptyState connected={connected} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;