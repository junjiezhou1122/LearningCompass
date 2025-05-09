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
        <div className="p-4 border-b border-orange-100 flex items-center justify-between bg-orange-50">
          <h2 className="text-lg font-semibold text-orange-800">Messages</h2>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleNewChat}
              className="rounded-full h-8 w-8"
            >
              <MessageSquare className="h-4 w-4 text-orange-600" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNewGroup}
              className="rounded-full h-8 w-8"
            >
              <Users className="h-4 w-4 text-orange-600" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="lg:hidden rounded-full h-8 w-8"
            >
              <X className="h-4 w-4" />
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

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-2 px-4">
            <TabsTrigger
              value="direct"
              className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800"
            >
              <User className="h-4 w-4 mr-2" /> Direct
            </TabsTrigger>
            <TabsTrigger
              value="groups"
              className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800"
            >
              <Users className="h-4 w-4 mr-2" /> Groups
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
              <div className="text-center py-8 px-4">
                <p className="text-gray-500 mb-4">No conversations yet</p>
                <Button
                  onClick={handleNewChat}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start a Chat
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {directChats.map((partner) => (
                  <div
                    key={partner.id}
                    className={`flex items-center p-2 rounded-lg cursor-pointer
                              ${
                                activeChat?.id === partner.id
                                  ? "bg-orange-100 text-orange-900"
                                  : "hover:bg-orange-50 text-gray-700"
                              }`}
                    onClick={() => setActiveChat(partner)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        {partner.profileImage ? (
                          <img
                            src={partner.profileImage}
                            alt={partner.displayName || partner.username}
                          />
                        ) : (
                          <AvatarFallback className="bg-orange-600 text-white">
                            {(partner.displayName || partner.username)
                              ?.substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      {/* Online status indicator */}
                      {partner.status === "online" && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                      )}
                    </div>

                    <div className="ml-3 overflow-hidden flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-medium truncate">
                          {partner.displayName || partner.username}
                        </p>

                        {/* Timestamp for last message */}
                        {partner.lastMessageTime && (
                          <p className="text-xs text-gray-500">
                            {formatMessageTime(partner.lastMessageTime)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center">
                        <p className="text-sm truncate text-gray-500 flex-1">
                          {partner.lastMessage || "No messages yet"}
                        </p>

                        {/* Unread count badge */}
                        {partner.unreadCount > 0 && (
                          <Badge className="ml-2 bg-orange-500">
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
              <div className="text-center py-8 px-4">
                <p className="text-gray-500 mb-4">No group chats yet</p>
                <Button
                  onClick={handleNewGroup}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group Chat
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {groupChats.map((group) => {
                  // Ensure group has an id to prevent rendering errors
                  if (!group || !group.id) return null;

                  return (
                    <div
                      key={group.id}
                      className={`flex items-center p-2 rounded-lg cursor-pointer
                                ${
                                  activeChat?.id === group.id
                                    ? "bg-orange-100 text-orange-900"
                                    : "hover:bg-orange-50 text-gray-700"
                                }`}
                      onClick={() => setActiveChat(group)}
                    >
                      <div className="h-10 w-10 rounded-full bg-orange-200 flex items-center justify-center overflow-hidden">
                        {group.imageUrl ? (
                          <img
                            src={group.imageUrl}
                            alt={group.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Users className="h-5 w-5 text-orange-600" />
                        )}
                      </div>

                      <div className="ml-3 overflow-hidden flex-1">
                        <div className="flex justify-between items-center">
                          <p className="font-medium truncate">
                            {group.name || "Unnamed Group"}
                          </p>

                          {/* Timestamp for last message */}
                          {group.lastMessageTime && (
                            <p className="text-xs text-gray-500">
                              {formatMessageTime(group.lastMessageTime)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center">
                          <p className="text-sm truncate text-gray-500 flex-1">
                            {group.lastMessage || "No messages yet"}
                          </p>

                          {/* Member count */}
                          <span className="ml-2 text-xs text-gray-500">
                            {group.memberCount || 0} members
                          </span>

                          {/* Admin badge */}
                          {group.isAdmin && (
                            <Badge className="ml-1 bg-orange-500 text-white text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
