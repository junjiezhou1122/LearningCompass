import React from 'react';
import { motion } from 'framer-motion';
import { Search, PlusCircle, Hash } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Chat contact component
const ChatContact = ({ user, isActive, isOnline, unreadCount, onClick }) => {
  return (
    <motion.div
      whileHover={{ x: 3, scale: 1.02 }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`flex items-center py-2.5 px-3 rounded-xl mb-2 cursor-pointer ${isActive 
        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md" 
        : "text-orange-800 hover:bg-orange-100/70 hover:text-orange-900 shadow-sm"} 
        border border-orange-100 transition-all duration-200`}
      onClick={onClick}
    >
      <div className="relative mr-3">
        <Avatar className="h-10 w-10 border border-orange-100 shadow-md">
          <AvatarFallback
            className={`${
              isActive
                ? "bg-gradient-to-r from-orange-600 to-orange-700 text-white"
                : "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800"
            } text-sm font-medium`}
          >
            {user.username?.substring(0, 2) || "U"}
          </AvatarFallback>
        </Avatar>
        {isOnline ? (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-sm"
          ></motion.span>
        ) : (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-gray-400 border-2 border-white shadow-sm"
          ></motion.span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-orange-800"}`}>
            {user.username}
          </span>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
            >
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-orange-500 text-white border-0 shadow-md">
                {unreadCount}
              </Badge>
            </motion.div>
          )}
        </div>
        <p className={`text-xs truncate mt-0.5 ${isActive ? "text-orange-100" : "text-orange-500"}`}>
          {isOnline ? "Online" : "Offline"}
        </p>
      </div>
    </motion.div>
  );
};

// Channel component
const Channel = ({ name, isActive, unreadCount, onClick }) => {
  return (
    <motion.div
      whileHover={{ x: 3, scale: 1.02 }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`flex items-center py-2.5 px-3 rounded-xl mb-2 cursor-pointer shadow-sm transition-all duration-200 ${
        isActive
          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
          : "text-orange-800 hover:bg-orange-100 hover:text-orange-900"
      }`}
      onClick={onClick}
    >
      <div className={`mr-2.5 ${isActive ? "text-white" : "text-orange-500"}`}>
        <Hash className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium truncate">{name}</span>
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="ml-auto"
        >
          <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-orange-500 text-white border-0 shadow-md">
            {unreadCount}
          </Badge>
        </motion.div>
      )}
    </motion.div>
  );
};

const ChatSidebar = ({ 
  isMobileSidebarOpen, 
  setActiveChat,
  activeChat,
  chatPartners,
  isPartnersLoading
}) => {
  return (
    <motion.div
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`w-80 bg-gradient-to-b from-orange-50 to-white border-r border-orange-200 flex flex-col backdrop-blur-sm ${
        isMobileSidebarOpen ? "block" : "hidden"
      } lg:block overflow-hidden shadow-lg`}
    >
      {/* Search */}
      <div className="p-4 border-b border-orange-200 bg-orange-100/30">
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-orange-500">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 10 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
            >
              <Search className="h-4 w-4" />
            </motion.div>
          </div>
          <Input
            placeholder="Search messages or people"
            className="pl-10 py-2 h-11 bg-white/90 border-orange-200 text-sm rounded-full placeholder:text-orange-300 focus-visible:ring-orange-500 shadow-sm hover:shadow-md transition-shadow duration-200 pr-3" 
          />
        </motion.div>
      </div>

      <ScrollArea className="flex-1 sidebar-scroll-area">
        <div className="p-4">
          {/* Direct Messages section */}
          <div className="mb-6">
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between mb-3 px-1"
            >
              <h3 className="text-sm font-semibold text-orange-700 tracking-wide">
                Direct Messages
              </h3>
              <motion.div 
                whileHover={{ rotate: 90 }} 
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-orange-500 hover:text-orange-700 hover:bg-orange-100 rounded-full transition-all duration-200"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="h-px bg-gradient-to-r from-orange-200 via-orange-300 to-orange-200 mb-3"
            ></motion.div>

            {isPartnersLoading ? (
              <div className="flex justify-center py-4">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full"
                ></motion.div>
              </div>
            ) : chatPartners.length === 0 ? (
              <div className="text-center py-4 text-sm text-orange-600 bg-orange-50/50 rounded-lg shadow-inner px-3">
                No conversations yet
              </div>
            ) : (
              <div className="space-y-2">
                {chatPartners.map((partner) => (
                  <ChatContact
                    key={partner.id}
                    user={partner}
                    isActive={activeChat?.id === partner.id}
                    isOnline={partner.online}
                    unreadCount={partner.unreadCount || 0}
                    onClick={() => setActiveChat(partner)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Channels Section - Optional, can be removed */}
          <div className="mb-6">
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between mb-3 px-1"
            >
              <h3 className="text-sm font-semibold text-orange-700 tracking-wide">
                Channels
              </h3>
              <motion.div 
                whileHover={{ rotate: 90 }} 
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-orange-500 hover:text-orange-700 hover:bg-orange-100 rounded-full transition-all duration-200"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="h-px bg-gradient-to-r from-orange-200 via-orange-300 to-orange-200 mb-3"
            ></motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Channel
                name="general"
                isActive={false}
                unreadCount={0}
                onClick={() => {}}
              />
              <Channel
                name="support"
                isActive={false}
                unreadCount={2}
                onClick={() => {}}
              />
              <Channel
                name="announcements"
                isActive={false}
                unreadCount={0}
                onClick={() => {}}
              />
            </motion.div>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
};

export default ChatSidebar;