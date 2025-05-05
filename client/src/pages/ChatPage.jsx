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
    <div
      className={`relative flex items-start mb-1.5 py-1 px-2 group hover:bg-orange-50/70 rounded ${
        isCurrentUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isCurrentUser && (
        <div className="flex-shrink-0 mr-2 mt-1">
          <Avatar className="h-8 w-8 border border-orange-100 shadow-sm">
            <AvatarFallback className="bg-orange-100 text-orange-600 text-xs font-medium">
              {message.sender?.username?.substring(0, 2) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className={`max-w-[75%]`}>
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
          className={`px-4 py-2 rounded-lg shadow-sm ${
            isCurrentUser
              ? "bg-orange-600 text-white"
              : "bg-orange-50 text-orange-800 border border-orange-100"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        {isCurrentUser && (
          <div className="text-xs text-orange-400 mt-1 text-right mr-1">
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
              <span className="ml-1 text-orange-500">• Read</span>
            )}
          </div>
        )}
      </div>

      {isCurrentUser && (
        <div className="flex-shrink-0 ml-2 mt-1">
          <Avatar className="h-8 w-8 border border-orange-100 shadow-sm">
            <AvatarFallback className="bg-orange-600 text-white text-xs font-medium">
              {message.sender?.username?.substring(0, 2) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex space-x-1 bg-white rounded-md border border-orange-200 shadow-sm p-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-orange-500 hover:bg-orange-50 rounded-full"
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
    </div>
  );
};

// Server/Channel component
const Channel = ({ name, isActive, unreadCount, onClick }) => {
  return (
    <div
      className={`flex items-center py-1.5 px-2 rounded-md mb-1 cursor-pointer shadow-sm ${
        isActive
          ? "bg-orange-600 text-white"
          : "text-orange-800 hover:bg-orange-100 hover:text-orange-900"
      }`}
      onClick={onClick}
    >
      <Hash className="h-3.5 w-3.5 mr-2" />
      <span className="text-xs font-medium truncate">{name}</span>
      {unreadCount > 0 && (
        <Badge className="ml-auto h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-orange-500 text-white border-0">
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
      className={`flex items-center py-1.5 px-2 rounded-md mb-1 cursor-pointer ${
        isActive
          ? "bg-orange-600 text-white"
          : "text-orange-800 hover:bg-orange-100 hover:text-orange-900"
      }`}
      onClick={onClick}
    >
      <div className="relative mr-2">
        <Avatar className="h-7 w-7 border border-orange-100 shadow-sm">
          <AvatarFallback
            className={`${
              isActive
                ? "bg-orange-800 text-white"
                : "bg-orange-200 text-orange-800"
            } text-xs font-medium`}
          >
            {user.username?.substring(0, 2) || "U"}
          </AvatarFallback>
        </Avatar>
        {isOnline ? (
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border-[1.5px] border-white"></span>
        ) : (
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-gray-400 border-[1.5px] border-white"></span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium truncate">{user.username}</span>
          {unreadCount > 0 && (
            <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-orange-500 text-white border-0">
              {unreadCount}
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-orange-700 truncate">
          {isOnline ? "Online" : "Offline"}
        </p>
      </div>
    </div>
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

  // Scroll to bottom when new messages arrive - with optimized performance
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

  // Function to load older messages when user scrolls to the top of the chat
  // This implements the infinite scroll feature for loading message history
  const loadOlderMessages = useCallback(() => {
    if (!hasMore || isLoadingMore || !activeChat || !token) return;

    // Implementation directly here to avoid circular dependency with loadMessages
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

  // Primary function to load messages for a chat conversation
  // Uses pagination to load only the most recent messages first
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

        // In a real implementation, we would add pagination parameters to the API endpoint
        // For this mock, we'll simulate pagination client-side
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

          // Simulate pagination by only returning the most recent messages
          // This would normally be handled by the server
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

  // Scroll to bottom when messages change (new message received or sent)
  useEffect(() => {
    if (messages.length > 0) {
      // Use non-smooth scroll when loading a chat for the first time or older messages
      // Use smooth scroll when just receiving a new message
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
        const headerHeight = 66; // Height of the site header only (Discord doesn't use a top bar in chat)
        const viewportHeight = window.innerHeight;
        chatContainer.style.height = `${viewportHeight - headerHeight}px`;
      }

      if (messagesContainer) {
        // Set the messages container height by accounting for the chat input and header
        const chatHeaderHeight = 32; // Reduced from 40
        const chatInputHeight = 50; // Reduced estimate from 58
        const messagesContainerHeight =
          chatContainer.offsetHeight - chatHeaderHeight - chatInputHeight;
        messagesContainer.style.height = `${messagesContainerHeight}px`;
      }

      if (sidebarScrollArea) {
        // Handle the sidebar scroll area height - account for search input height
        const searchInputHeight = 40; // Reduced estimate from 48
        const sidebarAreaHeight =
          chatContainer.offsetHeight - searchInputHeight;
        sidebarScrollArea.style.height = `${sidebarAreaHeight}px`;
      }

      if (emptyStateContainer) {
        // Handle the empty state container height
        emptyStateContainer.style.height = `${chatContainer.offsetHeight}px`;
      }
    };

    window.addEventListener("resize", handleResize);
    // Initial calculation
    handleResize();

    // Re-run handleResize when activeChat changes
    if (activeChat) {
      // Adding a slight delay to ensure the DOM has updated
      setTimeout(handleResize, 100);
    }

    return () => window.removeEventListener("resize", handleResize);
  }, [activeChat]);

  // Get chat partners
  const { data: chatPartners = [], isLoading: isPartnersLoading } = useQuery({
    queryKey: ["/api/chat/partners"],
    queryFn: async () => {
      if (!token) return [];
      const response = await fetch(`/api/chat/partners`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch chat partners");
      const partners = await response.json();
      // Filter out the current user since users can't chat with themselves
      return partners.filter((partner) => partner.id !== user?.id);
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
    socket.addEventListener("open", () => {
      console.log("WebSocket Connected");
      // Authenticate with the server
      socket.send(
        JSON.stringify({
          type: "auth",
          token: token,
        })
      );
    });

    // Listen for messages
    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "auth_success") {
        setConnected(true);
        // If there's an active chat, load its messages
        if (activeChat) {
          loadMessages(activeChat.id);
        }
      } else if (data.type === "new_message") {
        // Handle incoming messages
        const newMessage = data.message;

        // Add to messages if it's part of the active chat
        if (
          activeChat &&
          (newMessage.senderId === activeChat.id ||
            newMessage.receiverId === activeChat.id)
        ) {
          setMessages((prev) => {
            const updatedMessages = [...prev, newMessage].sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
            return updatedMessages;
          });

          // Mark as read
          socket.send(
            JSON.stringify({
              type: "mark_read",
              senderId: activeChat.id,
            })
          );

          // Scroll to bottom after receiving a new message
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        } else {
          // Show notification for messages from other chats
          toast({
            title: `New message from ${newMessage.sender?.username || "User"}`,
            description:
              newMessage.content.length > 30
                ? `${newMessage.content.substring(0, 30)}...`
                : newMessage.content,
          });
        }
      } else if (data.type === "message_sent") {
        // Add message to chat
        setMessages((prev) => {
          const updatedMessages = [...prev, data.message].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );

          // Scroll to bottom after sending a message
          setTimeout(() => {
            scrollToBottom();
          }, 100);

          return updatedMessages;
        });
      } else if (data.type === "messages_read") {
        // Update read status of sent messages
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId === user.id && msg.receiverId === data.readBy
              ? { ...msg, isRead: true }
              : msg
          )
        );
      } else if (data.type === "error") {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    });

    // Handle errors and connection close
    socket.addEventListener("error", (error) => {
      console.error("WebSocket Error:", error);
      setConnected(false);
      toast({
        title: "Connection Error",
        description: "Unable to connect to chat server",
        variant: "destructive",
      });
    });

    socket.addEventListener("close", () => {
      console.log("WebSocket Disconnected");
      setConnected(false);
    });

    setWs(socket);

    // Clean up on unmount
    return () => {
      socket.close();
    };
  }, [user, token, activeChat, loadMessages, scrollToBottom, toast]);

  // Load messages when changing active chat
  useEffect(() => {
    if (activeChat && connected) {
      loadMessages(activeChat.id);
    }
  }, [activeChat, connected, loadMessages]);

  // Send message through WebSocket
  const sendMessage = () => {
    if (!input.trim() || !connected || !ws || !activeChat) return;

    ws.send(
      JSON.stringify({
        type: "chat_message",
        receiverId: activeChat.id,
        content: input.trim(),
      })
    );

    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-orange-50">
      {/* Top control bar */}
      <div className="h-10 border-b border-orange-200 flex items-center justify-between px-4 z-10 bg-orange-100 text-orange-800 shadow-sm">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-orange-700 hover:bg-orange-200 mr-2 h-7 w-7 rounded-md"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-sm font-medium text-orange-800">Messages</h1>
        </div>
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-orange-700 hover:bg-orange-200 h-7 w-7 rounded-md"
                >
                  <Bell className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-orange-700 hover:bg-orange-200 h-7 w-7 rounded-md"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden chat-container">
        {/* Sidebar */}
        <div
          className={`w-64 bg-orange-50 border-r border-orange-200 flex flex-col ${
            isMobileSidebarOpen ? "block" : "hidden"
          } lg:block overflow-hidden`}
          style={{ minWidth: "256px", maxWidth: "256px" }}
        >
          {/* Search */}
          <div className="p-2 border-b border-orange-200 bg-orange-100/50">
            {" "}
            {/* Reduced padding from p-3 */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-500" />{" "}
              {/* Adjusted icon position */}
              <Input
                placeholder="Find or start a conversation"
                className="pl-8 py-1.5 h-8 bg-white border-orange-200 text-sm rounded-md placeholder:text-orange-300 focus-visible:ring-orange-500" // Reduced height, padding
              />
            </div>
          </div>

          <ScrollArea className="flex-1 sidebar-scroll-area">
            <div className="p-3">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-semibold text-orange-700 uppercase tracking-wider">
                    Direct Messages
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-orange-500 hover:text-orange-700"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="h-px bg-orange-200 my-2"></div>

                {isPartnersLoading ? (
                  <div className="flex justify-center py-2">
                    <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full"></div>
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
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-semibold text-orange-700 uppercase tracking-wider">
                    Channels
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-orange-500 hover:text-orange-700"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="h-px bg-orange-200 my-2"></div>

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
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {activeChat ? (
            <>
              {/* Chat header */}
              <div className="h-8 border-b border-orange-200 flex items-center justify-between px-4 py-0 bg-orange-100">
                {" "}
                {/* Reduced height from h-9 */}
                <div className="flex items-center">
                  <div className="relative mr-2">
                    <User className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h2 className="text-sm font-medium text-orange-800">
                        {activeChat.username}
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-orange-600 hover:bg-orange-200 rounded-md p-1"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
                        <p>Voice call</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-orange-600 hover:bg-orange-200 rounded-md p-1"
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
                        <p>Video call</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-orange-600 hover:bg-orange-200 rounded-md p-1"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
                        <p>Info</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Messages area */}
              <ScrollArea
                ref={scrollAreaRef}
                className="flex-1 overflow-y-auto messages-container bg-white"
              >
                {isLoadingMore && page > 1 && (
                  <div className="flex justify-center py-2">
                    <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                  </div>
                )}

                {hasMore && !isLoadingMore && (
                  <div className="flex justify-center py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-orange-600 hover:bg-orange-100 hover:text-orange-700"
                      onClick={loadOlderMessages}
                    >
                      Load older messages
                    </Button>
                  </div>
                )}

                <div className="flex-1"></div>

                <div className="px-4 py-2 space-y-1">
                  {messages.length === 0 && !isLoadingMore ? (
                    <div className="flex justify-center py-4 text-orange-600">
                      No messages yet. Start a conversation!
                    </div>
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
              <div className="px-3 py-2 bg-orange-50 border-t border-orange-200">
                {" "}
                {/* Reduced padding from px-4 py-3 */}
                <div className="flex items-end bg-white rounded-lg px-2 py-1.5 border border-orange-200 shadow-sm">
                  {" "}
                  {/* Reduced padding from px-3 py-2 */}
                  <div className="flex space-x-1 mr-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-orange-500 hover:bg-orange-100 rounded-full p-0"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-orange-500 hover:bg-orange-100 rounded-full p-0"
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-orange-500 hover:bg-orange-100 rounded-full p-0"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${activeChat.username}`}
                    className="flex-1 border-0 bg-transparent text-gray-800 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-orange-300 text-sm"
                  />
                  <div className="flex space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-orange-500 hover:bg-orange-100 rounded-full p-0"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-orange-500 hover:bg-orange-100 rounded-full p-0"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || !connected}
                      className="bg-orange-600 hover:bg-orange-700 text-white rounded-md h-8 w-8 flex items-center justify-center p-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Empty state when no chat is selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center empty-state-container bg-white">
              <div className="max-w-md">
                <div className="mb-6 bg-orange-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="h-10 w-10 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold mb-2 text-orange-800">
                  Your Messages
                </h2>
                <p className="text-orange-600 mb-6 text-sm">
                  Send private messages to friends and colleagues. Select a
                  conversation or start a new one.
                </p>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Message
                </Button>
              </div>

              {!connected && (
                <div className="mt-8 p-4 bg-orange-100 text-orange-700 rounded-md flex items-center">
                  <WifiOff className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p className="text-sm">
                    Connection to chat server lost. Trying to reconnect...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
