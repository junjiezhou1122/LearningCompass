import React, { useState, useEffect } from "react";
import { Loader2, MessagesSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getFollowers } from "@/services/chatService";

/**
 * FollowersList component displays followers who the user can chat with
 */
const FollowersList = ({ onSelectUser }) => {
  const [followers, setFollowers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load followers on component mount
  useEffect(() => {
    loadFollowers();
  }, []);

  // Function to load followers
  const loadFollowers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getFollowers();
      setFollowers(data || []);
    } catch (err) {
      console.error("Error fetching followers:", err);
      setError("Failed to load followers");
    } finally {
      setIsLoading(false);
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
          onClick={loadFollowers}
          className="text-blue-500 hover:underline text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  // If no followers, show message
  if (followers.length === 0) {
    return (
      <div className="text-center text-gray-500 py-6">
        <p className="mb-2">No followers found</p>
        <p className="text-sm">When users follow you, they'll appear here</p>
      </div>
    );
  }

  // Show followers list
  return (
    <div className="space-y-3">
      {followers.map((follower) => (
        <div
          key={follower.id}
          className="rounded-lg border bg-white p-3 shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={follower.profileImage}
                alt={follower.username}
              />
              <AvatarFallback>
                {follower.displayName?.charAt(0) ||
                  follower.username?.charAt(0) ||
                  "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {follower.displayName || follower.username}
              </div>
              <div className="text-xs text-gray-500">@{follower.username}</div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSelectUser(follower, "chat")}
              className="flex items-center"
            >
              <MessagesSquare className="h-4 w-4 mr-1" />
              Chat
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSelectUser(follower, "profile")}
              className="flex items-center text-gray-500"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FollowersList;
