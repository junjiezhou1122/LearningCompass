import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchUsers } from "@/services/chatService";
import UserSearchResults from "./UserSearchResults";

/**
 * UserSearch component for finding users to chat with
 */
const UserSearch = ({ onSelectUser, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await searchUsers(query);
      setSearchResults(results || []);
    } catch (err) {
      console.error("Error searching users:", err);
      setError("Failed to search users. Please try again.");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectUser = (user) => {
    if (onSelectUser) {
      onSelectUser(user);
    }
    // Clear search after selection
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="p-4">
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          type="search"
          placeholder="Search for users..."
          value={searchQuery}
          onChange={handleSearch}
          className="pl-10 bg-gray-50"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-2 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      <UserSearchResults
        results={searchResults}
        isLoading={isLoading}
        onSelectUser={handleSelectUser}
        searchQuery={searchQuery}
      />
    </div>
  );
};

export default UserSearch;
