import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * MessageInput component for typing and sending messages
 */
const MessageInput = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
}) => {
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    // Send message on Enter (not with Shift key)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t bg-white p-3 sticky bottom-0"
    >
      <div className="flex items-center bg-gray-50 rounded-lg border p-1">
        <input
          type="text"
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-grow px-3 py-2 bg-transparent outline-none text-gray-800 placeholder-gray-400"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || disabled}
          variant="ghost"
          className={`rounded-full ${
            !message.trim() || disabled ? "text-gray-400" : "text-blue-600"
          }`}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {disabled && (
        <div className="text-center text-xs text-red-500 mt-1">
          You are currently disconnected. Reconnect to send messages.
        </div>
      )}
    </form>
  );
};

export default MessageInput;
