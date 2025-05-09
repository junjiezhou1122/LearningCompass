import React, { useState, useEffect } from "react";
import { useNavigate } from "wouter";
import { Loader2 } from "lucide-react";
import { getRecentChats } from "@/services/chatService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

/**
 * RecentChats component displays recent chat conversations
 */
const RecentChats = ({ onSelectChat }) => {
  const [recentChats, setRecentChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load recent chats on component mount
  useEffect(() => {
    loadRecentChats();
  }, []);

  // Function to load recent chats
  const loadRecentChats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getRecentChats();
      setRecentChats(data || []);
    } catch (err) {
      console.error("Error fetching recent chats:", err);
      setError("Failed to load recent chats");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle chat selection
  const handleSelectChat = (chat) => {
    if (onSelectChat) {
      onSelectChat(chat);
    }
  };

  // If loading, show spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="text-center p-4">
        <div className="text-red-500 mb-2">{error}</div>
        <button
          onClick={loadRecentChats}
          className="text-blue-500 hover:underline text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  // If no recent chats, show message
  if (recentChats.length === 0) {
    return (
      <div className="text-center text-gray-500 py-6">
        <p className="mb-2">No recent conversations</p>
        <p className="text-sm">
          Start a new chat by searching for users or joining a room
        </p>
      </div>
    );
  }

  // Show recent chats list
  return (
    <div className="divide-y">
      {recentChats.map((chat) => {
        const isGroup = chat.type === "group";
        const name = isGroup ? chat.name : chat.displayName || chat.username;

        return (
          <div
            key={isGroup ? `group-${chat.id}` : `user-${chat.id}`}
            className="p-3 hover:bg-gray-50 cursor-pointer flex items-center"
            onClick={() => handleSelectChat(chat)}
          >
            <Avatar className="h-12 w-12 mr-3">
              <AvatarImage src={chat.profileImage} alt={name} />
              <AvatarFallback
                className={
                  isGroup
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }
              >
                {name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between">
                <div className="font-medium truncate">{name}</div>
                <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                  {chat.lastMessageTime &&
                    formatDistanceToNow(new Date(chat.lastMessageTime), {
                      addSuffix: true,
                    })}
                </div>
              </div>

              <div className="text-sm text-gray-600 truncate">
                {chat.lastMessage || "No messages yet"}
              </div>
            </div>

            {chat.unreadCount > 0 && (
              <Badge className="ml-2 bg-blue-500" variant="default">
                {chat.unreadCount}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RecentChats;
