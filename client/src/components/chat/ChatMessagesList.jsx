import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "./ChatMessage";

// Create a date divider component for messages
const ChatDateDivider = ({ date }) => {
  // Format date for display
  const formatDate = () => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if date is today or yesterday
    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      // Format other dates
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year:
          messageDate.getFullYear() !== today.getFullYear()
            ? "numeric"
            : undefined,
      }).format(messageDate);
    }
  };

  return (
    <div className="flex items-center justify-center my-6">
      <div className="bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full">
        {formatDate()}
      </div>
    </div>
  );
};

const ChatMessagesList = ({
  messages = [],
  isLoading = false,
  hasMore = false,
  loadOlderMessages,
  messagesEndRef,
  scrollAreaRef,
  user,
  partner,
}) => {
  const topObserverRef = useRef(null);

  // Group messages by date for rendering date dividers
  const groupMessagesByDate = () => {
    const groups = {};

    messages.forEach((message) => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return Object.entries(groups).map(([date, dateMessages]) => ({
      date,
      messages: dateMessages,
    }));
  };

  // Create intersection observer for infinite scrolling
  useEffect(() => {
    if (!hasMore || !loadOlderMessages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          loadOlderMessages();
        }
      },
      { threshold: 0.1 }
    );

    if (topObserverRef.current) {
      observer.observe(topObserverRef.current);
    }

    return () => {
      if (topObserverRef.current) {
        observer.unobserve(topObserverRef.current);
      }
    };
  }, [hasMore, isLoading, loadOlderMessages]);

  // Group messages for rendering
  const groupedMessages = groupMessagesByDate();

  return (
    <div className="flex-1 overflow-hidden messages-container">
      <ScrollArea
        ref={scrollAreaRef}
        className="h-full w-full p-4 md:p-6 pb-0 md:pb-0"
      >
        {/* Loading indicator for older messages */}
        {hasMore && (
          <div
            ref={topObserverRef}
            className="flex justify-center items-center py-4"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2 text-orange-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading older messages...</span>
              </div>
            ) : (
              <div className="text-xs text-gray-500">
                Scroll to load more messages
              </div>
            )}
          </div>
        )}

        {/* Empty state when no messages */}
        {!isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 p-8">
              <p className="mb-2 text-lg font-medium">No messages yet</p>
              <p className="text-sm">
                Send a message to start the conversation!
              </p>
            </div>
          </div>
        )}

        {/* Initial loading state */}
        {isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-orange-600" />
              <p>Loading conversation...</p>
            </div>
          </div>
        )}

        {/* Grouped messages by date */}
        <AnimatePresence>
          {groupedMessages.map(({ date, messages: dateMessages }) => (
            <motion.div
              key={date}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <ChatDateDivider date={date} />

              {dateMessages.map((message, index) => (
                <ChatMessage
                  key={message.id || `temp-${message.tempId}`}
                  message={message}
                  isCurrentUser={message.senderId === user?.id}
                  showAvatar={
                    index === 0 ||
                    dateMessages[index - 1]?.senderId !== message.senderId ||
                    // Show avatar if more than 5 minutes have passed since last message from same user
                    (dateMessages[index - 1]?.senderId === message.senderId &&
                      new Date(message.createdAt) -
                        new Date(dateMessages[index - 1]?.createdAt) >
                        5 * 60 * 1000)
                  }
                  isSequential={
                    index > 0 &&
                    dateMessages[index - 1]?.senderId === message.senderId &&
                    new Date(message.createdAt) -
                      new Date(dateMessages[index - 1]?.createdAt) <=
                      5 * 60 * 1000
                  }
                  user={user}
                  partner={partner}
                />
              ))}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Ref for scrolling to the most recent message */}
        <div ref={messagesEndRef} />
      </ScrollArea>
    </div>
  );
};

export default ChatMessagesList;
