import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatMessage from './ChatMessage';

/**
 * ChatMessagesList component displays a list of chat messages
 * @param {Array} messages - Array of message objects to display
 * @param {number} currentUserId - Current user's ID to differentiate sent vs received messages
 * @param {Function} onRetryMessage - Function to retry sending a failed message
 */
const ChatMessagesList = ({ 
  messages, 
  currentUserId,
  onRetryMessage
}) => {
  return (
    <div className="w-full h-full py-4">
      {/* Messages list */}
      <div className="space-y-2">
        {messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" }}
            className="flex flex-col items-center justify-center py-12 text-primary-foreground/70"
          >
            <motion.div 
              animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 5 }}
              className="mb-4"
            >
              <MessageSquare className="h-16 w-16 opacity-40" />
            </motion.div>
            <p className="text-xl font-medium mb-2">No messages yet</p>
            <p className="text-base opacity-80">Start a conversation!</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {messages.map((message) => (
              <div key={message.id} className="relative group">
                <ChatMessage
                  message={message}
                  isCurrentUser={message.senderId === currentUserId}
                />
                
                {/* Message status indicators */}
                {message.senderId === currentUserId && (
                  <div className="absolute -bottom-4 right-2 flex items-center space-x-1 text-xs">
                    {message.isPending && (
                      <span className="text-muted-foreground italic flex items-center gap-1">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        >
                          <Loader2 className="h-3 w-3" />
                        </motion.div>
                        Sending...
                      </span>
                    )}
                    
                    {message.isError && (
                      <span className="text-destructive flex items-center gap-1 cursor-pointer" 
                            onClick={() => onRetryMessage && onRetryMessage(message.id)}>
                        <AlertCircle className="h-3 w-3" />
                        Failed
                        <RefreshCw className="h-3 w-3 ml-1 hover:text-primary transition-colors" />
                      </span>
                    )}
                    
                    {message.isRead && (
                      <span className="text-primary text-xs">Read</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ChatMessagesList;