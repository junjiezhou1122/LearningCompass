import React, { useState, useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const DirectMessage = ({ message, isCurrentUser }) => {
  const timestamp = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  return (
    <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"} max-w-[80%]`}>
        {!isCurrentUser && (
          <Avatar className="h-8 w-8 mr-2">
            <div className="bg-primary text-white w-full h-full flex items-center justify-center text-xs font-bold">
              {message.sender?.username?.charAt(0).toUpperCase() || "U"}
            </div>
          </Avatar>
        )}
        <div
          className={`px-4 py-2 rounded-lg ${isCurrentUser
            ? "bg-primary text-primary-foreground rounded-tr-none"
            : "bg-muted rounded-tl-none"
          } relative group`}
        >
          <div className="flex flex-col">
            {!isCurrentUser && (
              <span className="text-xs font-semibold mb-1">
                {message.sender?.username || "Unknown user"}
              </span>
            )}
            <p className="break-words">{message.content}</p>
            <div className="flex justify-end items-center mt-1">
              <span className="text-xs opacity-70">{timestamp}</span>
              {message.isPending && (
                <span className="ml-1 text-xs opacity-70">• Sending</span>
              )}
              {!message.isPending && isCurrentUser && (
                <span className="ml-1 text-xs opacity-70">• Sent</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatPartnerItem = ({ partner, active, onClick, unreadCount }) => {
  return (
    <div
      className={`flex items-center p-3 cursor-pointer hover:bg-muted/50 rounded-md ${active ? "bg-muted" : ""}`}
      onClick={() => onClick(partner)}
    >
      <Avatar className="h-10 w-10 mr-3">
        <div className="bg-primary text-white w-full h-full flex items-center justify-center text-sm font-bold">
          {partner.username?.charAt(0).toUpperCase() || "U"}
        </div>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className="font-medium truncate">{partner.username}</p>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-xs rounded-full px-2 py-1">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <div className={`w-2 h-2 rounded-full mr-2 ${partner.online ? "bg-green-500" : "bg-gray-400"}`}></div>
          <span>{partner.online ? "Online" : "Offline"}</span>
        </div>
      </div>
    </div>
  );
};

const DirectChatUI = ({
  chatPartners,
  activeChat,
  setActiveChat,
  messages,
  input,
  setInput,
  sendMessage,
  isLoadingPartners,
  isLoadingMessages,
  hasMoreMessages,
  loadMoreMessages
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter chat partners based on search query
  const filteredPartners = searchQuery.trim() === ""
    ? chatPartners
    : chatPartners.filter(partner => 
        partner.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle key press for sending messages
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] overflow-hidden">
      {/* Sidebar with chat partners */}
      <div className="w-80 border-r hidden md:flex flex-col">
        <div className="p-3 border-b">
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <ScrollArea className="flex-1">
          {isLoadingPartners ? (
            // Loading placeholders
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center p-3">
                <Skeleton className="h-10 w-10 rounded-full mr-3" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : filteredPartners.length > 0 ? (
            filteredPartners.map((partner) => (
              <ChatPartnerItem
                key={partner.id}
                partner={partner}
                active={activeChat?.id === partner.id}
                onClick={setActiveChat}
                unreadCount={partner.unreadCount || 0}
              />
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? "No matches found" : "No conversations yet"}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            {/* Chat header */}
            <div className="p-3 border-b flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <div className="bg-primary text-white w-full h-full flex items-center justify-center text-sm font-bold">
                    {activeChat.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{activeChat.username}</h3>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${activeChat.online ? "bg-green-500" : "bg-gray-400"}`}></div>
                    <span>{activeChat.online ? "Online" : "Offline"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages area */}
            <ScrollArea className="flex-1 p-4">
              {hasMoreMessages && (
                <div className="flex justify-center mb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadMoreMessages}
                    disabled={isLoadingMessages}
                  >
                    {isLoadingMessages ? "Loading..." : "Load earlier messages"}
                  </Button>
                </div>
              )}
              
              {isLoadingMessages && messages.length === 0 ? (
                // Message loading placeholders
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"} mb-4`}>
                    {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full mr-2" />}
                    <div>
                      {i % 2 === 0 && <Skeleton className="h-3 w-20 mb-1" />}
                      <Skeleton className={`h-16 ${i % 2 === 0 ? "w-64" : "w-48"} rounded-md`} />
                    </div>
                  </div>
                ))
              ) : messages.length > 0 ? (
                messages.map((message) => (
                  <DirectMessage
                    key={message.id}
                    message={message}
                    isCurrentUser={message.senderId === user?.id}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-4">
                    <h3 className="font-semibold text-lg mb-2">No messages yet</h3>
                    <p className="text-muted-foreground">Send a message to start a conversation with {activeChat.username}</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input area */}
            <div className="p-3 border-t">
              <div className="flex items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 mr-2"
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!input.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6 max-w-md">
              <h3 className="font-semibold text-xl mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the list or start a new one by searching for users.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectChatUI;