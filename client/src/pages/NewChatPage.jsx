import React, { useState, useEffect, useContext, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import {
  Search,
  ArrowLeft,
  Users,
  UserPlus,
  MessageSquare,
  Send,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { AuthContext } from "../contexts/AuthContext";
import { useSocketIO } from "@/components/chat/SocketIOProvider";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const NewChatPage = () => {
  const [, navigate] = useLocation();
  const [matchUserChat, params] = useRoute("/chat/:userId");
  const [matchGroupChat, groupParams] = useRoute("/chat/group/:groupId");
  const { toast } = useToast();
  const { user } = useContext(AuthContext);
  const { connected, connectionState, reconnect, sendMessage, lastMessage } =
    useSocketIO();

  // If we have URL parameters, use them
  const chatUserId = matchUserChat ? params.userId : null;
  const chatGroupId = matchGroupChat ? groupParams.groupId : null;

  // State to track if we're in a chat or showing the chat list
  const [currentChat, setCurrentChat] = useState(null);
  const [currentGroupChat, setCurrentGroupChat] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);

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

    // Handle new chat messages
    if (lastMessage.type === "chat_message") {
      // Check if it's for the current chat
      if (
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

      // Or for the current group
      if (
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
      const response = await fetch(`/api/users/${userId}`, {
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
      const response = await fetch(`/api/chat/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

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

      const response = await fetch(`/api/chat/history/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

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
      const response = await fetch(`/api/chat/groups/${groupId}/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

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

  // State variables
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);

  // Fetch user's followers
  useEffect(() => {
    const fetchFollowers = async () => {
      if (!user?.id) return;

      setIsLoadingFollowers(true);
      try {
        // Fetch users who follow you and you follow back (mutual follows)
        const response = await fetch(`/api/users/${user.id}/following`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

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
      }
    };

    fetchFollowers();
  }, [user?.id]);

  // Fetch recent chats
  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const response = await fetch("/api/chat/recent", {
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
        `/api/users/search?q=${encodeURIComponent(searchQuery)}`,
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
                `/api/chat/can-chat/${result.id}`,
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
    navigate(`/chat/${userId}`);
  };

  // Navigate to user profile
  const viewProfile = (userId) => {
    navigate(`/users/${userId}`);
  };

  // Navigate to create group page
  const createGroup = () => {
    navigate("/chat/create-group");
  };

  const chatContainerRef = useRef(null);
  const lastMessageRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

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
      setShowScrollToBottom(!atBottom);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [chatContainerRef]);

  // Scroll to bottom when entering chat or sending a message
  useEffect(() => {
    if (!chatContainerRef.current) return;
    // If just loaded chat or just sent a message, scroll to bottom
    if (
      isAtBottom ||
      (chatMessages.length > 0 &&
        chatMessages[chatMessages.length - 1]?.senderId === user?.id)
    ) {
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
            onClick={() => navigate("/chat")}
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

      {/* Chat View */}
      {currentChat || currentGroupChat ? (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl mx-auto p-4 h-full"
        >
          {/* Connection state indicator */}
          {connectionState !== "connected" && (
            <div
              className={`mb-4 p-3 rounded-lg text-center ${
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

          <div className="bg-white rounded-2xl shadow-lg h-[calc(100vh-180px)] flex flex-col border border-orange-100 animate-fadein">
            {isLoading ? (
              <div className="flex-grow flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                {/* Chat messages area */}
                <div
                  ref={chatContainerRef}
                  className="flex-grow p-4 overflow-y-auto custom-scrollbar bg-gradient-to-b from-orange-50 to-white transition-colors duration-300 relative"
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
                    <div className="space-y-4">
                      {chatMessages.map((message, idx) => {
                        const isCurrentUser = message.senderId === user?.id;
                        const isLast = idx === chatMessages.length - 1;
                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: idx * 0.03 }}
                            className={`flex ${
                              isCurrentUser ? "justify-end" : "justify-start"
                            }`}
                            ref={isLast ? lastMessageRef : null}
                          >
                            <motion.div
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.98 }}
                              className={`max-w-[75%] rounded-2xl p-3 shadow-md transition-all duration-200 border
                                ${
                                  isCurrentUser
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-200"
                                    : "bg-white text-gray-800 border-orange-100"
                                }
                                animate-popin`}
                            >
                              <p className="whitespace-pre-wrap break-words text-base leading-relaxed">
                                {message.content}
                              </p>
                              <div
                                className={`text-xs mt-1 flex items-center gap-2 ${
                                  isCurrentUser
                                    ? "text-orange-100"
                                    : "text-gray-500"
                                }`}
                              >
                                {new Date(message.createdAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                                {isCurrentUser && message.status && (
                                  <span>
                                    {message.status === "sending" && (
                                      <span className="animate-pulse">
                                        • Sending...
                                      </span>
                                    )}
                                    {message.status === "delivered" &&
                                      "• Delivered"}
                                    {message.status === "read" && "• Read"}
                                    {message.status === "failed" && (
                                      <span className="text-red-200">
                                        • Failed to send
                                      </span>
                                    )}
                                  </span>
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
                        connectionState !== "connected" ||
                        !currentMessage.trim()
                      }
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {connectionState !== "connected" && (
                    <p className="text-sm text-orange-600 mt-2">
                      Connect to the chat server to send messages
                    </p>
                  )}
                </motion.div>
              </>
            )}
          </div>
        </motion.div>
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
                  onClick={() => navigate("/users")}
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
        </motion.div>
      )}
    </div>
  );
};

export default NewChatPage;
