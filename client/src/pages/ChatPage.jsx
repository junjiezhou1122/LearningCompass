import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Menu, MessageSquare, Loader2, AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocketContext } from "@/components/chat/WebSocketProvider";

// Import our chat components
import ChatHeader from "@/components/chat/ChatHeader";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatConversationHeader from "@/components/chat/ChatConversationHeader";
import ChatMessagesList from "@/components/chat/ChatMessagesList";
import ChatInput from "@/components/chat/ChatInput";
import ChatEmptyState from "@/components/chat/ChatEmptyState";
import ChatConnectionStatus from "@/components/chat/ChatConnectionStatus";

// Custom hook for handling message operations
import { useMessaging } from "@/hooks/use-chat-messaging";

const ChatPage = () => {
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  // State variables
  const [input, setInput] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Get WebSocket context
  const webSocket = useWebSocketContext();
  
  // Get connection status from WebSocket context
  const { connectionState, reconnectAttempt, isAuthenticated } = webSocket;
  const isWebSocketConnected = connectionState === 'connected';
  
  // Use our enhanced chat messaging hook
  const {
    // State
    partners,
    isLoadingPartners,
    activeChat,
    setActiveChat,
    messages,
    isLoadingMessages,
    hasMoreMessages,
    isPolling,
    
    // Actions
    fetchPartners,
    loadMessages,
    loadOlderMessages,
    sendMessage,
    retryMessage,
    markMessagesAsRead
  } = useMessaging({
    webSocket,
    messagesPerPage: 15
  });

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(
    (smooth = true) => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: smooth ? "smooth" : "auto",
          block: "end",
        });
      }
    },
    [messagesEndRef]
  );
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && !isLoadingMessages) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages, isLoadingMessages, scrollToBottom]);

  // Handle scroll events for detecting when to load older messages
  const handleScroll = useCallback(
    (event) => {
      // Load older messages when user scrolls to the top
      const scrollTop = event.currentTarget.scrollTop;
      if (scrollTop < 50 && hasMoreMessages && !isLoadingMessages) {
        loadOlderMessages();
      }
    },
    [hasMoreMessages, isLoadingMessages, loadOlderMessages]
  );

  // Set up scroll event listener
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector(
      'div[role="presentation"]'
    );
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Handle viewport and container resizing
  useEffect(() => {
    const handleResize = () => {
      // Force recalculation of container heights
      const chatContainer = document.querySelector(".chat-container");
      const messagesContainer = document.querySelector(".messages-container");
      const sidebarScrollArea = document.querySelector(".sidebar-scroll-area");
      const emptyStateContainer = document.querySelector(
        ".empty-state-container"
      );

      if (chatContainer) {
        const headerHeight = 64; // Height of the main app header
        const viewportHeight = window.innerHeight;
        chatContainer.style.height = `${viewportHeight - headerHeight}px`;
      }

      if (messagesContainer) {
        // Set the messages container height by accounting for the chat input and header
        const chatHeaderHeight = 64; // Estimated
        const chatInputHeight = 68; // Estimated
        const messagesContainerHeight =
          chatContainer.offsetHeight - chatHeaderHeight - chatInputHeight;
        messagesContainer.style.height = `${messagesContainerHeight}px`;
      }

      if (sidebarScrollArea) {
        // Handle the sidebar scroll area height - account for search input height
        const searchInputHeight = 72; // Estimated
        const sidebarAreaHeight =
          chatContainer.offsetHeight - searchInputHeight;
        sidebarScrollArea.style.height = `${sidebarAreaHeight}px`;
      }

      if (emptyStateContainer) {
        // Handle the empty state container height
        emptyStateContainer.style.height = `${chatContainer.offsetHeight}px`;
      }
    };

    // Initial calculation
    setTimeout(handleResize, 100);

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Clean up on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle sending a new message
  const handleSendMessage = useCallback(() => {
    if (!input.trim() || !activeChat) return;
    
    // Send the message
    sendMessage(input.trim(), activeChat.id);
    
    // Clear the input
    setInput("");
    
    // Scroll to bottom after a short delay to ensure the new message is rendered
    setTimeout(() => scrollToBottom(), 100);
  }, [input, activeChat, sendMessage, scrollToBottom]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  
  // Handle key press in the input field
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent the default action (newline)
      handleSendMessage();
    }
  };
  
  // Handle retrying a failed message
  const handleRetryMessage = useCallback((tempId) => {
    retryMessage(tempId);
  }, [retryMessage]);
  
  // Handle selecting a chat partner
  const handleChatSelect = useCallback((partner) => {
    setActiveChat(partner);
    setIsMobileSidebarOpen(false); // Close mobile sidebar when selecting a chat
  }, [setActiveChat]);
  
  // Toggle the mobile sidebar
  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(prev => !prev);
  }, []);
  
  // Import our new ChatConnectionStatus component
  const renderConnectionStatus = () => {
    return <ChatConnectionStatus />;
  };

  // Main render function
  return (
    <div className="chat-container relative flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden">
      {/* Mobile chat header with hamburger menu */}
      <div className="md:hidden bg-primary text-primary-foreground py-3 px-4 flex items-center justify-between">
        <Button
          variant="ghost" 
          size="icon"
          onClick={toggleMobileSidebar}
          className="p-1"
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        <div className="flex items-center">
          <ChatHeader title="Messages" />
          {renderConnectionStatus()}
        </div>
      </div>
      
      {/* Chat Sidebar */}
      <AnimatePresence>
        {(isMobileSidebarOpen || !activeChat || window.innerWidth >= 768) && (
          <motion.div 
            className={`sidebar-wrapper w-full md:w-80 border-r border-border bg-card ${isMobileSidebarOpen ? 'absolute md:relative z-10 h-full' : 'md:relative'}`}
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="hidden md:flex items-center justify-between p-4 border-b border-border">
              <ChatHeader title="Messages" />
              {renderConnectionStatus()}
            </div>
            
            <ChatSidebar 
              partners={partners}
              activeChat={activeChat}
              onSelectChat={handleChatSelect}
              isLoading={isLoadingPartners}
              onClose={() => setIsMobileSidebarOpen(false)}
              isMobile={isMobileSidebarOpen}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Chat Main Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <ChatConversationHeader
              activeChat={activeChat}
              onBack={() => setIsMobileSidebarOpen(true)}
            />
            
            {/* Messages Area */}
            <div ref={scrollAreaRef} className="messages-container flex-1 overflow-y-auto p-4">
              {isLoadingMessages && messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Load more messages button */}
                  {hasMoreMessages && !isLoadingMessages && (
                    <div className="flex justify-center mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadOlderMessages}
                        disabled={isLoadingMessages}
                      >
                        {isLoadingMessages ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <>
                            <span>Load older messages</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  
                  {/* Loading older messages indicator */}
                  {isLoadingMessages && messages.length > 0 && (
                    <div className="flex justify-center mb-4">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                  
                  {/* Messages List */}
                  <ChatMessagesList
                    messages={messages}
                    currentUserId={webSocket?.userId}
                    onRetryMessage={handleRetryMessage}
                  />
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            
            {/* Chat Input */}
            <ChatInput
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onSend={handleSendMessage}
              placeholder="Type a message..."
            />
            
            {/* Connection status indicator (only visible on desktop) */}
            <div className="hidden md:flex justify-end p-2 border-t border-gray-100">
              <ChatConnectionStatus />
            </div>
          </>
        ) : (
          <ChatEmptyState />
        )}
      </div>
    </div>
  );
};

export default ChatPage;