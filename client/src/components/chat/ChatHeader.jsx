import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ChatHeader = ({ isMobileSidebarOpen, setIsMobileSidebarOpen }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-12 border-b border-orange-200 flex items-center justify-between px-4 z-10 bg-gradient-to-r from-orange-50 via-orange-100 to-orange-50 text-orange-800 shadow-sm backdrop-blur-sm"
    >
      <div className="flex items-center">
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-base font-semibold text-orange-800 flex items-center"
        >
          <MessageSquare className="h-5 w-5 mr-2 text-orange-600" /> 
          Messages
        </motion.h1>
      </div>
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-orange-700 hover:bg-orange-200/70 h-8 w-8 rounded-full transition-all duration-200 shadow-sm"
                >
                  <Bell className="h-4 w-4" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-orange-700 hover:bg-orange-200/70 h-8 w-8 rounded-full transition-all duration-200 shadow-sm"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  );
};

export default ChatHeader;