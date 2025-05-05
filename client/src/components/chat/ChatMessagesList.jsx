import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';

const ChatMessagesList = ({ 
  scrollAreaRef, 
  isLoadingMore, 
  page, 
  hasMore, 
  loadOlderMessages, 
  messages, 
  user, 
  messagesEndRef 
}) => {
  return (
    <ScrollArea
      ref={scrollAreaRef}
      className="flex-1 overflow-y-auto messages-container bg-gradient-to-b from-white to-orange-50/30"
    >
      {/* Loading indicator */}
      {isLoadingMore && page > 1 && (
        <div className="flex justify-center py-3">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full"
          ></motion.div>
        </div>
      )}

      {/* Load older messages button */}
      {hasMore && !isLoadingMore && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center py-3"
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-orange-600 hover:bg-orange-100 hover:text-orange-700 rounded-full px-4 py-1 shadow-sm transition-all duration-200"
            onClick={loadOlderMessages}
          >
            <motion.div 
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="mr-2"
            >
              ↑
            </motion.div>
            Load older messages
          </Button>
        </motion.div>
      )}

      <div className="flex-1"></div>

      {/* Messages list */}
      <div className="px-4 py-3 space-y-1.5">
        {messages.length === 0 && !isLoadingMore ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" }}
            className="flex flex-col items-center justify-center py-12 text-orange-600"
          >
            <motion.div 
              animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 5 }}
              className="mb-4"
            >
              <MessageSquare className="h-16 w-16 text-orange-300" />
            </motion.div>
            <p className="text-xl font-medium mb-2">No messages yet</p>
            <p className="text-base text-orange-500">Start a conversation!</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-1"
          >
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isCurrentUser={message.senderId === user?.id}
              />
            ))}
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatMessagesList;