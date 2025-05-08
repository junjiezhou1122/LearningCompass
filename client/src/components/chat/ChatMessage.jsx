import React from "react";
import { format } from "date-fns";
import { Loader2, AlertCircle, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ChatMessage = ({
  message,
  isCurrentUser,
  showAvatar = true,
  isSequential = false,
  user,
  partner,
}) => {
  // Format the timestamp
  const timestamp = message.createdAt
    ? format(new Date(message.createdAt), "h:mm a")
    : "";

  // Determine avatar content
  const getAvatarContent = () => {
    const person = isCurrentUser ? user : partner;
    if (!person) return "";

    // Use first 2 letters of username or name
    return (person.displayName || person.username || "")
      .substring(0, 2)
      .toUpperCase();
  };

  // Determine status icon based on message state
  const StatusIcon = () => {
    if (!isCurrentUser) return null;

    if (message.isPending) {
      return <Loader2 className="h-3 w-3 animate-spin text-gray-400" />;
    } else if (message.isFailed) {
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    } else if (message.isRead) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    } else {
      return <Check className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isSequential && "mb-1",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar for received messages */}
      {!isCurrentUser && showAvatar && (
        <div className="flex-shrink-0 mr-2">
          <Avatar className="h-8 w-8 bg-gray-100">
            <AvatarFallback className="bg-orange-600 text-white text-xs">
              {getAvatarContent()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Avatar placeholder for sequential messages */}
      {!isCurrentUser && !showAvatar && <div className="w-8 mr-2"></div>}

      <div
        className={cn(
          "flex flex-col max-w-[75%] md:max-w-[60%]",
          isSequential && isCurrentUser && "items-end"
        )}
      >
        {/* Message bubble */}
        <div
          className={cn(
            "px-4 py-2 rounded-2xl",
            isCurrentUser
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
              : "bg-white border border-gray-200 text-gray-800",
            isSequential && !isCurrentUser && "rounded-tl-sm",
            isSequential && isCurrentUser && "rounded-tr-sm",
            message.isFailed && "bg-red-100 text-red-800 border border-red-200"
          )}
        >
          {message.content}
        </div>

        {/* Timestamp and status */}
        <div
          className={cn(
            "flex items-center space-x-1 mt-1 text-xs text-gray-500",
            isCurrentUser ? "justify-end" : "justify-start",
            isSequential && "mt-0.5"
          )}
        >
          <span>{timestamp}</span>

          {/* Status indicator for sent messages */}
          {isCurrentUser && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <StatusIcon />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {message.isPending && "Sending..."}
                  {message.isFailed && (message.error || "Failed to send")}
                  {message.isRead && "Read"}
                  {!message.isPending &&
                    !message.isFailed &&
                    !message.isRead &&
                    "Delivered"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Error message for failed messages */}
        {message.isFailed && (
          <div className="text-xs text-red-500 mt-1">
            {message.error || "Message failed to send. Tap to retry."}
          </div>
        )}
      </div>

      {/* Avatar for sent messages */}
      {isCurrentUser && showAvatar && (
        <div className="flex-shrink-0 ml-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-600 text-white text-xs">
              {getAvatarContent()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Avatar placeholder for sequential messages */}
      {isCurrentUser && !showAvatar && <div className="w-8 ml-2"></div>}
    </div>
  );
};

export default ChatMessage;
