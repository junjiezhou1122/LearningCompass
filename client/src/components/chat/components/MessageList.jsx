import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

/**
 * MessageList component displays chat messages
 */
const MessageList = ({ messages, currentUserId, isLoading = false }) => {
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // If loading, show a spinner
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
        <p className="text-gray-500">Loading messages...</p>
      </div>
    );
  }

  // If no messages, show empty state
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-gray-500 mb-2">No messages yet</p>
        <p className="text-gray-400 text-sm">
          Send a message to start the conversation
        </p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="mb-4">
          <div className="text-center mb-4">
            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
              {format(new Date(date), "MMMM d, yyyy")}
            </span>
          </div>

          {dateMessages.map((message) => {
            const isCurrentUser = message.senderId === currentUserId;

            return (
              <div
                key={message.id}
                className={`flex mb-4 ${
                  isCurrentUser ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    isCurrentUser
                      ? "bg-blue-500 text-white rounded-tr-none"
                      : "bg-gray-100 text-gray-800 rounded-tl-none"
                  }`}
                >
                  {!isCurrentUser && message.sender && (
                    <div className="text-xs font-medium mb-1">
                      {message.sender.displayName || message.sender.username}
                    </div>
                  )}

                  <div className="break-words">{message.content}</div>

                  <div
                    className={`text-xs mt-1 flex justify-between items-center ${
                      isCurrentUser ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    <span>{format(new Date(message.createdAt), "h:mm a")}</span>

                    {isCurrentUser && (
                      <span className="ml-2">
                        {message.status === "sending" && "Sending..."}
                        {message.status === "failed" && "Failed ⚠️"}
                        {message.isRead && "Read ✓✓"}
                        {!message.isRead &&
                          message.status !== "sending" &&
                          message.status !== "failed" &&
                          "Sent ✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
