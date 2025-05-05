import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Info,
  Circle,
} from "lucide-react";

// Chat message component
const ChatMessage = ({ message, isCurrentUser }) => {
  const formattedTime = format(new Date(message.createdAt), "h:mm a");
  const formattedDate = format(new Date(message.createdAt), "MMMM d, yyyy");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring" }}
      className={`relative flex items-start mb-2.5 py-1.5 px-2 group hover:bg-orange-50/70 rounded ${
        isCurrentUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isCurrentUser && (
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 mr-2 mt-1"
        >
          <Avatar className="h-8 w-8 border border-orange-100 shadow-sm animate-float">
            <AvatarFallback className="bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs font-medium">
              {message.sender?.username?.substring(0, 2) || "U"}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}

      <motion.div 
        className={`max-w-[75%]`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {!isCurrentUser && (
          <div className="flex items-center mb-1">
            <span className="text-sm font-medium text-orange-600 hover:underline cursor-pointer">
              {message.sender?.username || "User"}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-orange-400 ml-2 cursor-default">
                    {formattedTime}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
                  <p>{formattedDate}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl shadow-sm backdrop-blur-sm ${
            isCurrentUser
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
              : "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-800 border border-orange-100"
          } ${isCurrentUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        {isCurrentUser && (
          <div className="text-xs text-orange-400 mt-1 text-right mr-1 flex items-center justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default">{formattedTime}</span>
                </TooltipTrigger>
                <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
                  <p>{formattedDate}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {message.isRead && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-1 text-orange-500 flex items-center"
              >
                • Read
              </motion.span>
            )}
          </div>
        )}
      </motion.div>

      {isCurrentUser && (
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 ml-2 mt-1"
        >
          <Avatar className="h-8 w-8 border border-orange-100 shadow-sm animate-float">
            <AvatarFallback className="bg-gradient-to-r from-orange-600 to-orange-700 text-white text-xs font-medium">
              {message.sender?.username?.substring(0, 2) || "U"}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}

      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 group-hover:scale-100">
        <div className="flex space-x-1 bg-white/80 backdrop-blur-sm rounded-md border border-orange-200 shadow-sm p-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-orange-500 hover:bg-orange-50 rounded-full transition-colors duration-200"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
                <p>Reply</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  );
};

// Server/Channel component
const Channel = ({ name, isActive, unreadCount, onClick }) => {
  return (
    <motion.div
      whileHover={{ x: 3, scale: 1.02 }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`flex items-center py-2 px-3 rounded-xl mb-1.5 cursor-pointer shadow-sm transition-all duration-200 ${
        isActive
          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
          : "text-orange-800 hover:bg-orange-100 hover:text-orange-900"
      }`}
      onClick={onClick}
    >
      <div className={`mr-2 ${isActive ? "text-white" : "text-orange-500"}`}>
        <Hash className="h-3.5 w-3.5" />
      </div>
      <span className="text-xs font-medium truncate">{name}</span>
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="ml-auto"
        >
          <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-orange-500 text-white border-0 shadow-md">
            {unreadCount}
          </Badge>
        </motion.div>
      )}
    </motion.div>
  );
};

// Direct message component
const DirectMessage = ({ user, isActive, isOnline, unreadCount, onClick }) => {
  return (
    <motion.div
      whileHover={{ x: 3, scale: 1.02 }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`flex items-center py-2 px-3 rounded-xl mb-1.5 cursor-pointer ${isActive 
        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md" 
        : "text-orange-800 hover:bg-orange-100/70 hover:text-orange-900 shadow-sm"} 
        border border-orange-100 transition-all duration-200`}
      onClick={onClick}
    >
      <div className="relative mr-2.5">
        <Avatar className="h-8 w-8 border border-orange-100 shadow-md">
          <AvatarFallback
            className={`${
              isActive
                ? "bg-gradient-to-r from-orange-600 to-orange-700 text-white"
                : "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800"
            } text-xs font-medium`}
          >
            {user.username?.substring(0, 2) || "U"}
          </AvatarFallback>
        </Avatar>
        {isOnline ? (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-[1.5px] border-white shadow-sm"
          ></motion.span>
        ) : (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-gray-400 border-[1.5px] border-white shadow-sm"
          ></motion.span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-orange-800"}`}>
            {user.username}
          </span>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
            >
              <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-orange-500 text-white border-0 shadow-md">
                {unreadCount}
              </Badge>
            </motion.div>
          )}
        </div>
        <p className={`text-xs truncate ${isActive ? "text-orange-100" : "text-orange-500"}`}>
          {isOnline ? "Online" : "Offline"}
        </p>
      </div>
    </motion.div>
  );
};

const ChatPage = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  // State variables
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
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

  // Mock chat partners - replace with real data from API
  const chatPartners = [
    { id: 1, username: "Alice", online: true, unreadCount: 3 },
    { id: 2, username: "Bob", online: false, unreadCount: 0 },
    { id: 3, username: "Charlie", online: true, unreadCount: 1 },
    { id: 4, username: "David", online: false, unreadCount: 0 },
  ];
  const isPartnersLoading = false;

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

  // Keep chat container sized properly when window resizes
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
        const headerHeight = 66; 
        const viewportHeight = window.innerHeight;
        chatContainer.style.height = `${viewportHeight - headerHeight}px`;
      }

      if (messagesContainer) {
        // Set the messages container height by accounting for the chat input and header
        const chatHeaderHeight = 56; // Updated for the new larger header
        const chatInputHeight = 60; // Estimated
        const messagesContainerHeight =
          chatContainer.offsetHeight - chatHeaderHeight - chatInputHeight;
        messagesContainer.style.height = `${messagesContainerHeight}px`;
      }

      if (sidebarScrollArea) {
        // Handle the sidebar scroll area height - account for search input height
        const searchInputHeight = 60; // Estimated for new design
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

  // Set up WebSocket connection when component mounts
  useEffect(() => {
    if (!user || !token) return;

    // Mock WebSocket setup - you'd use a real WebSocket URL in production
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.addEventListener("open", () => {
      // Authenticate with the server
      socket.send(
        JSON.stringify({
          type: "auth",
          token,
        })
      );

      setConnected(true);
    });

    socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "message_received" && activeChat) {
          // Only add message if it's from the active chat partner
          if (
            data.message.senderId === activeChat.id ||
            data.message.receiverId === activeChat.id
          ) {
            setMessages((prev) => [...prev, data.message]);
            scrollToBottom();
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });

    socket.addEventListener("close", () => {
      setConnected(false);
    });

    socket.addEventListener("error", () => {
      setConnected(false);
      toast({
        title: "Connection Error",
        description: "Failed to connect to chat server",
        variant: "destructive",
      });
    });

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [user, token, activeChat, toast, scrollToBottom]);

  // Send message function
  const sendMessage = () => {
    if (!input.trim() || !connected || !ws || !activeChat) return;

    ws.send(
      JSON.stringify({
        type: "chat_message",
        receiverId: activeChat.id,
        content: input.trim(),
      })
    );

    // Add message locally for immediate display
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(), // temporary ID
        senderId: user.id,
        receiverId: activeChat.id,
        content: input.trim(),
        createdAt: new Date().toISOString(),
        isRead: false,
        sender: user,
      },
    ]);

    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-orange-50 to-white">
      {/* Top control bar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="h-12 border-b border-orange-200 flex items-center justify-between px-4 z-10 bg-gradient-to-r from-orange-50 via-orange-100 to-orange-50 text-orange-800 shadow-sm backdrop-blur-sm"
      >
        <div className="flex items-center">
          <motion.div whileHover={{ rotate: 15 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-orange-700 hover:bg-orange-200/70 mr-2 h-8 w-8 rounded-full transition-colors duration-200 shadow-sm"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base font-semibold text-orange-800 flex items-center"
          >
            <MessageSquare className="h-5 w-5 mr-2 text-orange-600" /> 
            Messages
          </motion.h1>
        </div>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-orange-700 hover:bg-orange-200/70 h-8 w-8 rounded-full transition-all duration-200 shadow-sm"
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-orange-700 hover:bg-orange-200/70 h-8 w-8 rounded-full transition-all duration-200 shadow-sm"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </motion.div>

      <div className="flex-1 flex overflow-hidden chat-container">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`w-72 bg-gradient-to-b from-orange-50 to-white border-r border-orange-200 flex flex-col backdrop-blur-sm ${
            isMobileSidebarOpen ? "block" : "hidden"
          } lg:block overflow-hidden shadow-lg`}
          style={{ minWidth: "288px", maxWidth: "288px" }}
        >
          {/* Search */}
          <div className="p-3 border-b border-orange-200 bg-orange-100/30">
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
                >
                  <Search className="h-4 w-4" />
                </motion.div>
              </div>
              <Input
                placeholder="Find or start a conversation"
                className="pl-10 py-2 h-10 bg-white/80 border-orange-200 text-sm rounded-full placeholder:text-orange-300 focus-visible:ring-orange-500 shadow-sm hover:shadow-md transition-shadow duration-200 pr-3" 
              />
            </motion.div>
          </div>

          <ScrollArea className="flex-1 sidebar-scroll-area">
            <div className="p-3">
              <div className="mb-6">
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-between mb-2 px-1"
                >
                  <h3 className="text-xs font-semibold text-orange-700 uppercase tracking-wider">
                    Direct Messages
                  </h3>
                  <motion.div whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-orange-500 hover:text-orange-700 hover:bg-orange-100 rounded-full transition-all duration-200"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </motion.div>
                <div className="h-px bg-gradient-to-r from-orange-200 via-orange-300 to-orange-200 my-2"></div>

                {isPartnersLoading ? (
                  <div className="flex justify-center py-2">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full"
                    ></motion.div>
                  </div>
                ) : chatPartners.length === 0 ? (
                  <div className="text-center py-2 text-sm text-orange-600">
                    No conversations yet
                  </div>
                ) : (
                  <div className="space-y-1">
                    {chatPartners.map((partner) => (
                      <DirectMessage
                        key={partner.id}
                        user={partner}
                        isActive={activeChat?.id === partner.id}
                        isOnline={partner.online}
                        unreadCount={partner.unreadCount || 0}
                        onClick={() => setActiveChat(partner)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-between mb-2 px-1"
                >
                  <h3 className="text-xs font-semibold text-orange-700 uppercase tracking-wider">
                    Channels
                  </h3>
                  <motion.div whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-orange-500 hover:text-orange-700 hover:bg-orange-100 rounded-full transition-all duration-200"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </motion.div>
                <div className="h-px bg-gradient-to-r from-orange-200 via-orange-300 to-orange-200 my-2"></div>

                <div className="space-y-1">
                  <Channel
                    name="general"
                    isActive={false}
                    unreadCount={0}
                    onClick={() => {}}
                  />
                  <Channel
                    name="support"
                    isActive={false}
                    unreadCount={2}
                    onClick={() => {}}
                  />
                  <Channel
                    name="announcements"
                    isActive={false}
                    unreadCount={0}
                    onClick={() => {}}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </motion.div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {activeChat ? (
            <>
              {/* Chat header */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="h-14 border-b border-orange-200 flex items-center justify-between px-5 py-2 bg-gradient-to-r from-orange-50 via-orange-100 to-orange-50 shadow-sm"
              >
                <div className="flex items-center">
                  <div className="relative mr-3">
                    <Avatar className="h-10 w-10 border-2 border-orange-200 shadow-md">
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold">
                        {activeChat.username?.substring(0, 2) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm"
                    ></motion.span>
                  </div>
                  <div>
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center"
                    >
                      <h2 className="text-base font-semibold text-orange-800">
                        {activeChat.username}
                      </h2>
                      <Badge className="ml-2 bg-green-100 text-green-700 text-xs py-0 px-1.5 border border-green-200">
                        Online
                      </Badge>
                    </motion.div>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-xs text-orange-500">Last active today at 10:30 AM</motion.p>
                  </div>
                </div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center space-x-2"
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-orange-600 hover:bg-orange-200/70 rounded-full transition-all duration-200 shadow-sm"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
                        <p>Voice call</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-orange-600 hover:bg-orange-200/70 rounded-full transition-all duration-200 shadow-sm"
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
                        <p>Video call</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-orange-600 hover:bg-orange-200/70 rounded-full transition-all duration-200 shadow-sm"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
                        <p>Info</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              </motion.div>

              {/* Messages area */}
              <ScrollArea
                ref={scrollAreaRef}
                className="flex-1 overflow-y-auto messages-container bg-white"
              >
                {isLoadingMore && page > 1 && (
                  <div className="flex justify-center py-2">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"
                    ></motion.div>
                  </div>
                )}

                {hasMore && !isLoadingMore && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center py-2"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-orange-600 hover:bg-orange-100 hover:text-orange-700 rounded-full px-4 py-1 shadow-sm transition-all duration-200"
                      onClick={loadOlderMessages}
                    >
                      <motion.div 
                        animate={{ y: [0, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="mr-1"
                      >
                        ↑
                      </motion.div>
                      Load older messages
                    </Button>
                  </motion.div>
                )}

                <div className="flex-1"></div>

                <div className="px-4 py-2 space-y-1.5">
                  {messages.length === 0 && !isLoadingMore ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring" }}
                      className="flex flex-col items-center justify-center py-10 text-orange-600"
                    >
                      <motion.div 
                        animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 5 }}
                        className="mb-4"
                      >
                        <MessageSquare className="h-12 w-12 text-orange-300" />
                      </motion.div>
                      <p className="text-lg font-medium mb-1">No messages yet</p>
                      <p className="text-sm text-orange-500">Start a conversation with {activeChat.username}!</p>
                    </motion.div>
                  ) : (
                    messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        isCurrentUser={message.senderId === user?.id}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Chat input */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring" }}
                className="px-4 py-3 bg-gradient-to-r from-orange-50 via-orange-100/50 to-orange-50 border-t border-orange-200"
              >
                <motion.div 
                  whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                  className="flex items-end bg-white rounded-2xl px-3 py-2 border border-orange-200 shadow-sm transition-all duration-200"
                >
                  <div className="flex space-x-1 mr-2">
                    <motion.div whileHover={{ rotate: 15 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-orange-500 hover:bg-orange-100/70 rounded-full p-0 transition-colors duration-200"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ rotate: 15 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-orange-500 hover:bg-orange-100/70 rounded-full p-0 transition-colors duration-200"
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ rotate: 15 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-orange-500 hover:bg-orange-100/70 rounded-full p-0 transition-colors duration-200"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${activeChat.username}`}
                    className="flex-1 border-0 bg-transparent text-gray-800 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-orange-300 text-sm"
                  />
                  <div className="flex space-x-1 ml-2">
                    <motion.div whileHover={{ rotate: 15 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-orange-500 hover:bg-orange-100/70 rounded-full p-0 transition-colors duration-200"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ rotate: 15 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-orange-500 hover:bg-orange-100/70 rounded-full p-0 transition-colors duration-200"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        onClick={sendMessage}
                        disabled={!input.trim() || !connected}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full h-9 w-9 flex items-center justify-center p-0 shadow-md transition-all duration-200"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </>
          ) : (
            /* Empty state when no chat is selected */
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center empty-state-container bg-white"
            >
              <div className="max-w-md">
                <motion.div 
                  animate={{ y: [0, -10, 0], rotate: [0, 5, 0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 5 }}
                  className="mb-6 bg-gradient-to-r from-orange-100 to-orange-200 h-24 w-24 rounded-full flex items-center justify-center mx-auto shadow-lg"
                >
                  <MessageSquare className="h-12 w-12 text-orange-500" />
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold mb-3 text-orange-800"
                >
                  Your Messages
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-orange-600 mb-6 text-base"
                >
                  Send private messages to friends and colleagues. Select a
                  conversation or start a new one.
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 rounded-full shadow-md">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Message
                  </Button>
                </motion.div>
              </div>

              {!connected && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 p-4 bg-orange-100/70 text-orange-700 rounded-xl flex items-center shadow-md">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="mr-3 text-orange-600"
                  >
                    <WifiOff className="h-5 w-5" />
                  </motion.div>
                  <p className="text-sm font-medium">
                    Connection to chat server lost. Trying to reconnect...
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;