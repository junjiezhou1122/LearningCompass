import React, { useState, useEffect, useRef } from "react";
import { useSocketIO } from "@/components/chat/SocketIOProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle, RefreshCw, Send } from "lucide-react";

const ChatTestPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { connected, connectionState, reconnect, sendMessage, lastMessage } =
    useSocketIO();

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const messagesEndRef = useRef(null);

  // Handle incoming messages
  useEffect(() => {
    if (!lastMessage) return;

    console.log("Received new message:", lastMessage);

    if (lastMessage.type === "chat_message") {
      setMessages((prev) => [
        ...prev,
        {
          id: lastMessage.id || Date.now(),
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          receiverId: lastMessage.receiverId,
          timestamp: lastMessage.timestamp || new Date().toISOString(),
          status: lastMessage.status || "delivered",
        },
      ]);
    }
  }, [lastMessage]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a message
  const handleSendMessage = () => {
    if (!currentMessage.trim() || !recipientId) return;

    const recipientIdNum = parseInt(recipientId);

    if (isNaN(recipientIdNum)) {
      toast({
        title: "Invalid recipient",
        description: "Please enter a valid recipient ID",
        variant: "destructive",
      });
      return;
    }

    const tempId = Date.now().toString();

    // Create message object
    const messageObj = {
      type: "chat_message",
      content: currentMessage,
      receiverId: recipientIdNum,
      tempId,
    };

    // Add optimistic message to UI
    const optimisticMessage = {
      id: tempId,
      content: currentMessage,
      senderId: user?.id,
      receiverId: recipientIdNum,
      timestamp: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMessage]);
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

  return (
    <div className="min-h-screen bg-orange-50 p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-orange-800 mb-4">
          Socket.IO Chat Test
        </h1>

        {/* Connection status indicator */}
        <div
          className={`mb-4 p-3 rounded-lg ${
            connectionState === "connected"
              ? "bg-green-100 text-green-800"
              : connectionState === "connecting" ||
                connectionState === "reconnecting"
              ? "bg-orange-100 text-orange-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <div className="flex items-center">
            <span className="mr-2">
              {connectionState === "connected" && "✓ Connected"}
              {connectionState === "connecting" && "Connecting..."}
              {connectionState === "reconnecting" && "Reconnecting..."}
              {(connectionState === "disconnected" ||
                connectionState === "failed" ||
                connectionState === "error") && (
                <>
                  <AlertCircle className="inline h-5 w-5 mr-1" />
                  Disconnected
                </>
              )}
            </span>

            {(connectionState === "disconnected" ||
              connectionState === "failed" ||
              connectionState === "error") && (
              <Button onClick={reconnect} size="sm" className="ml-auto">
                <RefreshCw className="h-4 w-4 mr-1" />
                Reconnect
              </Button>
            )}
          </div>
        </div>

        {/* Recipient input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient ID
          </label>
          <Input
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            placeholder="Enter recipient user ID"
            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
          />
        </div>

        {/* Chat messages */}
        <Card className="p-4 mb-4 h-[60vh] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isCurrentUser = message.senderId === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg p-3 ${
                        isCurrentUser
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <div
                        className={`text-xs mt-1 ${
                          isCurrentUser ? "text-orange-100" : "text-gray-500"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {isCurrentUser && message.status && (
                          <span className="ml-2">
                            {message.status === "sending" && "• Sending..."}
                            {message.status === "sent" && "• Sent"}
                            {message.status === "delivered" && "• Delivered"}
                            {message.status === "read" && "• Read"}
                            {message.status === "failed" && "• Failed to send"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </Card>

        {/* Chat input */}
        <div className="flex gap-2">
          <Input
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
            disabled={!connected || !recipientId}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!connected || !currentMessage.trim() || !recipientId}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* User info */}
        <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Your Info
          </h2>
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarFallback className="bg-orange-500 text-white">
                {user?.username?.substring(0, 2).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-800">
                {user?.displayName || user?.username || "Not logged in"}
              </p>
              <p className="text-sm text-gray-500">
                User ID: {user?.id || "Unknown"}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            This is your user ID. Share it with others so they can message you
            for testing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatTestPage;
