import React from "react";
import { Loader2, MessagesSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * UserSearchResults displays the results of a user search
 */
const UserSearchResults = ({
  results,
  isLoading,
  onSelectUser,
  searchQuery,
}) => {
  // If loading, show spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  // If no query, show prompt
  if (!searchQuery || searchQuery.length < 2) {
    return (
      <div className="text-center text-gray-500 py-6">
        Type at least 2 characters to search for users
      </div>
    );
  }

  // If no results, show message
  if (results.length === 0) {
    return (
      <div className="text-center text-gray-500 py-6">
        No users found matching "{searchQuery}"
      </div>
    );
  }

  // Show results
  return (
    <div className="space-y-3">
      {results.map((user) => (
        <div
          key={user.id}
          className="rounded-lg border bg-white p-3 shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.profileImage} alt={user.username} />
              <AvatarFallback>
                {user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {user.displayName || user.username}
              </div>
              <div className="text-xs text-gray-500">@{user.username}</div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSelectUser(user, "chat")}
              className="flex items-center"
            >
              <MessagesSquare className="h-4 w-4 mr-1" />
              Chat
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSelectUser(user, "profile")}
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

export default UserSearchResults;
