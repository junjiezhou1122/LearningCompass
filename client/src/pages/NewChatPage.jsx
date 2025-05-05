import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  SendHorizontal, 
  Users, 
  MessagesSquare, 
  User, 
  Settings,
  Info,
  ChevronDown,
  Loader2,
  XCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';

// Chat Group Item Component
const ChatGroupItem = ({ group, isActive, onClick, unreadCount = 0 }) => {
  return (
    <div
      className={`flex items-center p-3 cursor-pointer transition-colors hover:bg-muted/50 ${isActive ? 'bg-muted' : ''}`}
      onClick={() => onClick(group)}
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{group.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </div>
      <div className="ml-3 flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <p className="font-medium truncate">{group.name}</p>
          {group.lastMessage && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(group.lastMessage.createdAt), { addSuffix: true })}
            </span>
          )}
        </div>
        {group.lastMessage ? (
          <p className="text-sm text-muted-foreground truncate">
            {group.lastMessage.senderName}: {group.lastMessage.content}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No messages yet</p>
        )}
      </div>
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message, isCurrentUser, showAvatar, sender }) => {
  const formattedTime = message.createdAt 
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
    
  // Handle temporary messages (not yet confirmed by server)
  const isTemp = message.isTemp || message.tempId;
  
  return (
    <div className={`flex items-end mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && showAvatar ? (
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={sender?.photoURL} alt={sender?.username} />
          <AvatarFallback>{sender?.username?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
      ) : !isCurrentUser ? (
        <div className="w-8 mr-2" />
      ) : null}
      
      <div className={`max-w-[75%] ${isTemp ? 'opacity-70' : ''}`}>
        {!isCurrentUser && showAvatar && (
          <div className="text-xs text-muted-foreground mb-1 ml-1">
            {sender?.username || 'Unknown user'}
          </div>
        )}
        
        <div className="flex items-end">
          <div
            className={`py-2 px-3 rounded-lg ${isCurrentUser
              ? 'bg-primary text-primary-foreground rounded-br-none'
              : 'bg-muted text-foreground rounded-bl-none'
            }`}
          >
            <p className="text-sm">{message.content}</p>
            <div className="text-xs text-right mt-1 opacity-70">
              {formattedTime}
              {isTemp && (
                <span className="ml-1 inline-flex">
                  <Loader2 className="h-3 w-3 animate-spin" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create Group Dialog
const CreateGroupDialog = ({ isOpen, onClose, onCreate, isLoading }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ name, description });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Create a new chat group for your team or friends.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Group Name</label>
            <Input
              id="name"
              placeholder="Enter group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
            <Input
              id="description"
              placeholder="What's this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Chat Interface Component
const ChatInterface = ({ activeGroup, messages, onSendMessage, currentUser, isLoading, onLoadMore, hasMore }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    onSendMessage(input.trim());
    setInput('');
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);
  
  // Handle scroll events to detect when user scrolls away from bottom
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    setAutoScroll(isAtBottom);
    setShowScrollToBottom(!isAtBottom);
    
    // Load more messages when scrolling to top
    if (scrollTop < 100 && hasMore && !isLoading) {
      onLoadMore();
    }
  };
  
  // Group messages by sender to avoid showing avatar for consecutive messages
  const groupedMessages = messages.reduce((acc, message, index) => {
    const prevMessage = messages[index - 1];
    const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
    
    return [...acc, { ...message, showAvatar }];
  }, []);
  
  return (
    <div className="flex flex-col h-full relative">
      <div className="border-b py-2 px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback>{activeGroup?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium">{activeGroup?.name}</h2>
            <p className="text-xs text-muted-foreground">{activeGroup?.members?.length || 0} members</p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer">
              <Info className="h-4 w-4 mr-2" />
              Group Info
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Users className="h-4 w-4 mr-2" />
              View Members
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Leave Group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <ScrollArea 
        className="flex-1 p-4" 
        onScroll={handleScroll}
        ref={scrollAreaRef}
      >
        {isLoading && hasMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {groupedMessages.map((message) => {
          const isCurrentUser = message.senderId === currentUser?.id;
          return (
            <MessageBubble
              key={message.id || message.tempId}
              message={message}
              isCurrentUser={isCurrentUser}
              showAvatar={message.showAvatar}
              sender={activeGroup?.members?.find(m => m.id === message.senderId)}
            />
          );
        })}
        
        <div ref={messagesEndRef} />
      </ScrollArea>
      
      {showScrollToBottom && (
        <Button
          className="absolute bottom-20 right-4 h-8 w-8 rounded-full shadow-md p-0"
          onClick={() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setAutoScroll(true);
          }}
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      )}
      
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || !activeGroup}>
            <SendHorizontal className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ title, description, icon, actionLabel, onAction }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="bg-muted/30 rounded-full p-6 mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
};

// Connection Error State Component
const ConnectionErrorState = ({ status, error, onRetry }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="bg-destructive/10 rounded-full p-6 mb-6">
        <XCircle className="h-10 w-10 text-destructive" />
      </div>
      <h3 className="text-xl font-medium mb-2">Connection Error</h3>
      <p className="text-muted-foreground text-center max-w-md mb-2">
        {status === 'auth_error' 
          ? 'Authentication failed. Please sign in again.'
          : error || 'Could not connect to the chat service.'}
      </p>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Status: {status}
      </p>
      <Button onClick={onRetry}>Retry Connection</Button>
    </div>
  );
};

// Main Chat Page Component
const NewChatPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('groups');
  const [activeGroup, setActiveGroup] = useState(null);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // WebSocket context
  const {
    connected,
    connectionStatus,
    loading,
    error,
    groups,
    groupMessages,
    getGroupMessageHistory,
    sendGroupMessage,
    markGroupMessagesAsRead,
    createGroup,
    refreshGroups
  } = useWebSocket();
  
  // Loading and error states
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  
  // Handle group selection
  const handleSelectGroup = (group) => {
    setActiveGroup(group);
    if (group && connected) {
      // Mark messages as read when selecting a group
      markGroupMessagesAsRead(group.id)
        .catch(err => {
          console.error('Error marking messages as read:', err);
        });
      
      // Load messages if not already loaded
      if (!groupMessages[group.id]) {
        getGroupMessageHistory(group.id)
          .catch(err => {
            console.error('Error loading messages:', err);
            toast({
              title: 'Error',
              description: 'Failed to load messages.',
              variant: 'destructive'
            });
          });
      }
    }
  };
  
  // Handle send message
  const handleSendMessage = (content) => {
    if (!activeGroup || !connected) return;
    
    sendGroupMessage(activeGroup.id, content)
      .catch(err => {
        console.error('Error sending message:', err);
        toast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive'
        });
      });
  };
  
  // Handle load more messages
  const handleLoadMoreMessages = () => {
    if (!activeGroup || !connected || isLoadingMore || !hasMoreMessages) return;
    
    setIsLoadingMore(true);
    
    // Get the oldest message timestamp
    const messages = groupMessages[activeGroup.id] || [];
    const oldestMessageDate = messages.length > 0 
      ? new Date(messages[0].createdAt) 
      : new Date();
    
    getGroupMessageHistory(activeGroup.id, { before: oldestMessageDate })
      .then(olderMessages => {
        setHasMoreMessages(olderMessages.length > 0);
      })
      .catch(err => {
        console.error('Error loading more messages:', err);
        toast({
          title: 'Error',
          description: 'Failed to load more messages.',
          variant: 'destructive'
        });
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  };
  
  // Handle create group
  const handleCreateGroup = (groupData) => {
    createGroup(groupData)
      .then(response => {
        setShowCreateGroupDialog(false);
        toast({
          title: 'Success',
          description: 'Group created successfully!',
          variant: 'default'
        });
        // Select the newly created group
        if (response && response.group) {
          setActiveGroup(response.group);
        } else {
          // Refresh groups and find the new one
          refreshGroups();
        }
      })
      .catch(err => {
        console.error('Error creating group:', err);
        toast({
          title: 'Error',
          description: `Failed to create group: ${err.message}`,
          variant: 'destructive'
        });
      });
  };
  
  // Filter groups by search term
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get current messages
  const currentMessages = activeGroup && groupMessages[activeGroup.id] 
    ? [...groupMessages[activeGroup.id]].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : [];
  
  // Render connection/authentication error state
  if (!connected && (connectionStatus === 'error' || connectionStatus === 'auth_error' || connectionStatus === 'failed')) {
    return (
      <ConnectionErrorState 
        status={connectionStatus} 
        error={error} 
        onRetry={() => refreshGroups()}
      />
    );
  }
  
  return (
    <div className="flex h-[calc(100vh-64px)] bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Messages</h2>
          <Button variant="outline" size="sm" onClick={() => setShowCreateGroupDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Group
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-4 pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="groups" className="flex-1">
                <Users className="h-4 w-4 mr-2" />
                Groups
              </TabsTrigger>
              <TabsTrigger value="direct" className="flex-1">
                <User className="h-4 w-4 mr-2" />
                Direct
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-4">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          <TabsContent value="groups" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              {loading ? (
                // Loading skeleton
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="ml-3 space-y-2 w-full">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : filteredGroups.length > 0 ? (
                // Group list
                filteredGroups.map(group => (
                  <ChatGroupItem
                    key={group.id}
                    group={group}
                    isActive={activeGroup?.id === group.id}
                    onClick={handleSelectGroup}
                    unreadCount={group.unreadCount || 0}
                  />
                ))
              ) : (
                // Empty state
                <div className="text-center p-6 text-muted-foreground">
                  {searchTerm ? 'No matches found' : 'No groups yet'}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="direct" className="flex-1 overflow-hidden m-0">
            <div className="flex items-center justify-center h-full">
              <Card className="w-[80%] p-6 text-center">
                <MessagesSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">Direct Messages Coming Soon</h3>
                <p className="text-sm text-muted-foreground">
                  This feature is currently under development.
                </p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1">
        {activeGroup ? (
          <ChatInterface
            activeGroup={activeGroup}
            messages={currentMessages}
            onSendMessage={handleSendMessage}
            currentUser={user}
            isLoading={isLoadingMore}
            onLoadMore={handleLoadMoreMessages}
            hasMore={hasMoreMessages}
          />
        ) : (
          <EmptyState
            title="Select a conversation"
            description="Choose a group chat from the sidebar to start messaging"
            icon={<MessagesSquare className="h-10 w-10 text-muted-foreground" />}
          />
        )}
      </div>
      
      {/* Create Group Dialog */}
      <CreateGroupDialog
        isOpen={showCreateGroupDialog}
        onClose={() => setShowCreateGroupDialog(false)}
        onCreate={handleCreateGroup}
        isLoading={loading}
      />
    </div>
  );
};

export default NewChatPage;
