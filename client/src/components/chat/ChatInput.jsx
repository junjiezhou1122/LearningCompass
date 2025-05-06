import React from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Image, Paperclip, Smile, Mic, Send, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  isPolling = false, 
  connectionState = 'disconnected'
}) => {
  // Enhanced connection status details
  const statusInfo = {
    'connected': { color: 'text-green-500', message: 'Connection is stable', icon: Wifi },
    'connecting': { color: 'text-amber-500', message: 'Connecting...', icon: Loader2 },
    'disconnected': { color: 'text-red-500', message: 'Connection lost. Messages will be queued.', icon: WifiOff },
    'reconnecting': { color: 'text-amber-500', message: 'Reconnecting...', icon: Loader2 },
    'error': { color: 'text-red-600', message: 'Connection error. Please check your network.', icon: WifiOff },
    'polling': { color: 'text-blue-500', message: 'Using polling fallback', icon: Loader2 }
  };
  
  // If we're polling, show polling status instead
  const effectiveState = isPolling ? 'polling' : connectionState;
  const status = statusInfo[effectiveState] || statusInfo.disconnected;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring" }}
      className="px-4 py-3 bg-gradient-to-r from-orange-50 via-orange-100/50 to-orange-50 border-t border-orange-200"
    >
      <motion.div 
        whileHover={{ 
          y: -2, 
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" 
        }}
        className="flex items-end bg-white rounded-2xl px-3 py-2.5 border border-orange-200 shadow-sm transition-all duration-200"
      >
        {/* Connection status indicator */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mr-2">
                <motion.div 
                  animate={{ 
                    scale: effectiveState === 'connecting' || effectiveState === 'reconnecting' || effectiveState === 'polling' 
                      ? [1, 1.2, 1] : 1,
                    rotate: effectiveState === 'polling' ? [0, 360] : 0
                  }}
                  transition={{ 
                    repeat: effectiveState === 'connecting' || effectiveState === 'reconnecting' || effectiveState === 'polling' 
                      ? Infinity : 0, 
                    duration: 1.5 
                  }}
                  className={`h-4 w-4 ${status.color} flex-shrink-0`}
                >
                  <status.icon size={16} />
                </motion.div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-white border border-orange-200 text-gray-800 text-xs">
              <p>{status.message}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
          
        {/* Left action buttons */}
        <div className="flex space-x-2 mr-2">
          <motion.div 
            whileHover={{ rotate: 15 }} 
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-orange-500 hover:bg-orange-100/70 rounded-full p-0 transition-colors duration-200"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div 
            whileHover={{ rotate: 15 }} 
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-orange-500 hover:bg-orange-100/70 rounded-full p-0 transition-colors duration-200"
              disabled={disabled}
            >
              <Image className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div 
            whileHover={{ rotate: 15 }} 
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-orange-500 hover:bg-orange-100/70 rounded-full p-0 transition-colors duration-200"
              disabled={disabled}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
        
        {/* Text input */}
        <Input
          value={value}
          onChange={onChange}
          onKeyDown={onKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 border-0 bg-transparent text-gray-800 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-orange-300 text-sm"
        />
        
        {/* Right action buttons */}
        <div className="flex space-x-2 ml-2">
          <motion.div 
            whileHover={{ rotate: 15 }} 
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-orange-500 hover:bg-orange-100/70 rounded-full p-0 transition-colors duration-200"
              disabled={disabled}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div 
            whileHover={{ rotate: 15 }} 
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-orange-500 hover:bg-orange-100/70 rounded-full p-0 transition-colors duration-200"
              disabled={disabled}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              onClick={onSend}
              disabled={!value?.trim() || disabled}
              className={`bg-gradient-to-r ${effectiveState !== 'connected' ? 'from-orange-400 to-orange-500 opacity-80' : 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'} text-white rounded-full h-9 w-9 flex items-center justify-center p-0 shadow-md transition-all duration-200`}
              title={effectiveState !== 'connected' ? `Message will be queued (${status.message})` : 'Send message'}
            >
              <Send className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChatInput;