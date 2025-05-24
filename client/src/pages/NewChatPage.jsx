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
import { useLanguage } from "../contexts/LanguageContext";
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
  const { t } = useLanguage();
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
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);

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
          title: t('error'),
          description: t('couldNotLoadUserInfo'),
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
          title: t('error'),
          description: t('couldNotLoadGroupInfo'),
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
          title: t('errorLoadingChatHistory'),
          description: t('couldNotLoadConversationHistory'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      toast({
        title: t('connectionError'),
        description: t('couldNotConnectToServer'),
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
              title: t('error'),
              description: t('invalidGroupDataFormat'),
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
            title: t('error'),
            description: t('failedToLoadGroupChats'),
            variant: "destructive",
          });
          setGroups([]);
        }
      } catch (error) {
        console.error("Error fetching group conversations:", error);
        setGroups([]);
        toast({
          title: t('error'),
          description: t('couldNotConnectToGroupChatService'),
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
          title: t('searchFailed'),
          description: t('couldNotSearchUsers'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: t('error'),
        description: t('anErrorOccurredWhileSearching'),
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

  // Designer-picked gradients for avatars
  const designerGradients = [
    "bg-gradient-to-br from-pink-400 via-orange-300 to-yellow-400",
    "bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400",
    "bg-gradient-to-br from-green-400 via-teal-300 to-blue-400",
    "bg-gradient-to-br from-yellow-400 via-pink-400 to-red-400",
    "bg-gradient-to-br from-indigo-400 via-blue-300 to-green-300",
    "bg-gradient-to-br from-fuchsia-400 via-purple-400 to-blue-400",
    "bg-gradient-to-br from-orange-400 via-yellow-300 to-pink-400",
  ];
  function getDesignerGradient(idx) {
    return designerGradients[idx % designerGradients.length];
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

  // Restore getUserColor for chat message bubbles
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
    if (userId === currentUserId) return "#2563eb"; // blue for self
    const idx = Math.abs(userId) % userColors.length;
    return userColors[idx];
  }

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-white/70 backdrop-blur-lg shadow-2xl rounded-r-3xl flex-shrink-0 flex flex-col h-full border-r border-blue-100 relative overflow-hidden">
        {/* Floating, glassy header */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-200/50 px-6 py-6 flex flex-col gap-4 rounded-tr-3xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {t('messages')}
              </h1>
              <p className="text-sm text-gray-500">{t('connectWithYourNetwork')}</p>
            </div>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t('searchChats')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-full shadow-sm"
            />
          </div>
        </div>

        {/* Floating pill tabs */}
        <nav className="flex md:flex-col flex-row md:gap-4 gap-2 md:mt-4 mt-2 px-2 md:px-8 justify-center">
          {[
            { key: "followers", label: t('followers'), icon: UserPlus },
            { key: "groups", label: t('groups'), icon: Users },
          ].map((tab, idx) => (
            <motion.button
              key={tab.key}
              className={`flex items-center gap-2 px-8 py-2 rounded-full text-lg font-semibold shadow-md transition-all duration-200
                ${
                  selectedTab === tab.key
                    ? "bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 text-blue-800 shadow-xl scale-105 border-2 border-blue-400"
                    : "bg-white/60 text-gray-500 hover:bg-blue-50/80 hover:scale-105"
                }`}
              onClick={() => setSelectedTab(tab.key)}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              style={{ marginBottom: 8 }}
            >
              <tab.icon
                className={`h-6 w-6 ${
                  selectedTab === tab.key ? "text-blue-600" : "text-gray-400"
                } transition-colors`}
              />
              {tab.label}
            </motion.button>
          ))}
        </nav>

        <div className="border-b border-blue-100 my-4 mx-2 md:mx-8" />

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2 md:px-8 pb-8 max-h-[calc(100vh-180px)]">
          {selectedTab === "followers" && (
            <>
              {isLoadingFollowers ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : followers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <UserPlus className="h-14 w-14 text-blue-200 mb-3" />
                  <p className="font-semibold text-gray-400 mb-2 text-lg">
                    {t('noMutualFollowers')}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {t('inviteFriendsToConnect')}
                  </p>
                </div>
              ) : (
                followers.map((follower) => (
                  <div
                    key={follower.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition cursor-pointer group mb-2 border border-blue-100 bg-white/80
                      ${
                        activeChat &&
                        activeChat.type === "user" &&
                        activeChat.id === follower.id
                          ? "bg-blue-50 border-blue-300 scale-100 shadow-md"
                          : "hover:bg-blue-50 hover:shadow-sm"
                      }`}
                    onClick={() => setActiveChat({ type: "user", id: follower.id })}
                  >
                    <Avatar className="h-10 w-10 shadow-sm border border-blue-100 bg-gradient-to-br from-blue-100 to-blue-200">
                      <AvatarFallback className="text-blue-700 font-bold text-sm">
                        {follower.username?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm text-blue-900">
                        {follower.displayName || follower.username}
                      </div>
                      <div className="text-xs text-gray-500 truncate font-normal">
                        @{follower.username}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {selectedTab === "groups" && (
            <>
              {groups.length > 0 && (
                <div className="mb-6 flex justify-center">
                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-2 justify-center text-blue-700 border-blue-200 hover:bg-blue-50 rounded-full py-3 text-lg font-semibold shadow-md"
                    onClick={() => setShowCreateGroup(true)}
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    {t('createNewGroup')}
                  </Button>
                </div>
              )}
              {isLoadingGroups ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Users className="h-14 w-14 text-blue-200 mb-3" />
                  <p className="font-semibold text-gray-400 mb-2 text-lg">
                    {t('noGroupChats')}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {t('createGroupToGetStarted')}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 flex items-center gap-2 text-blue-700 border-blue-200 hover:bg-blue-50 rounded-full px-6 py-2 text-sm font-semibold shadow-sm"
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
                    {t('createYourFirstGroup')}
                  </Button>
                </div>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition cursor-pointer group mb-2 border border-blue-100 bg-white/80
                      ${
                        activeChat &&
                        activeChat.type === "group" &&
                        activeChat.id === group.id
                          ? "bg-blue-50 border-blue-300 scale-100 shadow-md"
                          : "hover:bg-blue-50 hover:shadow-sm"
                      }`}
                    onClick={() => setActiveChat({ type: "group", id: group.id })}
                  >
                    <Avatar className="h-10 w-10 shadow-sm border border-blue-100 bg-gradient-to-br from-blue-100 to-blue-200">
                      <AvatarFallback className="text-blue-700 font-bold text-sm">
                        {group.name?.substring(0, 2)?.toUpperCase() || "GC"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm text-blue-900">
                        {group.name || t('unnamedGroup')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {group.memberCount} {t('members')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
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
                      {groupInfo.memberCount} {t('members')}
                    </div>
                  </div>
                  {activeChat?.type === "group" &&
                    groupInfo?.creator?.id === user?.id && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="ml-auto"
                        disabled={deletingGroup}
                        onClick={async () => {
                          if (
                            !window.confirm(
                              t('confirmDeleteGroup')
                            )
                          )
                            return;
                          setDeletingGroup(true);
                          try {
                            const res = await fetch(
                              `/api/chat/groups/${activeChat.id}`,
                              {
                                method: "DELETE",
                                headers: {
                                  Authorization: `Bearer ${localStorage.getItem(
                                    "token"
                                  )}`,
                                },
                              }
                            );
                            if (res.status === 204) {
                              toast({
                                title: t('groupDeleted'),
                                description: t('groupDeletedDescription'),
                              });
                              setActiveChat(null);
                              // Optionally refresh group list here
                            } else {
                              const data = await res.json();
                              toast({
                                title: t('failedToDeleteGroup'),
                                description: data.error || t('unknownError'),
                                variant: "destructive",
                              });
                            }
                          } catch (e) {
                            toast({
                              title: t('error'),
                              description: e.message,
                              variant: "destructive",
                            });
                          } finally {
                            setDeletingGroup(false);
                          }
                        }}
                      >
                        {deletingGroup ? t('deleting') : t('deleteGroup')}
                      </Button>
                    )}
                  {activeChat?.type === "group" &&
                    groupInfo?.creator?.id === user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => setShowMembersModal(true)}
                      >
                        {t('groupMembers')}
                      </Button>
                    )}
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
                    <p className="text-lg font-medium">{t('noMessagesYet')}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {t('sendMessageToStart')}
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
                    placeholder={t('typeYourMessage')}
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
                    {t('connectToChatServer')}
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="h-16 w-16 mb-4" />
            <div className="text-lg font-medium">
              {t('selectChatToStartMessaging')}
            </div>
          </div>
        )}
      </main>

      <Dialog open={showChatTypeModal} onOpenChange={setShowChatTypeModal}>
        <DialogOverlay className="fixed inset-0 bg-black/40 z-50" />
        <DialogContent className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6">
          <div className="flex items-center justify-between w-full mb-2">
            <h2 className="text-2xl font-bold text-blue-800">
              {t('createNewGroup')}
            </h2>
            <button
              className="rounded-full p-1 hover:bg-blue-50 text-blue-500"
              onClick={() => setShowChatTypeModal(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 mb-4 text-center">
            {t('startNewGroupChatDescription')}
          </p>
          <button
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-semibold shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all"
            onClick={() => {
              setShowChatTypeModal(false);
              window.location.href = "/chat/create-group";
            }}
          >
            <Users className="h-6 w-6" /> {t('goToGroupCreation')}
          </button>
          <button
            className="mt-4 text-blue-500 hover:text-blue-700 text-sm underline"
            onClick={() => setShowChatTypeModal(false)}
          >
            {t('cancel')}
          </button>
        </DialogContent>
      </Dialog>

      {/* Group Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-blue-600"
              onClick={() => setShowMembersModal(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-blue-800">
              {t('groupMembers')}
            </h2>
            <ul className="space-y-3">
              {groupInfo.members?.map((member) => (
                <li key={member.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-200 text-blue-700">
                      {member.displayName?.[0]?.toUpperCase() ||
                        member.username?.[0]?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 font-medium text-gray-800">
                    {member.displayName || member.username}
                  </span>
                  {member.id !== user.id && (
                    <Button
                      variant="destructive"
                      size="icon"
                      disabled={removingMemberId === member.id}
                      onClick={async () => {
                        if (
                          !window.confirm(
                            `${t('removeMemberConfirm')} ${
                              member.displayName || member.username
                            } ${t('fromGroup')}`
                          )
                        )
                          return;
                        setRemovingMemberId(member.id);
                        try {
                          const res = await fetch(
                            `/api/chat/groups/${activeChat.id}/members/${member.id}`,
                            {
                              method: "DELETE",
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem(
                                  "token"
                                )}`,
                              },
                            }
                          );
                          if (res.status === 204) {
                            toast({
                              title: t('memberRemoved'),
                              description: `${
                                member.displayName || member.username
                              } ${t('hasBeenRemoved')}`,
                            });
                            // Refresh group info
                            fetchGroupInfo(activeChat.id);
                          } else {
                            const data = await res.json();
                            toast({
                              title: t('failedToRemoveMember'),
                              description: data.error || t('unknownError'),
                              variant: "destructive",
                            });
                          }
                        } catch (e) {
                          toast({
                            title: t('error'),
                            description: e.message,
                            variant: "destructive",
                          });
                        } finally {
                          setRemovingMemberId(null);
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewChatPage;
