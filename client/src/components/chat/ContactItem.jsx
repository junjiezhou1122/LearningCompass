import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * ContactItem component displays a single contact in the chat sidebar
 */
const ContactItem = ({ contact, isActive, onClick, showUnread = true }) => {
  const hasUnread = contact.unreadCount > 0 && showUnread;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center p-2 rounded-lg cursor-pointer transition-colors",
        isActive 
          ? "bg-gradient-to-r from-orange-100 to-orange-50 border-l-4 border-orange-500" 
          : "hover:bg-orange-50"
      )}
      onClick={() => onClick(contact)}
    >
      <div className="relative">
        <Avatar className="h-10 w-10 border border-orange-200">
          {contact.photoURL ? (
            <AvatarImage src={contact.photoURL} alt={contact.username || 'User'} />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-white">
              {(contact.username || 'U').substring(0, 2)}
            </AvatarFallback>
          )}
        </Avatar>
        
        {/* Online status indicator */}
        {contact.online && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
        )}
      </div>
      
      <div className="ml-3 flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <p className={cn(
            "text-sm font-medium truncate",
            isActive ? "text-orange-900" : "text-gray-900"
          )}>
            {contact.username || contact.name || 'User'}
          </p>
          
          {/* Unread message count */}
          {hasUnread && (
            <Badge 
              variant="destructive" 
              className="ml-2 h-5 min-w-[1.25rem] flex items-center justify-center bg-orange-500 hover:bg-orange-600"
            >
              {contact.unreadCount}
            </Badge>
          )}
        </div>
        
        {/* Last message preview */}
        {contact.lastMessage && (
          <p className="text-xs text-gray-500 truncate">
            {contact.lastMessage.length > 30
              ? `${contact.lastMessage.substring(0, 30)}...`
              : contact.lastMessage}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ContactItem;