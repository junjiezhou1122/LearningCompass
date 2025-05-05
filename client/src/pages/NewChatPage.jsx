import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Import our new chat components
import ChatHeader from "@/components/chat/ChatHeader";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatConversationHeader from "@/components/chat/ChatConversationHeader";
import ChatMessagesList from "@/components/chat/ChatMessagesList";
import ChatInput from "@/components/chat/ChatInput";
import ChatEmptyState from "@/components/chat/ChatEmptyState";

// Import our new WebSocket hook
import { useWebSocketContext } from "@/components/chat/WebSocketProvider";

const ChatPage = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  // Get WebSocket connection from context
  const {
    connected,
    connectionState,
    sendMessage,
    lastMessage,
    reconnectAttempt
  } = useWebSocketContext();

  // State variables
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Constants
  const MESSAGES_PER_PAGE = 15; // Number of messages to load per page

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

  // Load chat partners from API
  const [chatPartners, setChatPartners] = useState([]);
  const [isPartnersLoading, setIsPartnersLoading] = useState(true);

  // Fetch chat partners from API
  useEffect(() => {
    if (!token) return;
    
    const fetchChatPartners = async () => {
      try {
        setIsPartnersLoading(true);
        const response = await fetch('/api/chat/partners', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setChatPartners(data);
        } else {
          console.error('Failed to fetch chat partners');
          setChatPartners([]); // Set empty array on failure
        }
      } catch (error) {
        console.error('Error fetching chat partners:', error);
        setChatPartners([]); // Set empty array on error
      } finally {
        setIsPartnersLoading(false);
      }
    };
    
    fetchChatPartners();
  }, [token]);

  // Function to load older messages when user scrolls to the top of the chat
  const loadOlderMessages = useCallback(() => {
    if (!hasMore || isLoadingMore || !activeChat || !token) return;

    setIsLoadingMore(true);

    fetch(`/api/chat/messages/${activeChat.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.ok) return response.json();
        throw new Error("Failed to load older messages");
      })
      .then((allData) => {
        // Sort messages by date (oldest to newest)
        const sortedData = [...allData].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        // Simulate pagination
        const totalMessages = sortedData.length;
        const currentPage = page + 1;
        const startIndex = Math.max(
          0,
          totalMessages - currentPage * MESSAGES_PER_PAGE
        );
        const endIndex = totalMessages;
        const paginatedData = sortedData.slice(startIndex, endIndex);

        // Update messages
        setMessages((prev) => [
          ...paginatedData.filter(
            (msg) => !prev.some((existing) => existing.id === msg.id)
          ),
          ...prev,
        ]);

        setPage(currentPage);
        setHasMore(startIndex > 0);
      })
      .catch((error) => {
        console.error("Error loading older messages:", error);
        toast({
          title: "Error",
          description: "Failed to load older messages",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  }, [
    hasMore,
    isLoadingMore,
    activeChat,
    token,
    page,
    MESSAGES_PER_PAGE,
    toast,
  ]);

  // Function to load messages for a chat conversation
  const loadMessages = useCallback(
    async (partnerId, isLoadingOlder = false) => {
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

        const response = await fetch(`/api/chat/messages/${partnerId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const allData = await response.json();
          // Sort messages by date (oldest to newest)
          const sortedData = [...allData].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );

          // Simulate pagination
          const totalMessages = sortedData.length;
          const currentPage = isLoadingOlder ? page + 1 : 1;
          const startIndex = Math.max(
            0,
            totalMessages - currentPage * MESSAGES_PER_PAGE
          );
          const endIndex = totalMessages;
          const paginatedData = sortedData.slice(startIndex, endIndex);

          // Update state
          if (isLoadingOlder) {
            // If loading older messages, prepend them to existing messages
            setMessages((prev) => [
              ...paginatedData.filter(
                (msg) => !prev.some((existing) => existing.id === msg.id)
              ),
              ...prev,
            ]);
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
          console.error("Error fetching messages:", await response.text());
          toast({
            title: "Error",
            description: "Failed to load messages",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      } finally {
        setIsLoadingMore(false);
      }
    },
    [token, page, MESSAGES_PER_PAGE, toast, scrollToBottom]
  );

  // Handle scroll events for detecting when to load more messages
  const handleScroll = useCallback(
    (event) => {
      // Load older messages when user scrolls to the top
      const scrollTop = event.currentTarget.scrollTop;
      if (scrollTop < 50 && hasMore && !isLoadingMore) {
        loadOlderMessages();
      }
    },
    [hasMore, isLoadingMore, loadOlderMessages]
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

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(messages.length < MESSAGES_PER_PAGE);
    }
  }, [messages, scrollToBottom, MESSAGES_PER_PAGE]);

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

  // Process new WebSocket messages
  useEffect(() => {
    if (!lastMessage || !activeChat) return;
    
    // Handle new messages
    if (lastMessage.type === 'new_message' && lastMessage.message) {
      const newMessage = lastMessage.message;
      
      // Only add if it's from or to the active chat partner
      if (newMessage.senderId === activeChat.id || newMessage.receiverId === activeChat.id) {
        // Add the message if it's not already in the list
        setMessages(prev => {
          if (!prev.some(msg => msg.id === newMessage.id)) {
            const updatedMessages = [...prev, newMessage];
            // Sort messages by time
            return updatedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          }
          return prev;
        });
        
        // Scroll to bottom when receiving a new message
        setTimeout(scrollToBottom, 100);
        
        // Mark message as read if it's not from the current user
        if (newMessage.senderId !== user.id) {
          sendMessage({
            type: 'mark_read',
            senderId: newMessage.senderId
          });
        }
      }
    }
    // Handle message sent confirmation
    else if (lastMessage.type === 'message_sent' && lastMessage.tempId) {
      // Update the message in the UI to show it's been delivered
      setMessages(prev => 
        prev.map(msg => {
          if (msg.id === lastMessage.tempId) {
            return {
              ...msg,
              id: lastMessage.message.id,
              isPending: false
            };
          }
          return msg;
        })
      );
    }
    // Handle read receipts
    else if (lastMessage.type === 'messages_read' && lastMessage.readBy) {
      // Update all sent messages to the reader as read
      if (activeChat && lastMessage.readBy === activeChat.id) {
        setMessages(prev => prev.map(msg => 
          msg.senderId === user.id && msg.receiverId === activeChat.id
            ? { ...msg, isRead: true }
            : msg
        ));
      }
    }
  }, [lastMessage, activeChat, user, sendMessage, scrollToBottom]);

  // Send message function
  const handleSendMessage = () => {
    if (!input.trim() || !activeChat || !connected) return;
    
    const tempId = `temp-${Date.now()}`; // temporary ID with 'temp-' prefix
    
    // Create a temporary message with local ID
    const tempMessage = {
      id: tempId,
      senderId: user.id,
      receiverId: activeChat.id,
      content: input.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
      sender: user,
      isPending: true // Mark as pending so we can style it differently
    };
    
    // Create message object to send to server
    const messageToSend = {
      type: "chat_message",
      receiverId: activeChat.id,
      content: tempMessage.content,
      tempId // Include temporary ID so we can update the message when we get a response
    };
    
    // Add message locally for immediate display
    setMessages((prev) => [...prev, tempMessage]);
    
    // Clear input field immediately
    setInput("");
    
    // Scroll to bottom
    setTimeout(scrollToBottom, 50);
    
    // Send message via WebSocket
    sendMessage(messageToSend);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 chat-container">
      {/* Mobile Menu Button - Only visible on small screens */}
      <div className="lg:hidden absolute left-4 top-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          aria-label={isMobileSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Sidebar - Fixed on large screens, sliding on small screens */}
        <ChatSidebar
          isOpen={isMobileSidebarOpen}
          setIsOpen={setIsMobileSidebarOpen}
          chatPartners={chatPartners}
          isLoading={isPartnersLoading}
          activeChat={activeChat}
          setActiveChat={(partner) => {
            setActiveChat(partner);
            setIsMobileSidebarOpen(false); // Close sidebar on mobile when selecting a chat
            if (partner) {
              loadMessages(partner.id);
            }
          }}
          currentUser={user}
        />

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {activeChat ? (
            <>
              <ChatConversationHeader
                partner={activeChat}
                online={connected}
                statusMessage={connectionState === 'connecting' ? 'Reconnecting...' : ''}
              />

              <ChatMessagesList
                messages={messages}
                isLoading={isLoadingMore}
                currentUser={user}
                hasMore={hasMore}
                partner={activeChat}
                messagesEndRef={messagesEndRef}
                scrollAreaRef={scrollAreaRef}
              />

              <ChatInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onSend={handleSendMessage}
                disabled={!connected}
                placeholder={connected ? "Type a message..." : "Reconnecting to chat server..."}
              />
            </>
          ) : (
            <ChatEmptyState 
              connected={connected} 
              reconnectAttempt={reconnectAttempt} 
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default ChatPage;