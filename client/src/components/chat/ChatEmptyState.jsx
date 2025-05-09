import React from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  PlusCircle,
  WifiOff,
  Loader2,
  AlertTriangle,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocketIO } from "./SocketIOProvider";

const ChatEmptyState = ({ onNewMessage }) => {
  // Get connection state directly from context
  const { connected, connectionState, reconnectAttempt } = useSocketIO();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col items-center justify-center p-8 text-center empty-state-container bg-gradient-to-b from-white to-orange-50"
    >
      <div className="max-w-md">
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, 0, -5, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 5,
            ease: "easeInOut",
          }}
          className="mb-8 bg-gradient-to-r from-orange-100 to-orange-200 h-28 w-28 rounded-full flex items-center justify-center mx-auto shadow-lg"
        >
          <MessageSquare className="h-14 w-14 text-orange-500" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold mb-3 text-orange-800"
        >
          Your Messages
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-orange-600 mb-8 text-base leading-relaxed"
        >
          Send private messages to friends and colleagues. Select a conversation
          from the sidebar or start a new one.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={onNewMessage}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-6 rounded-full shadow-md h-11"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </motion.div>
      </div>

      {connectionState !== "connected" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 p-4 bg-orange-100/70 text-orange-700 rounded-xl flex items-center shadow-md max-w-md"
        >
          <motion.div
            animate={
              connectionState === "reconnecting" ||
              connectionState === "connecting"
                ? { rotate: 360 }
                : connectionState === "unstable"
                ? { opacity: [0.4, 1, 0.4] }
                : {}
            }
            transition={{
              repeat: Infinity,
              duration: connectionState === "unstable" ? 1.5 : 2,
            }}
            className="mr-3 text-orange-600"
          >
            {connectionState === "connecting" && (
              <Loader2 className="h-5 w-5" />
            )}
            {connectionState === "reconnecting" && (
              <Loader2 className="h-5 w-5" />
            )}
            {connectionState === "disconnected" && (
              <WifiOff className="h-5 w-5" />
            )}
            {connectionState === "error" && (
              <AlertTriangle className="h-5 w-5" />
            )}
            {connectionState === "unstable" && (
              <Wifi className="h-5 w-5 opacity-70" />
            )}
          </motion.div>
          <p className="text-sm font-medium">
            {connectionState === "connecting" && "Connecting to chat server..."}
            {connectionState === "reconnecting" &&
              `Reconnecting to chat server... (Attempt ${reconnectAttempt})`}
            {connectionState === "disconnected" &&
              "Connection to chat server lost. We'll try to reconnect soon..."}
            {connectionState === "error" &&
              "Unable to connect to chat server. Please check your network connection."}
            {connectionState === "unstable" &&
              "Connection is unstable. Some messages may be delayed."}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ChatEmptyState;
