import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Plus, Users, User, X, MessageSquare } from "lucide-react";
import { useSocketIO } from "./SocketIOProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ChatSidebar = ({
  isOpen,
  setIsOpen,
  activeChat,
  setActiveChat,
  chatPartners = [],
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const { connectionState } = useSocketIO();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("direct");

  // Filter chat partners based on search query
  const filteredPartners = chatPartners.filter((partner) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      partner.username?.toLowerCase().includes(query) ||
      partner.displayName?.toLowerCase().includes(query) ||
      partner.lastMessage?.toLowerCase().includes(query)
    );
  });

  // Split partners into direct and group chats
  const directChats = filteredPartners.filter(
    (partner) => partner.type === "direct" || !partner.type
  );
  const groupChats = filteredPartners.filter(
    (partner) => partner.type === "group"
  );

  // Handle clicking outside to close on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only apply this on mobile
      if (window.innerWidth >= 1024) return;

      // Check if click is outside the sidebar
      const sidebar = document.getElementById("chat-sidebar");
      if (isOpen && sidebar && !sidebar.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  // Create a new chat
  const handleNewChat = () => {
    navigate("/chat/new");
  };

  // Create a new group
  const handleNewGroup = () => {
    navigate("/chat/create-group");
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        id="chat-sidebar"
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white border-r border-orange-100 
                   flex flex-col h-full transform transition-transform duration-300 ease-in-out
                   ${
                     isOpen
                       ? "translate-x-0"
                       : "-translate-x-full lg:translate-x-0"
                   }`}
        initial={false}
      >
        {/* Header */}
        <div className="p-4 border-b border-orange-100 flex items-center justify-between bg-orange-50 sticky top-0 z-10">
          <h2 className="text-lg font-bold text-orange-800">Messages</h2>
          <div className="flex gap-2">
            <Button
              variant="solid"
              size="icon"
              onClick={handleNewChat}
              className="rounded-full h-10 w-10 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:from-orange-600 hover:to-orange-700"
              title="Start New Chat"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button
              variant="solid"
              size="icon"
              onClick={handleNewGroup}
              className="rounded-full h-10 w-10 bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md hover:from-orange-500 hover:to-orange-600"
              title="Create Group"
            >
              <Users className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="lg:hidden rounded-full h-10 w-10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-orange-400" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-orange-50 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>
        </div>

        {/* Tabs with improved visuals */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-2 px-4 mb-2 mt-2 gap-2">
            <TabsTrigger
              value="direct"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-orange-700 font-semibold py-2 rounded-lg transition-all text-base"
            >
              <User className="h-5 w-5 mr-2" /> Direct
            </TabsTrigger>
            <TabsTrigger
              value="groups"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-orange-700 font-semibold py-2 rounded-lg transition-all text-base"
            >
              <Users className="h-5 w-5 mr-2" /> Groups
            </TabsTrigger>
          </TabsList>

          {/* Direct Chats Tab */}
          <TabsContent
            value="direct"
            className="flex-1 overflow-auto px-2 py-2"
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full" />
              </div>
            ) : directChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <img
                  src="/assets/empty-chat.svg"
                  alt="No chats"
                  className="h-24 w-24 mb-4 opacity-80"
                />
                <p className="text-gray-500 mb-2 text-lg font-medium">
                  No conversations yet
                </p>
                <Button
                  onClick={handleNewChat}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg shadow-md hover:from-orange-600 hover:to-orange-700 mt-2"
                >
                  <Plus className="h-5 w-5 mr-2" /> Start a Chat
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {directChats.map((partner) => (
                  <div
                    key={partner.id}
                    className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-150
                      ${
                        activeChat?.id === partner.id
                          ? "bg-orange-100/80 text-orange-900 shadow"
                          : "hover:bg-orange-50 text-gray-700"
                      }
                    `}
                    onClick={() => setActiveChat(partner)}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        {partner.profileImage ? (
                          <img
                            src={partner.profileImage}
                            alt={partner.displayName || partner.username}
                            className="h-full w-full object-cover rounded-full"
                          />
                        ) : (
                          <AvatarFallback className="bg-orange-600 text-white text-lg">
                            {(partner.displayName || partner.username)
                              ?.substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {partner.status === "online" && (
                        <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                      )}
                    </div>
                    <div className="ml-4 overflow-hidden flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold truncate text-base">
                          {partner.displayName || partner.username}
                        </p>
                        {partner.lastMessageTime && (
                          <p className="text-xs text-gray-400">
                            {formatMessageTime(partner.lastMessageTime)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center mt-1">
                        <p className="text-sm truncate text-gray-500 flex-1">
                          {partner.lastMessage || "No messages yet"}
                        </p>
                        {partner.unreadCount > 0 && (
                          <Badge className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full shadow">
                            {partner.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Group Chats Tab */}
          <TabsContent
            value="groups"
            className="flex-1 overflow-auto px-2 py-2"
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full" />
              </div>
            ) : groupChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <img
                  src="/assets/empty-group.svg"
                  alt="No group chats"
                  className="h-24 w-24 mb-4 opacity-80"
                />
                <p className="text-gray-500 mb-2 text-lg font-medium">
                  No group chats yet
                </p>
                <Button
                  onClick={handleNewGroup}
                  className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-6 py-2 rounded-lg shadow-md hover:from-orange-500 hover:to-orange-600 mt-2"
                >
                  <Plus className="h-5 w-5 mr-2" /> Create Group Chat
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {groupChats.map((group) => (
                  <div
                    key={group.id}
                    className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-150
                      ${
                        activeChat?.id === group.id
                          ? "bg-orange-100/80 text-orange-900 shadow"
                          : "hover:bg-orange-50 text-gray-700"
                      }
                    `}
                    onClick={() => setActiveChat(group)}
                  >
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-orange-200 flex items-center justify-center overflow-hidden">
                        {group.imageUrl ? (
                          <img
                            src={group.imageUrl}
                            alt={group.name}
                            className="h-full w-full object-cover rounded-full"
                          />
                        ) : (
                          <Users className="h-6 w-6 text-orange-600" />
                        )}
                      </div>
                    </div>
                    <div className="ml-4 overflow-hidden flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold truncate text-base">
                          {group.name || "Unnamed Group"}
                        </p>
                        {group.lastMessageTime && (
                          <p className="text-xs text-gray-400">
                            {formatMessageTime(group.lastMessageTime)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center mt-1">
                        <p className="text-sm truncate text-gray-500 flex-1">
                          {group.lastMessage || "No messages yet"}
                        </p>
                        <span className="ml-2 text-xs text-gray-500">
                          {group.memberCount || 0} members
                        </span>
                        {group.isAdmin && (
                          <Badge className="ml-1 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full shadow">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Connection status */}
        <div className="px-4 py-2 border-t border-orange-100 bg-orange-50">
          <div className="flex items-center">
            <div
              className={`h-2 w-2 rounded-full mr-2 ${getConnectionStatusColor(
                connectionState
              )}`}
            />
            <p className="text-xs text-gray-600">
              {getConnectionStatusText(connectionState)}
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
};

// Helper function to format message time
function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today - show time
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    // Yesterday
    return "Yesterday";
  } else if (diffDays < 7) {
    // This week - show day name
    return date.toLocaleDateString([], { weekday: "short" });
  } else {
    // Older - show date
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}

// Helper function to get connection status color
function getConnectionStatusColor(connectionState) {
  switch (connectionState) {
    case "connected":
      return "bg-green-500";
    case "connecting":
    case "reconnecting":
      return "bg-yellow-500";
    case "disconnected":
    case "failed":
    case "error":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

// Helper function to get connection status text
function getConnectionStatusText(connectionState) {
  switch (connectionState) {
    case "connected":
      return "Connected";
    case "connecting":
      return "Connecting...";
    case "reconnecting":
      return "Reconnecting...";
    case "disconnected":
      return "Disconnected";
    case "failed":
      return "Connection Failed";
    case "error":
      return "Connection Error";
    default:
      return "Unknown Status";
  }
}

export default ChatSidebar;
