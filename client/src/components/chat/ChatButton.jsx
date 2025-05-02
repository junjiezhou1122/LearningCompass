import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import ChatInterface from './ChatInterface';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from 'framer-motion';

const ChatButton = ({ otherUser }) => {
  const { user, token } = useAuth();
  const [canChat, setCanChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if these users can chat with each other
    const checkChatEligibility = async () => {
      if (!user || !token || !otherUser) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/chat/can-chat/${otherUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCanChat(data.canChat);
        } else {
          console.error('Error checking chat eligibility:', await response.text());
          setCanChat(false);
        }
      } catch (error) {
        console.error('Error checking chat eligibility:', error);
        setCanChat(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkChatEligibility();
  }, [user, token, otherUser]);
  
  const handleOpenChange = (open) => {
    setIsOpen(open);
  };
  
  // State for unread messages count
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    // Fetch actual unread message count from API
    if (canChat && !loading && user && token) {
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch(`/api/chat/unread-count?otherUserId=${otherUser.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUnreadCount(data.count || 0);
          }
        } catch (error) {
          console.error('Error fetching unread messages:', error);
        }
      };
      
      fetchUnreadCount();
      
      // Set up interval to check for new messages every 15 seconds
      const intervalId = setInterval(fetchUnreadCount, 15000);
      
      return () => clearInterval(intervalId);
    }
  }, [canChat, loading, user, token, otherUser?.id]);
  
  if (loading) {
    return (
      <Button disabled variant="outline" className="ml-2">
        <div className="animate-pulse flex items-center">
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>Chat</span>
        </div>
      </Button>
    );
  }
  
  if (!canChat) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              className="ml-2 hover:border-purple-300 hover:bg-purple-50"
              onClick={() => {
                toast({
                  title: "Cannot chat",
                  description: "You can only chat with users who you follow and who follow you back.",
                  variant: "default"
                });
              }}
            >
              <MessageSquare className="mr-2 h-4 w-4 text-purple-300" />
              <span>Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Follow each other to enable chat</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-2 relative hover:border-purple-300 hover:bg-purple-50">
          <MessageSquare className="mr-2 h-4 w-4 text-purple-500" />
          <span>Chat</span>
          
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -right-2"
              >
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full shadow-sm">
                  {unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] p-0 h-[650px]">
        <ChatInterface otherUser={otherUser} onClose={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default ChatButton;