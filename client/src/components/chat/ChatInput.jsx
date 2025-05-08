import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle,
  Image,
  Paperclip,
  Smile,
  Mic,
  Send,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWebSocketContext } from "./WebSocketProvider";
import EmojiPicker from "emoji-picker-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * ChatInput component provides the input area for sending messages
 *
 * @param {string} value Current input value
 * @param {function} onChange Function to handle input changes
 * @param {function} onKeyPress Function to handle key press events
 * @param {function} onSend Function to send the message
 * @param {string} placeholder Placeholder text for the input
 * @param {boolean} disabled Whether the input is disabled
 * @param {boolean} isPolling Whether we're polling for messages (fallback)
 * @param {string} connectionState Current WebSocket connection state
 */
const ChatInput = ({
  value,
  onChange,
  onKeyPress,
  onSend,
  placeholder = "Type a message...",
  disabled = false,
  connectionStatus = "connected",
  isGroupChat = false,
}) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef(null);

  // Auto-grow textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 150); // Max height of 150px
      textarea.style.height = `${newHeight}px`;
    };

    adjustHeight();

    // Add event listener
    textarea.addEventListener("input", adjustHeight);

    // Cleanup
    return () => textarea.removeEventListener("input", adjustHeight);
  }, [message]);

  // Handle keyboard shortcuts (Enter to send)
  const handleKeyDown = (e) => {
    // Send message on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || connectionStatus === "failed") return;

    try {
      setIsSending(true);
      await onSend(trimmedMessage);
      setMessage("");
      // Focus back on textarea after sending
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Get connection status info
  const getConnectionInfo = () => {
    switch (connectionStatus) {
      case "connected":
        return null;
      case "connecting":
      case "reconnecting":
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin text-orange-500" />,
          text: "Connecting...",
          class: "text-orange-500 bg-orange-50",
        };
      case "failed":
        return {
          icon: <WifiOff className="h-4 w-4 text-red-500" />,
          text: "Connection failed",
          class: "text-red-500 bg-red-50",
        };
      case "offline":
        return {
          icon: <WifiOff className="h-4 w-4 text-gray-500" />,
          text: "You are offline",
          class: "text-gray-500 bg-gray-50",
        };
      default:
        return null;
    }
  };

  const connectionInfo = getConnectionInfo();

  return (
    <div className="p-3 border-t border-orange-100 bg-orange-50">
      {/* Connection status bar */}
      {connectionInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-center text-sm p-2 mb-2 rounded-md ${connectionInfo.class}`}
        >
          {connectionInfo.icon}
          <span className="ml-2">{connectionInfo.text}</span>
        </motion.div>
      )}

      <div className="flex items-end gap-2">
        {/* Emoji picker */}
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9 flex-shrink-0 text-orange-600 hover:bg-orange-100"
              title="Add emoji"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-orange-200" side="top">
            <EmojiPicker
              onEmojiClick={handleEmojiSelect}
              searchDisabled
              width={300}
              height={400}
            />
          </PopoverContent>
        </Popover>

        {/* Attachments button - disabled for now */}
        <Button
          variant="ghost"
          size="icon"
          disabled
          className="rounded-full h-9 w-9 flex-shrink-0 text-orange-600 hover:bg-orange-100"
          title="Attach file (coming soon)"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Message input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "Can't send messages right now"
              : connectionStatus === "offline"
              ? "You are offline. Messages will be sent when you reconnect."
              : isGroupChat
              ? "Message group..."
              : placeholder
          }
          disabled={disabled || connectionStatus === "failed"}
          className="min-h-[40px] max-h-[150px] resize-none bg-white border-orange-200 focus:border-orange-500 rounded-lg py-2 px-3 flex-grow"
        />

        {/* Send button */}
        <Button
          onClick={handleSendMessage}
          disabled={
            !message.trim() ||
            disabled ||
            connectionStatus === "failed" ||
            isSending
          }
          className={`rounded-full h-10 w-10 flex-shrink-0 p-0 ${
            message.trim() && !disabled
              ? "bg-orange-600 hover:bg-orange-700 focus:bg-orange-700"
              : "bg-orange-300"
          }`}
          title="Send message"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
