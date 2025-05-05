import React from 'react';
import { motion } from 'framer-motion';
import { Bell, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '../../contexts/AuthContext';

const EnhancedChatHeader = () => {
  const { user, logout } = useAuth();

  return (
    <div className="h-16 border-b border-orange-200 bg-gradient-to-r from-orange-50 via-white to-orange-50 shadow-sm px-4 flex items-center justify-between">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center"
      >
        <h1 className="text-xl font-bold text-orange-800">Messages</h1>
      </motion.div>

      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <motion.div 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
          >
            <Bell className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </motion.div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer"
            >
              <Avatar className="h-10 w-10 border-2 border-orange-200 shadow-sm">
                {user?.photoURL ? (
                  <AvatarImage src={user.photoURL} alt={user.username} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                    {user?.username?.substring(0, 2) || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
            </motion.div>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56 mt-1 border-orange-200">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-orange-800">{user?.username}</p>
                <p className="text-xs leading-none text-orange-500">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default EnhancedChatHeader;