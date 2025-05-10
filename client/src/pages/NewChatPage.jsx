import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
  memo,
  useMemo,
} from "react";
import { useLocation, useRoute } from "wouter";
import {
  Search,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  SendHorizontal,
  X,
  UserPlus,
  Users,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../contexts/AuthContext";
import { useSocketIO } from "../components/chat/SocketIOProvider";
import { getApiBaseUrl } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import GroupSidebar from "../components/chat/GroupSidebar";

const NewChatPage = () => {
  const [location, setLocation] = useLocation();
  const [matchUserChat, params] = useRoute("/chat/:userId");
  const [matchGroupChat, groupParams] = useRoute("/chat/group/:groupId");
  const { toast } = useToast();
  const { user } = useContext(AuthContext);
  const {
    connected,
    connectionState,
    reconnect,
    sendMessage,
    lastMessage,
    joinGroup,
    leaveGroup,
  } = useSocketIO();

  // If we have URL parameters, use them
  const chatUserId = matchUserChat ? params.userId : null;
  const chatGroupId = matchGroupChat ? groupParams.groupId : null;

  // State to track if we're in a chat or showing the chat list
  const [currentChat, setCurrentChat] = useState(null);
  const [currentGroupChat, setCurrentGroupChat] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMessage, setCurrentMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(true);
  const [followers, setFollowers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [recentChats, setRecentChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Log route matches and parameters for debugging
  console.log("URL matches user chat:", matchUserChat, params);
  console.log("URL matches group chat:", matchGroupChat, groupParams);
  console.log("WebSocket connection state:", connectionState);

  // Load chat data if userId or groupId is present
  useEffect(() => {
    if (chatUserId) {
      console.log(`Loading direct chat with user ID: ${chatUserId}`);
      setCurrentChat(chatUserId);
      fetchChatUser(chatUserId);
      fetchChatHistory(chatUserId);
    } else if (chatGroupId) {
      console.log(`Loading group chat with ID: ${chatGroupId}`);
      setCurrentGroupChat(chatGroupId);
      fetchGroupInfo(chatGroupId);
      fetchGroupChatHistory(chatGroupId);
    } else {
      setCurrentChat(null);
      setCurrentGroupChat(null);
      setChatUser(null);
      setGroupInfo(null);
      setChatMessages([]);
    }
  }, [chatUserId, chatGroupId]);

  // Debug the incoming chat data
  useEffect(() => {
    console.log("Current chat messages state:", chatMessages);
  }, [chatMessages]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    console.log("Received Socket.IO message:", lastMessage);

    // Handle new chat messages (direct or group)
    if (
      lastMessage.type === "chat_message" ||
      lastMessage.type === "group_message"
    ) {
      // For direct chat
      if (
        lastMessage.type === "chat_message" &&
        currentChat &&
        (lastMessage.senderId === parseInt(currentChat) ||
          lastMessage.receiverId === parseInt(currentChat))
      ) {
        // Check if we already have this message (to avoid duplicates)
        const isDuplicate = chatMessages.some(
          (msg) => msg.id === lastMessage.id || msg.id === lastMessage.tempId
        );

        if (!isDuplicate) {
          setChatMessages((prev) => [
            ...prev,
            {
              ...lastMessage,
              createdAt:
                lastMessage.timestamp ||
                lastMessage.createdAt ||
                new Date().toISOString(),
            },
          ]);
        } else {
          // Update status of existing message
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === lastMessage.tempId
                ? {
                    ...msg,
                    id: lastMessage.id,
                    status: lastMessage.status || "delivered",
                  }
                : msg
            )
          );
        }
      }

      // For group chat
      if (
        lastMessage.type === "group_message" &&
        currentGroupChat &&
        lastMessage.groupId === parseInt(currentGroupChat)
      ) {
        // Check if we already have this message
        const isDuplicate = chatMessages.some(
          (msg) => msg.id === lastMessage.id || msg.id === lastMessage.tempId
        );

        if (!isDuplicate) {
          setChatMessages((prev) => [
            ...prev,
            {
              ...lastMessage,
              createdAt:
                lastMessage.timestamp ||
                lastMessage.createdAt ||
                new Date().toISOString(),
            },
          ]);
        } else {
          // Update status of existing message
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === lastMessage.tempId
                ? {
                    ...msg,
                    id: lastMessage.id,
                    status: lastMessage.status || "delivered",
                  }
                : msg
            )
          );
        }
      }
    }
  }, [lastMessage, currentChat, currentGroupChat, chatMessages]);

  // Fetch user details for direct chat
  const fetchChatUser = async (userId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setChatUser(userData);
      } else {
        toast({
          title: "Error",
          description: "Could not load user information",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching chat user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch group info
  const fetchGroupInfo = async (groupId) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/chat/groups/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const groupData = await response.json();
        setGroupInfo(groupData);
      } else {
        toast({
          title: "Error",
          description: "Could not load group information",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching group info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch chat history for direct messages
  const fetchChatHistory = async (userId) => {
    setIsLoading(true);
    try {
      console.log(`Fetching chat history with user ID: ${userId}`);

      const response = await fetch(
        `${getApiBaseUrl()}/api/chat/history/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const history = await response.json();
        console.log(`Chat history loaded: ${history.length} messages`, history);
        setChatMessages(history);
      } else {
        const errorText = await response.text();
        console.error(
          `Failed to fetch chat history: ${response.status} ${errorText}`
        );
        toast({
          title: "Error loading chat history",
          description:
            "Could not load the conversation history. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      toast({
        title: "Connection Error",
        description:
          "Could not connect to the server. Please check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch group chat history
  const fetchGroupChatHistory = async (groupId) => {
    setIsLoading(true);
    try {
      // Only send Authorization header, do NOT send Content-Type for GET
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        // Do NOT add 'Content-Type' here! It breaks Neon/Postgres GET requests.
      };
      const response = await fetch(
        `${getApiBaseUrl()}/api/chat/groups/${groupId}/messages`,
        {
          headers,
        }
      );

      if (response.ok) {
        const history = await response.json();
        setChatMessages(history);
      } else {
        console.error("Failed to fetch group chat history");
      }
    } catch (error) {
      console.error("Error fetching group chat history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send a message
  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const tempId = Date.now().toString();

    // Create message object based on chat type
    const messageObj = currentChat
      ? {
          type: "chat_message",
          content: currentMessage,
          receiverId: parseInt(currentChat),
          tempId,
        }
      : {
          type: "group_message",
          content: currentMessage,
          groupId: parseInt(currentGroupChat),
          tempId,
        };

    // Add optimistic message to UI
    const optimisticMessage = {
      id: tempId,
      content: currentMessage,
      senderId: user?.id,
      createdAt: new Date().toISOString(),
      status: "sending",
      ...(currentChat
        ? { receiverId: parseInt(currentChat) }
        : { groupId: parseInt(currentGroupChat) }),
    };

    setChatMessages((prev) => [...prev, optimisticMessage]);
    setCurrentMessage("");

    // Send via Socket.IO
    sendMessage(messageObj);
  };

  // Handle message input key press (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Fetch user's followers
  useEffect(() => {
    const fetchFollowers = async () => {
      if (!user?.id) return;

      setIsLoadingFollowers(true);
      try {
        // Fetch users who follow you and you follow back (mutual follows)
        const response = await fetch(
          `${getApiBaseUrl()}/api/users/${user.id}/following`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const mutualFollows = data.filter(
            (follower) => follower.isFollowingBack
          );
          setFollowers(mutualFollows);
        } else {
          console.error("Failed to fetch followers:", await response.text());
        }
      } catch (error) {
        console.error("Error fetching followers:", error);
      } finally {
        setIsLoadingFollowers(false);
        setIsLoading(false);
      }
    };

    // Fetch group chats
    const fetchGroups = async () => {
      if (!user?.id) {
        console.error("Cannot fetch groups: No user ID available");
        setIsLoadingGroups(false);
        return;
      }

      setIsLoadingGroups(true);
      try {
        console.log("Fetching group chats...");
        const fullUrl = `${getApiBaseUrl()}/api/chat/groups/user`;
        console.log("Full request URL:", fullUrl);

        const response = await fetch(fullUrl, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        console.log("Group chats response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("Groups data received:", data);

          // Check if data is an array before setting state
          if (Array.isArray(data)) {
            setGroups(data);
          } else {
            console.error("Groups data is not an array:", data);
            setGroups([]);
            toast({
              title: "Error",
              description: "Invalid group data format received",
              variant: "destructive",
            });
          }
        } else {
          const errorText = await response.text();
          console.error(
            "Failed to fetch group conversations:",
            response.status,
            errorText
          );
          toast({
            title: "Error",
            description: "Failed to load group chats",
            variant: "destructive",
          });
          setGroups([]);
        }
      } catch (error) {
        console.error("Error fetching group conversations:", error);
        setGroups([]);
        toast({
          title: "Error",
          description: "Could not connect to group chat service",
          variant: "destructive",
        });
      } finally {
        setIsLoadingGroups(false);
      }
    };

    fetchFollowers();
    fetchGroups();
  }, [user?.id]);

  // Fetch recent chats
  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/chat/recent`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setRecentChats(data);
        } else {
          console.error("Failed to fetch recent chats:", await response.text());
        }
      } catch (error) {
        console.error("Error fetching recent chats:", error);
      }
    };

    fetchRecentChats();
  }, []);

  // Handle search
  useEffect(() => {
    // Debounce search to avoid too many requests
    const delaySearch = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/users/search?q=${encodeURIComponent(
          searchQuery
        )}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Check if users can chat (mutual follows)
        const resultsWithChatStatus = await Promise.all(
          data.map(async (result) => {
            try {
              const canChatResponse = await fetch(
                `${getApiBaseUrl()}/api/chat/can-chat/${result.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }
              );

              if (canChatResponse.ok) {
                const { canChat } = await canChatResponse.json();
                return { ...result, canChat };
              }

              return { ...result, canChat: false };
            } catch (error) {
              console.error(
                `Error checking chat status for user ${result.id}:`,
                error
              );
              return { ...result, canChat: false };
            }
          })
        );

        setSearchResults(resultsWithChatStatus);
      } else {
        console.error("Failed to search users:", await response.text());
        toast({
          title: "Search failed",
          description: "Could not search for users. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Start a chat with a user
  const startChat = (userId) => {
    setLocation(`/chat/${userId}`);
  };

  // Navigate to user profile
  const viewProfile = (userId) => {
    setLocation(`/users/${userId}`);
  };

  // Navigate to create group page
  const createGroup = () => {
    setLocation("/chat/create-group");
  };

  // Navigate to a group chat
  const openGroupChat = (groupId) => {
    console.log(`Opening group chat: ${groupId}`);
    if (!groupId) {
      console.error("Attempted to open group chat with null/undefined ID");
      toast({
        title: "Error",
        description: "Invalid group chat ID",
        variant: "destructive",
      });
      return;
    }

    // Ensure we're using the setLocation function for navigation
    setLocation(`/chat/group/${groupId}`);
  };

  const chatContainerRef = useRef(null);
  const lastMessageRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const isAtBottomRef = useRef(true); // Track if user was at bottom before update

  // Helper: check if user is at the bottom
  const checkIsAtBottom = () => {
    const container = chatContainerRef.current;
    if (!container) return true;
    // Allow a small threshold for floating point errors
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight < 40
    );
  };

  // On scroll, update isAtBottom
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const atBottom = checkIsAtBottom();
      setIsAtBottom(atBottom);
      isAtBottomRef.current = atBottom; // <-- update the ref
      setShowScrollToBottom(!atBottom);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [chatContainerRef]);

  // Scroll to bottom only if user was at bottom before the new message
  useEffect(() => {
    if (!chatContainerRef.current) return;
    if (isAtBottomRef.current) {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      } else {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    }
    // Do NOT scroll if user was not at bottom
    // eslint-disable-next-line
  }, [chatMessages, currentChat, currentGroupChat]);

  // Handler for scroll-to-bottom button
  const handleScrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    } else if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  // Add after useSocketIO and state declarations
  const prevGroupChatRef = useRef(null);

  // Join/leave group chat room via Socket.IO
  useEffect(() => {
    if (currentGroupChat && connectionState === "connected") {
      console.log("Calling joinGroup for group", currentGroupChat);
      joinGroup(parseInt(currentGroupChat));
    }
    if (
      prevGroupChatRef.current &&
      prevGroupChatRef.current !== currentGroupChat &&
      connectionState === "connected"
    ) {
      leaveGroup(parseInt(prevGroupChatRef.current));
    }
    prevGroupChatRef.current = currentGroupChat;

    return () => {
      if (currentGroupChat && connectionState === "connected") {
        leaveGroup(parseInt(currentGroupChat));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupChat, connectionState, joinGroup, leaveGroup]);

  const apiBaseUrl = getApiBaseUrl();

  // Helper: assign a unique color to each user (except current user)
  const userColors = [
    "#FFB347", // orange 1
    "#FF7F50", // orange 2
    "#FFA500", // orange 3
    "#FF8C00", // orange 4
    "#FF7043", // orange 5
    "#FF9800", // orange 6
    "#FF5722", // orange 7
  ];
  function getUserColor(userId, currentUserId) {
    if (userId === currentUserId) return "#FF6F00"; // main orange for self
    // Hash userId to pick a color
    const idx = Math.abs(userId) % userColors.length;
    return userColors[idx];
  }

  // Memoize sidebar props to prevent unnecessary re-renders
  const sidebarGroupInfo = useMemo(() => groupInfo, [groupInfo]);
  const sidebarMembers = useMemo(() => groupInfo?.members || [], [groupInfo]);
  // Stable sidebar close handler
  const handleSidebarClose = useCallback(() => setSidebarOpen(false), []);

  if (currentGroupChat && groupInfo) {
    console.log("[DEBUG] Rendering desktop sidebar", {
      groupInfo,
      members: groupInfo?.members,
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 animate-fadein">
      {/* Header */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-md p-4 flex items-center justify-between sticky top-0 z-10 rounded-b-xl"
      >
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/chat")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5 text-orange-600" />
          </Button>
          <h1 className="text-xl font-bold text-orange-800">
            {currentChat
              ? chatUser
                ? chatUser.displayName || chatUser.username
                : "Direct Message"
              : currentGroupChat
              ? groupInfo
                ? groupInfo.name
                : "Group Chat"
              : "New Conversation"}
          </h1>
        </div>
        {!currentChat && !currentGroupChat && (
          <Button
            onClick={createGroup}
            className="bg-orange-100 hover:bg-orange-200 text-orange-800"
          >
            <Users className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        )}
        {(connectionState === "disconnected" ||
          connectionState === "failed") && (
          <Button
            onClick={reconnect}
            className="bg-orange-100 hover:bg-orange-200 text-orange-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reconnect
          </Button>
        )}
      </motion.div>

      {/* Main flex row for chat and sidebar */}
      {currentChat || currentGroupChat ? (
        <div className="flex w-full h-[calc(100vh-80px)]">
          {/* Chat area */}
          <div className="flex flex-col flex-grow h-full bg-gradient-to-b from-orange-50 to-white relative rounded-2xl shadow-lg m-4">
            {/* Connection state indicator */}
            {connectionState !== "connected" && (
              <div
                className={`mb-4 p-3 rounded-lg text-center mx-6 mt-4 ${
                  connectionState === "connecting" ||
                  connectionState === "reconnecting"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {connectionState === "connecting" &&
                  "Connecting to chat server..."}
                {connectionState === "reconnecting" &&
                  "Reconnecting to chat server..."}
                {(connectionState === "disconnected" ||
                  connectionState === "failed") && (
                  <div className="flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>
                      Could not connect to chat. Please refresh the page or try
                      again.
                    </span>
                  </div>
                )}
              </div>
            )}
            {/* Chat messages area */}
            <div
              ref={chatContainerRef}
              className="flex-grow p-6 overflow-y-auto custom-scrollbar transition-colors duration-300 relative"
            >
              {/* Scroll to bottom button */}
              {showScrollToBottom && (
                <button
                  onClick={handleScrollToBottom}
                  className="fixed bottom-28 right-8 z-20 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg p-2 transition-all animate-bounce"
                  title="Scroll to latest message"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              )}
              {chatMessages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="h-full flex flex-col items-center justify-center text-orange-600"
                >
                  <MessageSquare className="h-12 w-12 mb-4 text-orange-400 animate-bounce" />
                  <p className="text-lg font-medium">No messages yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Send a message to start the conversation
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {chatMessages.map((message, idx) => {
                    const isCurrentUser = message.senderId === user?.id;
                    const isFirstOfGroup =
                      idx === 0 ||
                      chatMessages[idx - 1].senderId !== message.senderId;
                    const isLast = idx === chatMessages.length - 1;
                    const userColor = getUserColor(message.senderId, user?.id);
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.02 }}
                        className={`flex ${
                          isCurrentUser ? "justify-end" : "justify-start"
                        }`}
                        ref={isLast ? lastMessageRef : null}
                      >
                        {/* Avatar and name for others, only at start of group */}
                        {!isCurrentUser && isFirstOfGroup && (
                          <div className="flex flex-col items-center mr-2">
                            <Avatar className="h-8 w-8 mb-1">
                              <AvatarFallback
                                style={{ background: userColor, color: "#fff" }}
                              >
                                {groupInfo?.members
                                  ?.find((m) => m.id === message.senderId)
                                  ?.displayName?.[0]?.toUpperCase() ||
                                  groupInfo?.members
                                    ?.find((m) => m.id === message.senderId)
                                    ?.username?.[0]?.toUpperCase() ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-orange-600 font-semibold">
                              {groupInfo?.members?.find(
                                (m) => m.id === message.senderId
                              )?.displayName ||
                                groupInfo?.members?.find(
                                  (m) => m.id === message.senderId
                                )?.username ||
                                "User"}
                            </span>
                          </div>
                        )}
                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          className={`max-w-[65%] rounded-2xl p-3 shadow-md transition-all duration-200 border animate-popin
                            ${
                              isCurrentUser
                                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-200"
                                : "bg-white text-gray-800 border-orange-100"
                            }
                          `}
                          style={
                            !isCurrentUser
                              ? { borderLeft: `4px solid ${userColor}` }
                              : {}
                          }
                        >
                          <p className="whitespace-pre-wrap break-words text-base leading-relaxed">
                            {message.content}
                          </p>
                          <div
                            className={`text-xs mt-1 flex items-center gap-2 ${
                              isCurrentUser
                                ? "text-orange-100"
                                : "text-gray-400"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                            {isCurrentUser && message.status && (
                              <motion.span
                                key={message.status}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className="inline-flex items-center gap-1"
                              >
                                {message.status === "sending" && (
                                  <>
                                    <svg
                                      className="animate-spin h-3 w-3 text-orange-200"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                      />
                                    </svg>
                                    Sending...
                                  </>
                                )}
                                {message.status === "delivered" && (
                                  <>
                                    <svg
                                      className="h-3 w-3 text-green-200"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                    Delivered
                                  </>
                                )}
                                {message.status === "read" && (
                                  <>
                                    <svg
                                      className="h-3 w-3 text-blue-200"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                    Read
                                  </>
                                )}
                                {message.status === "failed" && (
                                  <span className="text-red-200">
                                    • Failed to send
                                  </span>
                                )}
                              </motion.span>
                            )}
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Chat input area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-orange-100 p-4 bg-white rounded-b-2xl"
            >
              <div className="flex gap-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message..."
                  className="border-orange-200 focus:border-orange-500 focus:ring-orange-500 shadow-sm"
                  disabled={connectionState !== "connected"}
                />
                <Button
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg"
                  onClick={handleSendMessage}
                  disabled={
                    connectionState !== "connected" || !currentMessage.trim()
                  }
                >
                  <SendHorizontal className="h-4 w-4" />
                </Button>
              </div>
              {connectionState !== "connected" && (
                <p className="text-sm text-orange-600 mt-2">
                  Connect to the chat server to send messages
                </p>
              )}
            </motion.div>
          </div>
          {/* Sidebar as sibling, not child */}
          {currentGroupChat && (
            <>
              {/* Desktop sidebar */}
              <div className="hidden md:flex flex-col h-full w-72 shadow-xl rounded-r-2xl m-4 ml-0">
                <GroupSidebar
                  groupInfo={sidebarGroupInfo}
                  members={sidebarMembers}
                  open={true}
                  onClose={handleSidebarClose}
                />
              </div>
              {/* Mobile sidebar overlay (remains overlay for mobile) */}
              <GroupSidebar
                groupInfo={sidebarGroupInfo}
                members={sidebarMembers}
                open={sidebarOpen}
                onClose={handleSidebarClose}
              />
            </>
          )}
        </div>
      ) : (
        // Chat list view
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl mx-auto p-4"
        >
          {/* Search */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for users to chat with..."
                className="pl-10 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
              />
              <Search className="absolute left-3 top-3 h-5 w-5 text-orange-400" />
              {isSearching && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchQuery && searchResults.length > 0 && (
            <div className="bg-white rounded-lg shadow-md mb-6">
              <h2 className="text-lg font-medium text-gray-800 p-4 border-b border-orange-100">
                Search Results
              </h2>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="divide-y divide-orange-100"
              >
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-4 flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className="bg-orange-500 text-white">
                          {result.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-800">
                          {result.displayName || result.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{result.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewProfile(result.id)}
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                      {result.canChat ? (
                        <Button
                          size="sm"
                          onClick={() => startChat(result.id)}
                          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled
                          className="bg-gray-100 text-gray-500 cursor-not-allowed"
                          title="You can only chat with mutual followers"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Cannot Chat
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
              <p className="text-orange-600 mb-2">
                No users found matching "{searchQuery}"
              </p>
              <p className="text-sm text-gray-600">
                Try a different search term or check the followers list below
              </p>
            </div>
          )}

          {/* Recent Chats */}
          {recentChats.length > 0 && !searchQuery && (
            <div className="bg-white rounded-lg shadow-md mb-6">
              <h2 className="text-lg font-medium text-gray-800 p-4 border-b border-orange-100">
                Recent Conversations
              </h2>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="divide-y divide-orange-100"
              >
                {recentChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="p-4 flex items-center hover:bg-orange-50 cursor-pointer"
                    onClick={() => startChat(chat.id)}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback className="bg-orange-500 text-white">
                        {chat.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-800">
                        {chat.displayName || chat.username}
                      </p>
                      <p className="text-sm text-gray-500 truncate max-w-md">
                        {chat.lastMessage || "Start a conversation"}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Followers */}
          <div className="bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-medium text-gray-800 p-4 border-b border-orange-100">
              Chat with Followers
              <span className="text-sm font-normal text-gray-500 ml-2">
                (you can chat with mutual followers)
              </span>
            </h2>

            {isLoadingFollowers ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
              </div>
            ) : followers.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-orange-600 mb-2">
                  No mutual followers found
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  You need to follow users who follow you back to start a chat
                </p>
                <Button
                  onClick={() => setLocation("/users")}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Find People to Follow
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="divide-y divide-orange-100"
              >
                {followers.map((follower) => (
                  <div
                    key={follower.id}
                    className="p-4 flex justify-between items-center hover:bg-orange-50"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className="bg-orange-500 text-white">
                          {follower.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-800">
                          {follower.displayName || follower.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{follower.username}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => startChat(follower.id)}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Group Chats Section */}
          <div className="bg-white rounded-lg shadow-md mt-6">
            <h2 className="text-lg font-medium text-gray-800 p-4 border-b border-orange-100 flex justify-between items-center">
              <span>Group Chats</span>
              <Button
                onClick={() => setLocation("/chat/create-group")}
                className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-1 h-8"
                size="sm"
              >
                <Users className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </h2>

            {/* Load group chats here */}
            <div>
              {/* Fetch and display group chats */}
              {isLoadingGroups ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="divide-y divide-orange-100"
                >
                  {groups && groups.length > 0 ? (
                    groups.map((group) => (
                      <div
                        key={group.id}
                        className="p-4 flex justify-between items-center hover:bg-orange-50 cursor-pointer"
                        onClick={() => openGroupChat(group.id)}
                      >
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3 bg-orange-600">
                            <AvatarFallback className="bg-orange-600 text-white">
                              {group.name?.substring(0, 2)?.toUpperCase() ||
                                "GC"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-800">
                              {group.name || "Unnamed Group"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {group.memberCount
                                ? `${group.memberCount} members`
                                : "Group chat"}
                              {group.isAdmin && (
                                <span className="ml-2 text-orange-600 text-xs">
                                  (Admin)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Open
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 px-4">
                      <p className="text-orange-600 mb-2">No group chats yet</p>
                      <p className="text-sm text-gray-600 mb-4">
                        Create a group chat to start messaging with multiple
                        people
                      </p>
                      <Button
                        onClick={() => setLocation("/chat/create-group")}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Create Group Chat
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NewChatPage;
