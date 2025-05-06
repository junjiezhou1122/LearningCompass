import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatMessage from './ChatMessage';
import MessageStatusIndicator from './MessageStatusIndicator';
import { useWebSocketContext } from './WebSocketProvider';

/**
 * ChatMessagesList component displays a list of chat messages
 * with enhanced error handling and retry capabilities
 * 
 * @param {Array} messages - Array of message objects to display
 * @param {number} currentUserId - Current user's ID to differentiate sent vs received messages
 * @param {Function} onRetryMessage - Function to retry sending a failed message
 */
const ChatMessagesList = ({ 
  messages, 
  currentUserId,
  onRetryMessage
}) => {
  // Get WebSocket context for connection status checks and direct retry access
  const wsContext = useWebSocketContext();
  
  // Enhanced retry handler that works with context or callback
  const handleRetry = useCallback((messageId) => {
    // First try the provided callback
    if (onRetryMessage) {
      onRetryMessage(messageId);
    }
    // If no callback or it fails, dispatch a custom retry event that WebSocketProvider will handle
    else {
      const retryEvent = new CustomEvent('chat:message:retry', { 
        detail: { messageId }
      });
      window.dispatchEvent(retryEvent);
    }
  }, [onRetryMessage]);
  
  // Determine connection warning state for error messages
  const connectionState = wsContext?.connectionState || 'unknown';
  const isDisconnected = connectionState !== 'connected';
  
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
                
                {/* Enhanced message status indicators with error context */}
                {message.senderId === currentUserId && (
                  <div className="absolute -bottom-4 right-2 flex items-center space-x-1 text-xs">
                    {message.isPending && (
                      <MessageStatusIndicator 
                        status="sending" 
                        message={message}
                      />
                    )}
                    
                    {message.isRetrying && (
                      <MessageStatusIndicator 
                        status="retrying" 
                        message={message}
                      />
                    )}
                    
                    {message.isError && (
                      <MessageStatusIndicator 
                        status={isDisconnected ? "network_error" : "failed"}
                        onRetry={() => handleRetry(message.id || message.tempId)}
                        message={message}
                        errorMessage={message.error || (isDisconnected ? "Connection lost" : null)}
                      />
                    )}
                    
                    {message.isDelivered && !message.isRead && (
                      <MessageStatusIndicator 
                        status="delivered" 
                        message={message}
                      />
                    )}
                    
                    {message.isRead && (
                      <MessageStatusIndicator 
                        status="read" 
                        message={message}
                      />
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