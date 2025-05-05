import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/**
 * MessageItem component displays a single chat message with status indicators
 */
const MessageItem = ({ message, isCurrentUser }) => {
  // Format the message timestamp for display
  const formattedTime = message.createdAt ? 
    format(new Date(message.createdAt), 'h:mm a') : 
    format(new Date(), 'h:mm a');
  
  // Get the sender details
  const sender = message.sender || {};
  
  // Determine message status icon
  const StatusIcon = () => {
    if (message.isPending) {
      return <Clock className="h-3 w-3 text-orange-400" />;
    } else if (message.isRead) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    } else {
      return <Check className="h-3 w-3 text-gray-400" />;
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex mb-4 gap-2 max-w-[80%] group",
        isCurrentUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* User avatar */}
      <div className="flex-shrink-0">
        <Avatar className={cn(
          "h-8 w-8 border",
          isCurrentUser ? "border-orange-200" : "border-blue-200"
        )}>
          {sender.photoURL ? (
            <AvatarImage src={sender.photoURL} alt={sender.username || 'User'} />
          ) : (
            <AvatarFallback className={cn(
              isCurrentUser 
                ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white" 
                : "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
            )}>
              {(sender.username || 'U').substring(0, 2)}
            </AvatarFallback>
          )}
        </Avatar>
      </div>
      
      {/* Message content */}
      <div className="flex flex-col max-w-full">
        <div className={cn(
          "rounded-lg px-3 py-2 text-sm break-words",
          isCurrentUser 
            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white" 
            : "bg-white border border-gray-200 text-gray-700 shadow-sm"
        )}>
          {message.content}
        </div>
        
        {/* Message metadata */}
        <div className={cn(
          "flex text-xs mt-1 text-gray-500",
          isCurrentUser ? "justify-end" : "justify-start"
        )}>
          <span className="opacity-70">{formattedTime}</span>
          
          {/* Only show status indicators for current user's messages */}
          {isCurrentUser && (
            <span className="ml-1 flex items-center">
              <StatusIcon />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageItem;