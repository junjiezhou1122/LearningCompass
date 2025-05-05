import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * EmptyState component displayed when no chat is selected
 */
const EmptyState = ({ onStartChat, hasMutualFollowers }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-4">
        <MessageSquare className="h-10 w-10 text-orange-500" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        No conversation selected
      </h3>
      
      <p className="text-gray-500 max-w-md mb-6">
        {hasMutualFollowers
          ? "Select a contact from the sidebar to start chatting, or find someone new to connect with."
          : "You need to follow users and have them follow you back before you can start a conversation."}
      </p>
      
      {hasMutualFollowers ? (
        <Button 
          onClick={onStartChat}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          Start a conversation
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button 
          onClick={onStartChat}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          Find users to follow
          <Users className="ml-2 h-4 w-4" />
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;