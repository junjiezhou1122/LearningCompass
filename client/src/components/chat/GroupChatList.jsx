import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

const GroupChatList = ({ groups, activeGroupId, onSelectGroup, loading }) => {
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    }
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Generate a truncated excerpt of the last message text
  const getMessageExcerpt = (content) => {
    if (!content) return '';
    if (content.length <= 30) return content;
    return `${content.substring(0, 28)}...`;
  };

  // Display loading state
  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((index) => (
            <div key={index} className="flex items-center p-3 rounded-md bg-gray-100">
              <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0"></div>
              <div className="ml-3 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Display empty state
  if (!groups || groups.length === 0) {
    return (
      <div className="p-6 text-center">
        <Users className="h-10 w-10 text-gray-400 mx-auto mb-4" />
        <h3 className="text-base font-medium mb-1">No group chats yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create a new group chat to start messaging with multiple people at once.
        </p>
      </div>
    );
  }

  // Display group list
  return (
    <div className="divide-y">
      {groups.map((group) => {
        const isActive = activeGroupId === group.id;
        const hasUnread = group.unreadCount > 0;
        
        return (
          <div
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            className={cn(
              'flex items-start p-3 hover:bg-gray-50 cursor-pointer transition-colors',
              isActive && 'bg-primary/5 hover:bg-primary/10',
              hasUnread && 'bg-blue-50/50'
            )}
          >
            <Avatar className="h-12 w-12 shrink-0">
              {group.avatarUrl ? (
                <AvatarImage src={group.avatarUrl} alt={group.name} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {group.name?.substring(0, 2) || 'G'}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className={cn(
                  'font-medium text-sm truncate',
                  hasUnread && 'font-semibold text-primary'
                )}>
                  {group.name}
                </h3>
                {group.lastMessageTime && (
                  <span className="text-xs text-gray-500 ml-1 shrink-0">
                    {formatLastMessageTime(group.lastMessageTime)}
                  </span>
                )}
              </div>
              
              {group.memberCount > 0 && (
                <div className="flex items-center text-xs text-gray-500 mt-0.5">
                  <Users className="h-3 w-3 mr-1" />
                  <span>{group.memberCount} members</span>
                </div>
              )}
              
              {group.lastMessage && (
                <p className="text-sm text-gray-600 truncate mt-1">
                  <span className="font-medium">
                    {group.lastMessage.senderName === 'You' 
                      ? 'You' 
                      : group.lastMessage.senderName}
                  </span>
                  {': '}
                  <span className="text-gray-500">
                    {getMessageExcerpt(group.lastMessage.content)}
                  </span>
                </p>
              )}
            </div>
            
            {hasUnread && (
              <Badge 
                variant="primary" 
                className="rounded-full h-5 w-5 flex items-center justify-center p-0 text-xs shrink-0 ml-1"
              >
                {group.unreadCount > 99 ? '99+' : group.unreadCount}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GroupChatList;