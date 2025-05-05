import React, { useState, useEffect, useRef } from 'react';
import { useWebSocketContext } from '@/components/chat/WebSocketContextProvider';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const GroupChatMessages = ({ groupId, onSendMessage, currentUserId }) => {
  const messagesEndRef = useRef(null);
  const [message, setMessage] = useState('');
  const [localMessages, setLocalMessages] = useState([]);
  const [sending, setSending] = useState(false);
  
  const { 
    groupMessages, 
    markGroupMessagesAsRead, 
    getGroupMessageHistory 
  } = useWebSocketContext();

  // Get messages for the current group
  const messages = groupMessages[groupId] || [];
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Mark messages as read when the component mounts or groupId changes
  useEffect(() => {
    if (groupId) {
      markGroupMessagesAsRead(groupId);
    }
  }, [groupId, markGroupMessagesAsRead]);
  
  // Load message history when groupId changes
  useEffect(() => {
    if (groupId) {
      getGroupMessageHistory(groupId);
    }
  }, [groupId, getGroupMessageHistory]);
  
  // Handle input form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setSending(true);
    
    // Add the message to local messages immediately
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: message.trim(),
      senderId: currentUserId,
      groupId,
      tempId: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isTemp: true
    };
    
    setLocalMessages(prev => [...prev, tempMessage]);
    
    // Send the message through WebSocket
    if (onSendMessage(message.trim())) {
      setMessage('');
    }
    
    setSending(false);
  };

  // Group messages by date for separation by day
  const groupedMessages = () => {
    // Combine real messages with local pending messages
    const allMessages = [...messages, ...localMessages.filter(localMsg => 
      !messages.some(msg => 
        (msg.tempId && msg.tempId === localMsg.tempId) || 
        msg.id === localMsg.id
      )
    )];
    
    // Sort all messages by date
    allMessages.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.timestamp || Date.now());
      const dateB = new Date(b.createdAt || b.timestamp || Date.now());
      return dateA - dateB;
    });
    
    // Group by date
    const grouped = {};
    
    allMessages.forEach(msg => {
      const date = new Date(msg.createdAt || msg.timestamp || Date.now());
      const dateStr = format(date, 'yyyy-MM-dd');
      
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      
      grouped[dateStr].push(msg);
    });
    
    return grouped;
  };

  // Format date label
  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    } else if (dateStr === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    } 
    
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  // Render messages grouped by sender
  const renderMessageGroups = (messagesForDay) => {
    const groups = [];
    let currentGroup = [];
    let currentSenderId = null;
    
    messagesForDay.forEach((msg, index) => {
      // If sender changed or more than 3 minutes passed, start a new group
      const shouldStartNewGroup = 
        msg.senderId !== currentSenderId || 
        (index > 0 && 
          (new Date(msg.createdAt || msg.timestamp) - 
           new Date(messagesForDay[index - 1].createdAt || messagesForDay[index - 1].timestamp)) > 3 * 60 * 1000);
      
      if (shouldStartNewGroup && currentGroup.length > 0) {
        groups.push({
          senderId: currentSenderId,
          messages: [...currentGroup]
        });
        currentGroup = [];
      }
      
      currentSenderId = msg.senderId;
      currentGroup.push(msg);
      
      // Add the last group
      if (index === messagesForDay.length - 1 && currentGroup.length > 0) {
        groups.push({
          senderId: currentSenderId,
          messages: [...currentGroup]
        });
      }
    });
    
    return groups.map((group, groupIndex) => {
      const isCurrentUser = group.senderId === currentUserId;
      const firstMessage = group.messages[0];
      
      return (
        <div 
          key={`group-${groupIndex}`} 
          className={cn(
            'flex mb-4',
            isCurrentUser ? 'justify-end' : 'justify-start'
          )}
        >
          {!isCurrentUser && (
            <Avatar className="h-8 w-8 mr-2 mt-1">
              {firstMessage.senderPhotoURL ? (
                <AvatarImage src={firstMessage.senderPhotoURL} alt={firstMessage.senderName} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {firstMessage.senderName?.substring(0, 2) || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
          )}
          
          <div className={cn(
            'flex max-w-[80%] flex-col',
            isCurrentUser ? 'items-end' : 'items-start'
          )}>
            {!isCurrentUser && (
              <span className="text-xs text-gray-500 mb-1 ml-1">
                {firstMessage.senderName}
              </span>
            )}
            
            <div className="flex flex-col">
              {group.messages.map((msg, msgIndex) => {
                const isTemp = msg.isTemp;
                const isPending = msg.tempId && !msg.id;
                const isDelivered = msg.tempId && msg.id;
                const isRead = msg.readBy && msg.readBy.length > 0;
                
                return (
                  <div 
                    key={msg.id || msg.tempId} 
                    className={cn(
                      'px-3 py-2 rounded-lg relative',
                      msgIndex === 0 && (isCurrentUser ? 'rounded-tr-none' : 'rounded-tl-none'),
                      msgIndex === group.messages.length - 1 ? 'mb-1' : 'mb-1',
                      isCurrentUser ? 'bg-primary text-white' : 'bg-gray-100',
                      isTemp && 'opacity-70'
                    )}
                  >
                    <div className="relative">
                      {msg.content}
                      <div className="text-xs pt-1 flex justify-end">
                        <span className={cn(
                          'inline-block',
                          isCurrentUser ? 'text-primary-foreground/70' : 'text-gray-500'
                        )}>
                          {format(new Date(msg.createdAt || msg.timestamp), 'h:mm a')}
                        </span>
                        
                        {isCurrentUser && (
                          <span className="ml-1">
                            {isPending && (
                              <Loader2 className="inline-block h-3 w-3 animate-spin" />
                            )}
                            {isDelivered && !isRead && (
                              <span className="opacity-70">✓</span>
                            )}
                            {isRead && (
                              <span className="opacity-70">✓✓</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {Object.keys(groupedMessages()).length > 0 ? (
          <>
            {Object.entries(groupedMessages()).map(([date, messagesForDay]) => (
              <div key={date}>
                <div className="flex justify-center mb-4">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
                    {getDateLabel(date)}
                  </span>
                </div>
                {renderMessageGroups(messagesForDay)}
              </div>
            ))}
          </>
        ) : (
          <div className="h-full flex flex-col justify-center items-center">
            <div className="text-center p-6 max-w-md">
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
              <p className="text-muted-foreground mb-4">
                Start the conversation by sending the first message to this group.
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex items-center">
          <Input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            className="flex-1 mr-2"
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || sending}
            size="icon"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default GroupChatMessages;