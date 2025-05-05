import React from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { MessageSquare, Clock, Check, CheckCheck, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ChatMessage = ({ message, isCurrentUser }) => {
  // Handle temporary messages that may have a string ID instead of a number
  // Use a try-catch to handle any potential issues with date formatting
  let formattedTime = "";
  let formattedDate = "";
  
  try {
    formattedTime = format(new Date(message.createdAt), "h:mm a");
    formattedDate = format(new Date(message.createdAt), "MMMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    formattedTime = "Just now";
    formattedDate = "Today";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring" }}
      className={`relative flex items-start mb-4 py-2 px-3 group hover:bg-orange-50/60 rounded-lg ${
        isCurrentUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* Avatar for other user's messages */}
      {!isCurrentUser && (
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 mr-3 mt-1"
        >
          <Avatar className="h-9 w-9 border border-orange-200 shadow-md">
            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-500 text-white text-xs font-medium">
              {message.sender?.username?.substring(0, 2) || "U"}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}

      {/* Message content with different styling based on sender */}
      <motion.div 
        className={`max-w-[75%]`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Sender name and time for other user's messages */}
        {!isCurrentUser && (
          <div className="flex items-center mb-1.5">
            <span className="text-sm font-medium text-orange-700 hover:underline cursor-pointer">
              {message.sender?.username || "User"}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-orange-400 ml-2 cursor-default">
                    {formattedTime}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
                  <p>{formattedDate}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Message bubble with different styling based on sender, pending, and failure status */}
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm backdrop-blur-sm ${
            isCurrentUser
              ? message.isFailed
                  ? "bg-gradient-to-r from-red-400 to-red-500 text-white"
                  : message.isPending
                      ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white opacity-80"
                      : "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
              : "bg-gradient-to-tr from-orange-50 to-orange-100 text-orange-800 border border-orange-100"
          } ${isCurrentUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
        >
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
          {message.isFailed && (
            <p className="text-xs text-red-100 italic mt-1">
              Failed to send: {message.error || "Unknown error"}
            </p>
          )}
        </div>
        
        {/* Time, pending, and read status for current user's messages */}
        {isCurrentUser && (
          <div className="text-xs text-orange-400 mt-1.5 text-right mr-1 flex items-center justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default">{formattedTime}</span>
                </TooltipTrigger>
                <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
                  <p>{formattedDate}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Message status indicators */}
            {message.isPending && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-1.5 text-orange-400 flex items-center"
              >
                <Clock className="h-3 w-3 mr-1 animate-pulse" /> 
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>Sending</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700 text-xs">
                      <p>Message is being sent</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.span>
            )}
            
            {/* Failed message indicator with retry option */}
            {message.isFailed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-1.5 text-red-500 flex items-center"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center cursor-pointer" onClick={() => message.onRetry && message.onRetry(message)}>
                        <XCircle className="h-3 w-3 mr-1" /> 
                        <span className="group-hover:underline">Retry</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-red-50 border-red-200 text-red-700 text-xs">
                      <p>{message.error || "Failed to send message"}<br/>Click to retry</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.span>
            )}
            
            {/* Sent but not read indicator */}
            {!message.isPending && !message.isRead && !message.isFailed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-1.5 text-orange-400 flex items-center"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center">
                        <Check className="h-3 w-3 mr-1" /> Sent
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700 text-xs">
                      <p>Delivered but not yet read</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.span>
            )}
            
            {/* Read indicator */}
            {message.isRead && !message.isPending && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-1.5 text-orange-500 flex items-center"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center">
                        <CheckCheck className="h-3 w-3 mr-1" /> Read
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700 text-xs">
                      <p>Message has been read</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.span>
            )}
          </div>
        )}
      </motion.div>

      {/* Avatar for current user's messages */}
      {isCurrentUser && (
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 ml-3 mt-1"
        >
          <Avatar className="h-9 w-9 border border-orange-200 shadow-md">
            <AvatarFallback className="bg-gradient-to-br from-orange-600 to-orange-700 text-white text-xs font-medium">
              {message.sender?.username?.substring(0, 2) || "U"}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}

      {/* Message actions that appear on hover */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 group-hover:scale-100">
        <div className="flex space-x-1 bg-white/90 backdrop-blur-sm rounded-md border border-orange-200 shadow-sm p-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-orange-500 hover:bg-orange-50 rounded-full transition-colors duration-200"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
                <p>Reply</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;