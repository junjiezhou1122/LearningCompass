import React from "react";
import { motion } from "framer-motion";
import { Phone, Video, Info, ArrowLeft, Wifi, WifiOff } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSocketIO } from "./SocketIOProvider";

const ChatConversationHeader = ({ activeChat, onBack }) => {
  // Get connection state from context
  const { connectionState } = useSocketIO();
  const isOnline = connectionState === "connected";
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-16 border-b border-orange-200 flex items-center justify-between px-5 py-2 bg-gradient-to-r from-orange-50 via-orange-100 to-orange-50 shadow-sm"
    >
      <div className="flex items-center">
        <div className="relative mr-3">
          <Avatar className="h-10 w-10 border-2 border-orange-200 shadow-md">
            <AvatarFallback className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold">
              {activeChat?.username?.substring(0, 2) || "U"}
            </AvatarFallback>
          </Avatar>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            } border-2 border-white shadow-sm`}
          ></motion.span>
        </div>
        <div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center"
          >
            <h2 className="text-base font-semibold text-orange-800">
              {activeChat?.username || "User"}
            </h2>
            <Badge
              className={`ml-2 ${
                isOnline
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-gray-100 text-gray-700 border-gray-200"
              } text-xs py-0 px-1.5 border`}
            >
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`text-xs ${
              isOnline ? "text-green-500" : "text-orange-500"
            }`}
          >
            {isOnline ? "Active now" : "Last active recently"}
          </motion.p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center space-x-2"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-orange-600 hover:bg-orange-200/70 rounded-full transition-all duration-200 shadow-sm"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
              <p>Voice call</p>
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
                  className="h-9 w-9 text-orange-600 hover:bg-orange-200/70 rounded-full transition-all duration-200 shadow-sm"
                >
                  <Video className="h-4 w-4" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
              <p>Video call</p>
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
                  className="h-9 w-9 text-orange-600 hover:bg-orange-200/70 rounded-full transition-all duration-200 shadow-sm"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="bg-orange-50 border-orange-200 text-orange-700">
              <p>Info</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    </motion.div>
  );
};

export default ChatConversationHeader;
