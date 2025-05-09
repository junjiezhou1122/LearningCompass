import React, { useState, useEffect, useContext, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { AuthContext } from "@/contexts/AuthContext";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import {
  getUserDetails,
  getDirectChatHistory,
  getGroupInfo,
  getGroupChatHistory,
  getRoomMessages,
} from "@/services/chatService";
import { useToast } from "@/hooks/use-toast";

/**
 * ChatView component displays an individual chat conversation
 */
const ChatView = ({
  userId = null,
  groupId = null,
  roomId = null,
  connectionState,
  sendMessage,
  isLoading: initialLoading = false,
}) => {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const messageEndRef = useRef(null);

  // Load chat data when userId, groupId or roomId changes
  useEffect(() => {
    const loadChatData = async () => {
      setIsLoading(true);

      try {
        if (userId) {
          // Load direct chat data
          const [userData, history] = await Promise.all([
            getUserDetails(userId),
            getDirectChatHistory(userId),
          ]);

          setChatUser(userData);
          setChatMessages(history);
          setGroupInfo(null);
          setRoomInfo(null);
        } else if (groupId) {
          // Load group chat data
          const [groupData, history] = await Promise.all([
            getGroupInfo(groupId),
            getGroupChatHistory(groupId),
          ]);

          setGroupInfo(groupData);
          setChatMessages(history);
          setChatUser(null);
          setRoomInfo(null);
        } else if (roomId) {
          // Load room chat data
          try {
            const messages = await getRoomMessages(roomId);
            setChatMessages(messages || []);
            setRoomInfo({ id: roomId, name: `Room ${roomId}` });
            setChatUser(null);
            setGroupInfo(null);
          } catch (error) {
            console.error("Error loading room messages:", error);
            setChatMessages([]);
          }
        } else {
          // Reset state if no ID provided
          setChatUser(null);
          setGroupInfo(null);
          setRoomInfo(null);
          setChatMessages([]);
        }
      } catch (error) {
        console.error("Error loading chat data:", error);
        toast({
          title: "Error",
          description: "Could not load chat information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId || groupId || roomId) {
      loadChatData();
    }
  }, [userId, groupId, roomId, toast]);

  // Update messages when a new WebSocket message arrives
  useEffect(() => {
    const handleWebSocketMessage = (event) => {
      const data = event.detail;
      if (!data) return;

      // Check if the message is for the current chat
      let isRelevant = false;

      if (
        userId &&
        (data.senderId === parseInt(userId) ||
          data.receiverId === parseInt(userId))
      ) {
        isRelevant = true;
      } else if (groupId && data.groupId === parseInt(groupId)) {
        isRelevant = true;
      } else if (roomId && data.roomId === parseInt(roomId)) {
        isRelevant = true;
      }

      if (isRelevant) {
        setChatMessages((prev) => [...prev, data]);
        setTimeout(() => {
          messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    // Listen for new messages from the WebSocket provider
    window.addEventListener("chat:message", handleWebSocketMessage);

    return () => {
      window.removeEventListener("chat:message", handleWebSocketMessage);
    };
  }, [userId, groupId, roomId]);

  // Handle sending a message
  const handleSendMessage = (messageContent) => {
    if (!messageContent.trim()) return;

    const tempId = Date.now().toString();

    // Create message object based on chat type
    let messageObj;
    if (userId) {
      messageObj = {
        type: "chat_message",
        content: messageContent,
        receiverId: parseInt(userId),
        tempId,
      };
    } else if (groupId) {
      messageObj = {
        type: "group_message",
        content: messageContent,
        groupId: parseInt(groupId),
        tempId,
      };
    } else if (roomId) {
      messageObj = {
        type: "room_message",
        content: messageContent,
        roomId,
        tempId,
      };
    } else {
      return; // No target to send to
    }

    // Add optimistic message to UI
    const optimisticMessage = {
      id: tempId,
      content: messageContent,
      senderId: user?.id,
      createdAt: new Date().toISOString(),
      status: "sending",
      sender: {
        id: user?.id,
        username: user?.username,
        displayName: user?.displayName,
        profileImage: user?.profileImage,
      },
      ...(userId ? { receiverId: parseInt(userId) } : {}),
      ...(groupId ? { groupId: parseInt(groupId) } : {}),
      ...(roomId ? { roomId } : {}),
    };

    setChatMessages((prev) => [...prev, optimisticMessage]);

    // Scroll to bottom
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    // Send via WebSocket
    sendMessage(messageObj);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 h-full">
      {/* Connection state indicator */}
      {connectionState !== "connected" && (
        <div
          className={`mb-4 p-3 rounded-lg text-center ${
            connectionState === "connecting" ||
            connectionState === "reconnecting"
              ? "bg-orange-100 text-orange-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {connectionState === "connecting" && "Connecting to chat server..."}
          {connectionState === "reconnecting" &&
            "Reconnecting to chat server..."}
          {(connectionState === "disconnected" ||
            connectionState === "failed") && (
            <div className="flex items-center justify-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>
                Could not connect to chat. Please refresh the page or try again.
              </span>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md h-[calc(100vh-180px)] flex flex-col">
        {/* Messages area */}
        <MessageList
          messages={chatMessages}
          currentUserId={user?.id}
          isLoading={isLoading}
        />

        {/* Message input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={connectionState !== "connected"}
          placeholder={`Type your message${
            roomId ? " to the room" : groupId ? " to the group" : ""
          }...`}
        />
      </div>
      <div ref={messageEndRef} />
    </div>
  );
};

export default ChatView;
