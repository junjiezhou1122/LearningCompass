import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserSearch from "./UserSearch";
import RecentChats from "./RecentChats";
import FollowersList from "./FollowersList";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

/**
 * ChatListView component displays the list of chats, search, and followers
 */
const ChatListView = ({ onStartChat, onViewProfile, onNavigate }) => {
  const [activeTab, setActiveTab] = useState("recent");

  // Handle user selection from search or followers
  const handleSelectUser = (user, action = "chat") => {
    if (action === "chat") {
      onStartChat(user.id);
    } else if (action === "profile") {
      onViewProfile(user.id);
    }
  };

  // Handle chat selection from recent chats
  const handleSelectChat = (chat) => {
    if (chat.type === "group") {
      onNavigate(`/chat/group/${chat.id}`);
    } else {
      onStartChat(chat.id);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden h-[calc(100vh-130px)]">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">Messages</h2>
        <Button
          size="sm"
          onClick={() => onNavigate("/chat/create-group")}
          className="flex items-center"
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          New Group
        </Button>
      </div>

      <Tabs
        defaultValue="recent"
        value={activeTab}
        onValueChange={setActiveTab}
        className="h-[calc(100%-60px)] flex flex-col"
      >
        <TabsList className="grid grid-cols-3 bg-gray-100 p-1 mx-4 mt-3 rounded-md">
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
        </TabsList>

        <div className="flex-grow overflow-y-auto">
          <TabsContent value="recent" className="h-full">
            <RecentChats onSelectChat={handleSelectChat} />
          </TabsContent>

          <TabsContent value="search" className="h-full">
            <UserSearch onSelectUser={handleSelectUser} />
          </TabsContent>

          <TabsContent value="followers" className="h-full">
            <FollowersList onSelectUser={handleSelectUser} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ChatListView;
