import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
  memo,
  useMemo,
} from "react";
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
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import CreateGroupPage from "./CreateGroupPage";

const NewChatPage = () => {
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
  const [showChatTypeModal, setShowChatTypeModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState("recent");
  const [activeChat, setActiveChat] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // Log route matches and parameters for debugging
  console.log("WebSocket connection state:", connectionState);

  // Load chat data if userId or groupId is present
  useEffect(() => {
    if (activeChat) {
      if (activeChat.type === "user") {
        setCurrentChat(activeChat.id);
        setCurrentGroupChat(null);
        fetchChatUser(activeChat.id);
        fetchChatHistory(activeChat.id);
      } else if (activeChat.type === "group") {
        setCurrentGroupChat(activeChat.id);
        setCurrentChat(null);
        fetchGroupInfo(activeChat.id);
        fetchGroupChatHistory(activeChat.id);
      }
    } else {
      setCurrentChat(null);
      setCurrentGroupChat(null);
      setChatUser(null);
      setGroupInfo(null);
      setChatMessages([]);
    }
  }, [activeChat]);

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
    <div className="h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-white shadow-md border-r border-gray-100 flex-shrink-0 flex flex-col h-full">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold text-gray-900">Chats</span>
        </div>
        {/* Tabs */}
        <nav className="flex md:flex-col flex-row md:gap-2 gap-2 md:mt-8 mt-2 px-2 md:px-4">
          {[
            { key: "recent", label: "Recent", icon: MessageSquare },
            { key: "followers", label: "Followers", icon: UserPlus },
            { key: "groups", label: "Groups", icon: Users },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-base transition-all duration-200 mb-0 font-medium
                ${
                  selectedTab === tab.key
                    ? "bg-blue-100 text-blue-700 font-bold shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              onClick={() => setSelectedTab(tab.key)}
            >
              <tab.icon
                className={`h-5 w-5 ${
                  selectedTab === tab.key ? "text-blue-600" : "text-gray-400"
                } transition-colors`}
              />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="border-b border-gray-100 my-4 mx-2 md:mx-4" />
        {/* Sidebar List for selected tab */}
        <div className="flex-1 overflow-y-auto px-2 md:px-4 pb-4 max-h-[calc(100vh-160px)]">
          {selectedTab === "recent" &&
            (recentChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-10 w-10 text-blue-200 mb-2" />
                <p className="font-medium text-gray-400 mb-2">
                  No recent conversations
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {recentChats.map((chat, idx) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition cursor-pointer group mb-1
                      ${
                        activeChat &&
                        activeChat.type === "user" &&
                        activeChat.id === chat.id
                          ? "bg-blue-100 font-bold text-blue-700 border-l-4 border-blue-500"
                          : "hover:bg-blue-50/80"
                      }`}
                    onClick={() => setActiveChat({ type: "user", id: chat.id })}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-200 text-gray-700">
                        {chat.username?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {chat.displayName || chat.username}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {chat.lastMessage || "Start a conversation"}
                      </div>
                    </div>
                    {chat.lastMessageTime && (
                      <div className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                        {chat.lastMessageTime}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            ))}
          {selectedTab === "followers" &&
            (isLoadingFollowers ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : followers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <UserPlus className="h-10 w-10 text-blue-200 mb-2" />
                <p className="font-medium text-gray-400 mb-2">
                  No mutual followers
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {followers.map((follower, idx) => (
                  <motion.div
                    key={follower.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition cursor-pointer group mb-1
                      ${
                        activeChat &&
                        activeChat.type === "user" &&
                        activeChat.id === follower.id
                          ? "bg-blue-100 font-bold text-blue-700 border-l-4 border-blue-500"
                          : "hover:bg-blue-50/80"
                      }`}
                    onClick={() =>
                      setActiveChat({ type: "user", id: follower.id })
                    }
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-200 text-gray-700">
                        {follower.username?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {follower.displayName || follower.username}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        @{follower.username}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ))}
          {selectedTab === "groups" && (
            <div className="mb-4 flex justify-center">
              <Button
                variant="outline"
                className="w-full flex items-center gap-2 justify-center text-blue-700 border-blue-200 hover:bg-blue-50"
                onClick={() => setShowCreateGroup(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Group
              </Button>
            </div>
          )}
          {selectedTab === "groups" &&
            (isLoadingGroups ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="h-10 w-10 text-blue-200 mb-2" />
                <p className="font-medium text-gray-400 mb-2">No group chats</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {groups.map((group, idx) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition cursor-pointer group mb-1
                      ${
                        activeChat &&
                        activeChat.type === "group" &&
                        activeChat.id === group.id
                          ? "bg-blue-100 font-bold text-blue-700 border-l-4 border-blue-500"
                          : "hover:bg-blue-50/80"
                      }`}
                    onClick={() =>
                      setActiveChat({ type: "group", id: group.id })
                    }
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-200 text-gray-700">
                        {group.name?.substring(0, 2)?.toUpperCase() || "GC"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {group.name || "Unnamed Group"}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {group.memberCount
                          ? `${group.memberCount} members`
                          : "Group chat"}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ))}
        </div>
      </aside>

      {/* Main Content: Chat area for activeChat */}
      <main className="flex-1 flex flex-col h-full items-stretch">
        {showCreateGroup ? (
          <CreateGroupPage onClose={() => setShowCreateGroup(false)} />
        ) : activeChat ? (
          <div className="flex flex-col h-full min-h-0">
            {/* Chat Header */}
            <div className="flex items-center gap-4 px-6 py-4 bg-white rounded-xl shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveChat(null)}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5 text-blue-600" />
              </Button>
              {activeChat.type === "user" && chatUser && (
                <>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-200 text-blue-700">
                      {chatUser.displayName?.[0]?.toUpperCase() ||
                        chatUser.username?.[0]?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {chatUser.displayName || chatUser.username}
                    </div>
                    <div className="text-xs text-gray-500">
                      @{chatUser.username}
                    </div>
                  </div>
                </>
              )}
              {activeChat.type === "group" && groupInfo && (
                <>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-200 text-blue-700">
                      {groupInfo.name?.[0]?.toUpperCase() || "G"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {groupInfo.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {groupInfo.memberCount} members
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* Chat Messages and Input (fixed height, scrollable messages) */}
            <div className="flex flex-col flex-1 min-h-0">
              <div
                ref={chatContainerRef}
                className="flex-1 min-h-0 overflow-y-auto p-6 custom-scrollbar transition-colors duration-300 relative bg-transparent"
              >
                {chatMessages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="h-full flex flex-col items-center justify-center text-blue-600"
                  >
                    <MessageSquare className="h-12 w-12 mb-4 text-blue-400 animate-bounce" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Send a message to start the conversation
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {chatMessages.map((message, idx) => {
                        const isCurrentUser = message.senderId === user?.id;
                        const isFirstOfGroup =
                          idx === 0 ||
                          chatMessages[idx - 1].senderId !== message.senderId;
                        const isLast = idx === chatMessages.length - 1;
                        const userColor = getUserColor(
                          message.senderId,
                          user?.id
                        );
                        // For sent messages, use your avatar/name
                        const myAvatar = user?.avatarUrl || undefined;
                        const myName =
                          user?.displayName || user?.username || "Me";
                        // For received, get sender info from groupInfo if available
                        const sender = groupInfo?.members?.find(
                          (m) => m.id === message.senderId
                        );
                        return (
                          <motion.div
                            key={message.id}
                            initial={{
                              opacity: 0,
                              x: isCurrentUser ? 40 : -40,
                            }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: isCurrentUser ? 40 : -40 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                              delay: idx * 0.02,
                            }}
                            className={`flex w-full mb-4 ${
                              isCurrentUser ? "justify-end" : "justify-start"
                            }`}
                            ref={isLast ? lastMessageRef : null}
                          >
                            {/* Received: avatar/name left, bubble right */}
                            {!isCurrentUser && (
                              <>
                                {isFirstOfGroup && (
                                  <div className="flex flex-col items-center mr-2">
                                    <Avatar className="h-8 w-8 mb-1">
                                      <AvatarFallback
                                        style={{
                                          background: userColor,
                                          color: "#fff",
                                        }}
                                      >
                                        {sender?.displayName?.[0]?.toUpperCase() ||
                                          sender?.username?.[0]?.toUpperCase() ||
                                          "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-gray-500 font-semibold">
                                      {sender?.displayName ||
                                        sender?.username ||
                                        "User"}
                                    </span>
                                  </div>
                                )}
                                <motion.div
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  className="rounded-2xl px-4 py-2 bg-gray-100 text-gray-900 max-w-[65%] min-w-[60px]"
                                >
                                  <p className="whitespace-pre-wrap break-words text-base leading-relaxed font-normal">
                                    {message.content}
                                  </p>
                                  <div className="text-xs text-gray-400 mt-1 text-left">
                                    {new Date(
                                      message.createdAt
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </motion.div>
                              </>
                            )}
                            {/* Sent: bubble left, avatar/name right */}
                            {isCurrentUser && (
                              <>
                                <motion.div
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  className="rounded-2xl px-4 py-2 bg-blue-100 text-blue-900 max-w-[65%] min-w-[60px] text-right"
                                >
                                  <p className="whitespace-pre-wrap break-words text-base leading-relaxed font-medium">
                                    {message.content}
                                  </p>
                                  <div className="text-xs text-blue-400 mt-1 text-right">
                                    {new Date(
                                      message.createdAt
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                    {message.status && (
                                      <span className="ml-2">
                                        {message.status === "sending" && "..."}
                                        {message.status === "delivered" && "✓"}
                                        {message.status === "read" && "✓✓"}
                                        {message.status === "failed" && (
                                          <span className="text-red-400">
                                            • Failed
                                          </span>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </motion.div>
                                <div className="flex flex-col items-center ml-2">
                                  <Avatar className="h-8 w-8 mb-1">
                                    {myAvatar ? (
                                      <img
                                        src={myAvatar}
                                        alt={myName}
                                        className="rounded-full"
                                      />
                                    ) : (
                                      <AvatarFallback
                                        style={{
                                          background: "#2563eb",
                                          color: "#fff",
                                        }}
                                      >
                                        {myName[0]?.toUpperCase() || "M"}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <span className="text-xs text-blue-700 font-semibold">
                                    {myName}
                                  </span>
                                </div>
                              </>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-blue-100 p-4 bg-white rounded-b-2xl shadow-md mb-16"
              >
                <div className="flex gap-2">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                    disabled={connectionState !== "connected"}
                  />
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                    onClick={handleSendMessage}
                    disabled={
                      connectionState !== "connected" || !currentMessage.trim()
                    }
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                {connectionState !== "connected" && (
                  <p className="text-sm text-blue-600 mt-2">
                    Connect to the chat server to send messages
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="h-16 w-16 mb-4" />
            <div className="text-lg font-medium">
              Select a chat to start messaging
            </div>
          </div>
        )}
      </main>

      <Dialog open={showChatTypeModal} onOpenChange={setShowChatTypeModal}>
        <DialogOverlay className="fixed inset-0 bg-black/40 z-50" />
        <DialogContent className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6">
          <div className="flex items-center justify-between w-full mb-2">
            <h2 className="text-2xl font-bold text-blue-800">
              Create a New Group
            </h2>
            <button
              className="rounded-full p-1 hover:bg-blue-50 text-blue-500"
              onClick={() => setShowChatTypeModal(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 mb-4 text-center">
            Start a new group chat with your friends or classmates.
          </p>
          <button
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-semibold shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all"
            onClick={() => {
              setShowChatTypeModal(false);
              window.location.href = "/chat/create-group";
            }}
          >
            <Users className="h-6 w-6" /> Go to Group Creation
          </button>
          <button
            className="mt-4 text-blue-500 hover:text-blue-700 text-sm underline"
            onClick={() => setShowChatTypeModal(false)}
          >
            Cancel
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewChatPage;
