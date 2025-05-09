import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Search,
  ArrowLeftRight,
  Settings,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tab } from "@headlessui/react";
import { AuthContext } from "../contexts/AuthContext";
import { useSocketIO } from "../components/chat/SocketIOProvider";
import { useToast } from "@/hooks/use-toast";

// Import chat components
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatHeader from "../components/chat/ChatHeader";
import ChatInput from "../components/chat/ChatInput";
import ChatMessagesList from "../components/chat/ChatMessagesList";
import ChatEmptyState from "../components/chat/ChatEmptyState";
import ChatConnectionStatus from "../components/chat/ChatConnectionStatus";

// Utility function to generate temporary message IDs
const generateTempId = () =>
  `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const ChatPage = () => {
  const { userId: targetUserIdParam } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token } = useContext(AuthContext);
  const { sendMessage, connectionState } = useSocketIO();

  // Main states
  const [activeTab, setActiveTab] = useState(0); // 0 = Direct Messages, 1 = Group Chats
  const [messageInput, setMessageInput] = useState("");
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatMessages, setActiveChatMessages] = useState([]);
  const [activeChatType, setActiveChatType] = useState(null); // 'direct' or 'group'
  const [activeChatInfo, setActiveChatInfo] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [pendingMessages, setPendingMessages] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChatMessages]);

  // Load direct conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user || !token) {
        console.log("No user or token available, skipping fetch conversations");
        return;
      }

      try {
        const response = await fetch("/api/chat/partners", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        } else {
          console.error(
            "Failed to fetch conversations:",
            await response.text()
          );
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    if (user?.id && token) {
      fetchConversations();
    }
  }, [user?.id, token]);

  // Load group conversations
  useEffect(() => {
    const fetchGroups = async () => {
      if (!user || !token) {
        console.log("No user or token available, skipping fetch groups");
        return;
      }

      try {
        console.log(
          "Fetching groups with token:",
          token.substring(0, 10) + "..."
        );
        const response = await fetch("/api/chat/groups/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Fetched groups:", data);
          setGroups(data);
        } else {
          const errorText = await response.text();
          console.error(
            "Failed to fetch group conversations:",
            response.status,
            errorText
          );

          try {
            const errorData = JSON.parse(errorText);
            console.error("Error data:", errorData);
          } catch (e) {
            // If not JSON, just log the text
            console.error("Response is not JSON:", errorText);
          }
        }
      } catch (error) {
        console.error("Error fetching group conversations:", error);
      }
    };

    if (user?.id && token) {
      fetchGroups();
    }
  }, [user?.id, token]);

  // Handle incoming messages via WebSocket
  useEffect(() => {
    const handleNewMessage = (event) => {
      const { message } = event.detail;

      // Check if message belongs to active conversation
      if (
        (activeChatType === "direct" &&
          ((message.senderId === activeChatId &&
            message.receiverId === user?.id) ||
            (message.senderId === user?.id &&
              message.receiverId === activeChatId))) ||
        (activeChatType === "group" && message.groupId === activeChatId)
      ) {
        // Add message to current chat
        setActiveChatMessages((prev) => [...prev, message]);

        // Mark message as read if received from another user
        if (message.senderId !== user?.id) {
          markMessageAsRead(message.id, message.senderId);
        }
      }

      // Update conversation list to show latest message
      if (message.groupId) {
        // Group message
        setGroups((prev) => {
          const updatedGroups = [...prev];
          const index = updatedGroups.findIndex(
            (g) => g.id === message.groupId
          );

          if (index !== -1) {
            updatedGroups[index] = {
              ...updatedGroups[index],
              lastMessage: message.content,
              lastMessageTime: message.createdAt,
              unreadCount:
                activeChatId === message.groupId
                  ? 0
                  : (updatedGroups[index].unreadCount || 0) + 1,
            };
          }

          return updatedGroups;
        });
      } else {
        // Direct message
        setConversations((prev) => {
          const updatedConversations = [...prev];
          let conversationIndex = -1;

          if (message.senderId === user?.id) {
            // Outgoing message
            conversationIndex = updatedConversations.findIndex(
              (c) => c.id === message.receiverId
            );
          } else {
            // Incoming message
            conversationIndex = updatedConversations.findIndex(
              (c) => c.id === message.senderId
            );
          }

          if (conversationIndex !== -1) {
            updatedConversations[conversationIndex] = {
              ...updatedConversations[conversationIndex],
              lastMessage: message.content,
              lastMessageTime: message.createdAt,
              unreadCount:
                activeChatId === updatedConversations[conversationIndex].id
                  ? 0
                  : (updatedConversations[conversationIndex].unreadCount || 0) +
                    1,
            };
          }

          return updatedConversations;
        });
      }
    };

    // Handle message acknowledgments
    const handleMessageAck = (event) => {
      const { tempId, messageId, status } = event.detail;

      // Update message status from pending to delivered
      setActiveChatMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? {
                ...msg,
                id: messageId,
                tempId: null,
                isPending: false,
                isDelivered: true,
              }
            : msg
        )
      );

      // Remove from pending messages
      setPendingMessages((prev) => {
        const updated = { ...prev };
        delete updated[tempId];
        return updated;
      });
    };

    // Handle read receipts
    const handleMessageRead = (event) => {
      const { messageId, readerId, conversationId } = event.detail;

      // Update message status to read
      setActiveChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    };

    // Listen for WebSocket events
    window.addEventListener("chat:message:received", handleNewMessage);
    window.addEventListener("chat:message:ack", handleMessageAck);
    window.addEventListener("chat:message:read", handleMessageRead);

    return () => {
      window.removeEventListener("chat:message:received", handleNewMessage);
      window.removeEventListener("chat:message:ack", handleMessageAck);
      window.removeEventListener("chat:message:read", handleMessageRead);
    };
  }, [activeChatId, activeChatType, user?.id]);

  // Set active chat from URL parameter
  useEffect(() => {
    if (targetUserIdParam) {
      const userId = parseInt(targetUserIdParam);
      if (!isNaN(userId)) {
        setActiveChatId(userId);
        setActiveChatType("direct");

        // Check if this user is in our conversations list, if not fetch their info
        const conversationExists = conversations.find((c) => c.id === userId);
        if (!conversationExists) {
          fetchUserInfo(userId);
        } else {
          setActiveChatInfo(conversationExists);
          loadChatMessages(userId, "direct");
        }
      }
    }
  }, [targetUserIdParam, conversations]);

  // Load chat messages for a specific chat
  const loadChatMessages = async (chatId, type) => {
    if (!user || !token) {
      console.error("No user or token available");
      setIsLoadingMessages(false);
      toast({
        title: "Authentication required",
        description: "Please log in to view chat messages",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      setIsLoadingMessages(true);
      console.log(`Loading messages for ${type} chat with ID:`, chatId);

      let endpoint;
      if (type === "direct") {
        endpoint = `/api/chat/messages/${chatId}`;
      } else if (type === "group") {
        endpoint = `/api/chat/groups/${chatId}/messages`;
      } else {
        console.error("Invalid chat type:", type);
        throw new Error("Invalid chat type");
      }

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to load messages (${response.status}):`,
          errorText
        );

        let errorMessage = "Could not load messages.";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // Not JSON, use text as is
          if (errorText) errorMessage = errorText;
        }

        // Handle specific error codes
        if (response.status === 401) {
          errorMessage = "Your session has expired. Please log in again.";
          navigate("/login");
        } else if (response.status === 403) {
          errorMessage = "You don't have permission to view this chat.";
        } else if (response.status === 404) {
          errorMessage = "This chat could not be found.";
        }

        toast({
          title: "Error loading messages",
          description: errorMessage,
          variant: "destructive",
        });

        setActiveChatMessages([]);
        return;
      }

      const data = await response.json();
      console.log(`Loaded ${data.length} messages for ${type} chat`);
      setActiveChatMessages(data);

      // Mark messages as read
      if (type === "direct") {
        markAllMessagesAsRead(chatId);
      } else if (type === "group") {
        markGroupMessagesAsRead(chatId);
      }

      // Update conversation list to remove unread count
      if (type === "direct") {
        setConversations((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
        );
      } else if (type === "group") {
        setGroups((prev) =>
          prev.map((g) => (g.id === chatId ? { ...g, unreadCount: 0 } : g))
        );
      }
    } catch (error) {
      console.error("Error loading chat messages:", error);
      toast({
        title: "Error loading messages",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMessages(false);
      setMobileMenuOpen(false);
    }
  };

  // Mark messages as read
  const markMessageAsRead = async (messageId, senderId) => {
    try {
      // WebSocket implementation
      if (connectionState === "connected") {
        window.dispatchEvent(
          new CustomEvent("chat:mark_read", {
            detail: { messageId, senderId },
          })
        );
      }

      // Fallback HTTP API
      await fetch(`/api/chat/messages/${messageId}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  // Mark all messages in a conversation as read
  const markAllMessagesAsRead = async (senderId) => {
    try {
      // WebSocket implementation
      if (connectionState === "connected") {
        window.dispatchEvent(
          new CustomEvent("chat:mark_all_read", {
            detail: { senderId },
          })
        );
      }

      // Fallback HTTP API
      await fetch(`/api/chat/messages/read/${senderId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Mark all messages in a group as read
  const markGroupMessagesAsRead = async (groupId) => {
    try {
      // WebSocket implementation
      if (connectionState === "connected") {
        window.dispatchEvent(
          new CustomEvent("chat:mark_group_read", {
            detail: { groupId },
          })
        );
      }

      // Fallback HTTP API
      await fetch(`/api/chat/groups/${groupId}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    } catch (error) {
      console.error("Error marking group messages as read:", error);
    }
  };

  // Fetch user info when starting a chat with someone not in the list
  const fetchUserInfo = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setActiveChatInfo({
          id: userData.id,
          username: userData.username,
          displayName: userData.displayName || userData.username,
          profileImage: userData.profileImage,
        });

        // Add to conversations if not already there
        setConversations((prev) => {
          if (!prev.find((c) => c.id === userData.id)) {
            return [
              ...prev,
              {
                id: userData.id,
                username: userData.username,
                displayName: userData.displayName || userData.username,
                profileImage: userData.profileImage,
                lastMessage: null,
                lastMessageTime: null,
                unreadCount: 0,
              },
            ];
          }
          return prev;
        });

        loadChatMessages(userId, "direct");
      } else {
        toast({
          title: "User Not Found",
          description: "Could not find information for this user.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      toast({
        title: "Error",
        description: "Failed to load user information.",
        variant: "destructive",
      });
    }
  };

  // Handle selecting a chat from the sidebar
  const handleChatSelect = (chatId, type) => {
    if (!user || !token) {
      console.error("No user or token available");
      toast({
        title: "Authentication required",
        description: "Please log in to view this chat",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    console.log(`Selecting ${type} chat with ID:`, chatId);

    setActiveChatId(chatId);
    setActiveChatType(type);
    setActiveChatMessages([]);
    setIsLoadingMessages(true);

    // Update URL without triggering a full navigation
    if (type === "direct") {
      // Direct chat
      navigate(`/chat/${chatId}`);

      // Find the conversation for the selected user
      const selectedConversation = conversations.find((c) => c.id === chatId);
      if (selectedConversation) {
        setActiveChatInfo(selectedConversation);
      }
    } else if (type === "group") {
      // Group chat
      navigate(`/chat/group/${chatId}`);

      // Find the group for the selected group ID
      const selectedGroup = groups.find((g) => g.id === chatId);
      if (selectedGroup) {
        setActiveChatInfo(selectedGroup);
      }
    }

    // Load chat messages
    loadChatMessages(chatId, type);
  };

  // Create new message
  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeChatId || !activeChatType) return;

    const tempId = generateTempId();
    const timestamp = new Date().toISOString();

    // Create local message object
    const newMessage = {
      tempId,
      content: messageInput,
      createdAt: timestamp,
      senderId: user?.id,
      receiverId: activeChatType === "direct" ? activeChatId : null,
      groupId: activeChatType === "group" ? activeChatId : null,
      isPending: true,
      isRead: false,
      sender: {
        id: user?.id,
        username: user?.username,
        profileImage: user?.profileImage,
      },
    };

    // Add to local state immediately
    setActiveChatMessages((prev) => [...prev, newMessage]);

    // Track pending message
    setPendingMessages((prev) => ({
      ...prev,
      [tempId]: {
        message: newMessage,
        attempts: 0,
        lastAttempt: Date.now(),
      },
    }));

    // Use WebSocket to send the message
    if (activeChatType === "direct") {
      sendMessage({
        type: "chat_message",
        receiverId: activeChatId,
        content: messageInput,
        tempId,
      });
    } else {
      sendMessage({
        type: "group_message",
        groupId: activeChatId,
        content: messageInput,
        tempId,
      });
    }

    // Clear input
    setMessageInput("");
  };

  // Handle retrying failed messages
  const handleRetryMessage = (tempId) => {
    const pendingMessage = pendingMessages[tempId];
    if (!pendingMessage) return;

    // Update message status in UI
    setActiveChatMessages((prev) =>
      prev.map((msg) =>
        msg.tempId === tempId
          ? { ...msg, isPending: true, isError: false, isRetrying: true }
          : msg
      )
    );

    // Retry sending
    if (activeChatType === "direct") {
      sendMessage({
        type: "chat_message",
        receiverId: activeChatId,
        content: pendingMessage.message.content,
        tempId,
      });
    } else {
      sendMessage({
        type: "group_message",
        groupId: activeChatId,
        content: pendingMessage.message.content,
        tempId,
      });
    }

    // Update retry count
    setPendingMessages((prev) => ({
      ...prev,
      [tempId]: {
        ...prev[tempId],
        attempts: prev[tempId].attempts + 1,
        lastAttempt: Date.now(),
      },
    }));
  };

  // Handle creating a new group
  const handleCreateGroup = () => {
    navigate("/chat/create-group");
  };

  // Handle keyboard shortcuts for sending messages
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations by search query
  const filteredConversations = searchQuery
    ? conversations.filter(
        (c) =>
          c.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  // Filter groups by search query
  const filteredGroups = searchQuery
    ? groups.filter((g) =>
        g.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : groups;

  return (
    <div className="flex h-screen bg-orange-50 overflow-hidden">
      {/* Chat Sidebar */}
      <div
        className={`w-full md:w-80 lg:w-96 bg-white border-r border-orange-200 flex-shrink-0 shadow-lg ${
          mobileMenuOpen ? "block absolute z-50 h-full" : "hidden md:block"
        }`}
      >
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="h-full flex flex-col"
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-orange-200 bg-gradient-to-r from-orange-100 to-orange-50 flex items-center justify-between">
            <h1 className="text-xl font-bold text-orange-800">Messages</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate("/chat/new")}
                className="p-2 rounded-full text-orange-600 hover:bg-orange-100 transition-colors"
              >
                <UserPlus className="h-5 w-5" />
              </button>
              <button
                onClick={handleCreateGroup}
                className="p-2 rounded-full text-orange-600 hover:bg-orange-100 transition-colors"
              >
                <Users className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 bg-orange-50">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 rounded-full border border-orange-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-orange-400" />
            </div>
          </div>

          {/* Tabs */}
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
            <Tab.List className="flex p-2 space-x-1 bg-orange-100/50">
              <Tab
                className={({ selected }) =>
                  `w-full py-2 text-sm font-medium rounded-lg transition-all
                 ${
                   selected
                     ? "bg-white text-orange-800 shadow-sm"
                     : "text-orange-600 hover:bg-white/30 hover:text-orange-700"
                 }`
                }
              >
                Direct Messages
              </Tab>
              <Tab
                className={({ selected }) =>
                  `w-full py-2 text-sm font-medium rounded-lg transition-all
                 ${
                   selected
                     ? "bg-white text-orange-800 shadow-sm"
                     : "text-orange-600 hover:bg-white/30 hover:text-orange-700"
                 }`
                }
              >
                Group Chats
              </Tab>
            </Tab.List>
            <Tab.Panels className="flex-1 overflow-y-auto">
              {/* Direct Messages Panel */}
              <Tab.Panel className="h-full">
                <ChatSidebar
                  conversations={filteredConversations}
                  activeChatId={activeChatId}
                  onChatSelect={(id) => handleChatSelect(id, "direct")}
                  isLoading={false}
                />
                {filteredConversations.length === 0 && !searchQuery && (
                  <div className="p-4 text-center text-orange-600">
                    <p>No conversations yet</p>
                    <button
                      onClick={() => navigate("/chat/new")}
                      className="mt-2 text-sm font-medium text-orange-500 hover:text-orange-700"
                    >
                      Start a new conversation
                    </button>
                  </div>
                )}
                {filteredConversations.length === 0 && searchQuery && (
                  <div className="p-4 text-center text-orange-600">
                    <p>No results found for "{searchQuery}"</p>
                  </div>
                )}
              </Tab.Panel>

              {/* Group Chats Panel */}
              <Tab.Panel className="h-full">
                <ChatSidebar
                  conversations={filteredGroups}
                  activeChatId={activeChatId}
                  onChatSelect={(id) => handleChatSelect(id, "group")}
                  isLoading={false}
                  isGroupChat={true}
                />
                {filteredGroups.length === 0 && !searchQuery && (
                  <div className="p-4 text-center text-orange-600">
                    <p>No group conversations yet</p>
                    <button
                      onClick={handleCreateGroup}
                      className="mt-2 text-sm font-medium text-orange-500 hover:text-orange-700"
                    >
                      Create a new group
                    </button>
                  </div>
                )}
                {filteredGroups.length === 0 && searchQuery && (
                  <div className="p-4 text-center text-orange-600">
                    <p>No results found for "{searchQuery}"</p>
                  </div>
                )}
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </motion.div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col h-full">
        {activeChatId ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              title={
                activeChatInfo?.displayName || activeChatInfo?.name || "Chat"
              }
              subtitle={
                activeChatType === "direct" ? "Direct Message" : "Group Chat"
              }
              avatarSrc={activeChatInfo?.profileImage}
              avatarFallback={
                activeChatInfo?.displayName?.substring(0, 2) ||
                activeChatInfo?.name?.substring(0, 2) ||
                "?"
              }
              onBackClick={() => setMobileMenuOpen(true)}
              onInfoClick={() => {}}
              showBackButton={true}
              isOnline={true}
            />

            {/* Connection Status */}
            <ChatConnectionStatus
              connectionState={connectionState}
              isPolling={false}
            />

            {/* Messages List */}
            <div
              className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-orange-50/50 to-white"
              ref={messageListRef}
            >
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                  <span className="ml-2 text-orange-800">
                    Loading messages...
                  </span>
                </div>
              ) : activeChatMessages.length > 0 ? (
                <ChatMessagesList
                  messages={activeChatMessages}
                  currentUserId={user?.id}
                  onRetryMessage={handleRetryMessage}
                />
              ) : (
                <ChatEmptyState
                  title="No messages yet"
                  subtitle={`Start a conversation with ${
                    activeChatInfo?.displayName ||
                    activeChatInfo?.name ||
                    "this user"
                  }`}
                />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <ChatInput
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              onSend={handleSendMessage}
              placeholder={`Message ${
                activeChatInfo?.displayName || activeChatInfo?.name || "..."
              }`}
            />
          </>
        ) : (
          // Empty state when no chat is selected
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-orange-50 to-white">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
            >
              <div className="text-center max-w-md mx-auto">
                <motion.div
                  animate={{ rotate: [0, -5, 0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 5 }}
                  className="mb-6 inline-block"
                >
                  <div className="h-24 w-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg mx-auto">
                    <ArrowLeftRight className="h-12 w-12 text-white" />
                  </div>
                </motion.div>
                <h1 className="text-2xl font-bold text-orange-800 mb-2">
                  Chat with your connections
                </h1>
                <p className="text-orange-600 mb-6">
                  Select a conversation or start a new one to begin messaging
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors md:hidden"
                  >
                    View Conversations
                  </button>
                  <button
                    onClick={() => navigate("/chat/new")}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors shadow-md"
                  >
                    New Message
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
