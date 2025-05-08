import React, { useState, useContext, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Users, X, Plus, Search, Check, ArrowLeft } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CreateGroupPage = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useContext(AuthContext);

  // State variables
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [followers, setFollowers] = useState([]);
  const [filteredFollowers, setFilteredFollowers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Load user's followers
  useEffect(() => {
    const fetchFollowers = async () => {
      setIsLoading(true);
      try {
        // Fetch users who follow you and you follow back
        const response = await fetch(`/api/users/${user.id}/following`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Only include users who follow you back (mutual follows)
          const mutualFollows = data.filter(
            (follower) => follower.isFollowingBack
          );
          setFollowers(mutualFollows);
          setFilteredFollowers(mutualFollows);
        } else {
          toast({
            title: "Error fetching followers",
            description: "Could not load your followers. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching followers:", error);
        toast({
          title: "Connection Error",
          description:
            "Failed to load followers. Please check your connection.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchFollowers();
    }
  }, [user?.id, toast]);

  // Filter followers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFollowers(followers);
      return;
    }

    const filtered = followers.filter(
      (follower) =>
        follower.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (follower.displayName &&
          follower.displayName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()))
    );

    setFilteredFollowers(filtered);
  }, [searchQuery, followers]);

  // Handle selecting/deselecting a member
  const toggleMemberSelection = (member) => {
    if (selectedMembers.some((m) => m.id === member.id)) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  // Handle creating the group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Group name required",
        description: "Please provide a name for your group chat.",
        variant: "destructive",
      });
      return;
    }

    if (selectedMembers.length === 0) {
      toast({
        title: "No members selected",
        description: "Please select at least one member for your group chat.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/chat/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: groupName,
          memberIds: selectedMembers.map((member) => member.id),
        }),
      });

      if (response.ok) {
        const newGroup = await response.json();
        toast({
          title: "Group created",
          description: `${groupName} has been created successfully!`,
        });

        // Navigate to the new group chat
        navigate(`/chat/group/${newGroup.id}`);
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to create group",
          description:
            errorData.message || "An error occurred while creating the group.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Connection Error",
        description: "Failed to create group. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <div className="bg-white shadow-md p-4 flex items-center justify-between">
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
            Create New Group
          </h1>
        </div>
        <Button
          disabled={
            !groupName.trim() || selectedMembers.length === 0 || isCreating
          }
          onClick={handleCreateGroup}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
        >
          {isCreating ? "Creating..." : "Create Group"}
        </Button>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        {/* Group name input */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Name
          </label>
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name..."
            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
          />
        </div>

        {/* Selected members */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Members ({selectedMembers.length})
          </label>

          {selectedMembers.length === 0 ? (
            <p className="text-orange-500 text-sm italic">
              No members selected yet
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center bg-orange-100 rounded-full pl-2 pr-1 py-1"
                >
                  <Avatar className="h-6 w-6 mr-1">
                    <AvatarFallback className="bg-orange-500 text-white text-xs">
                      {member.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-orange-800">
                    {member.username}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleMemberSelection(member)}
                    className="h-6 w-6 ml-1 text-orange-600 hover:bg-orange-200 rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Member selection */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Add Members
            </label>
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search followers..."
                className="pl-8 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-orange-400" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredFollowers.length === 0 ? (
            <div className="text-center py-8 text-orange-500">
              {searchQuery ? (
                <p>No followers matching "{searchQuery}"</p>
              ) : (
                <p>
                  No followers found. You need to follow users who follow you
                  back to add them to a group.
                </p>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid gap-2"
            >
              {filteredFollowers.map((follower) => {
                const isSelected = selectedMembers.some(
                  (m) => m.id === follower.id
                );
                return (
                  <motion.div
                    key={follower.id}
                    whileHover={{ scale: 1.01 }}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                      isSelected ? "bg-orange-100" : "hover:bg-orange-50"
                    }`}
                    onClick={() => toggleMemberSelection(follower)}
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
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center ${
                        isSelected
                          ? "bg-orange-500 text-white"
                          : "border-2 border-orange-300"
                      }`}
                    >
                      {isSelected && <Check className="h-4 w-4" />}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGroupPage;
