import React, { useState, useEffect } from 'react';
import { useWebSocketContext } from '@/components/chat/WebSocketContextProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Users, X, Search, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const CreateGroupModal = ({ isOpen, onClose, onCreateGroup, currentUserId }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { mutualFollowers } = useWebSocketContext();
  
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [description, setDescription] = useState('');
  
  // Ensure current user is always included
  useEffect(() => {
    if (currentUserId && !selectedUsers.some(u => u.id === currentUserId)) {
      setSelectedUsers(prev => [
        ...prev,
        {
          id: currentUserId,
          name: user?.firstName || user?.username || 'You',
          username: user?.username || 'current_user',
          photoURL: user?.photoURL || null,
          isCurrentUser: true
        }
      ]);
    }
  }, [currentUserId, user, selectedUsers]);
  
  // Reset form when dialog is opened
  useEffect(() => {
    if (isOpen) {
      // Keep only current user in selected users
      setSelectedUsers(prev => prev.filter(u => u.id === currentUserId));
      setGroupName('');
      setSearchQuery('');
      setDescription('');
      setShowAdvanced(false);
    }
  }, [isOpen, currentUserId]);
  
  // Filter users based on search query
  const filteredUsers = mutualFollowers.filter(user => {
    // Skip already selected users
    if (selectedUsers.some(u => u.id === user.id)) return false;
    
    // Filter by search query
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (user.firstName && user.firstName.toLowerCase().includes(query)) ||
      (user.lastName && user.lastName.toLowerCase().includes(query)) ||
      (user.username && user.username.toLowerCase().includes(query))
    );
  });
  
  // Get user display name
  const getUserDisplayName = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.username || 'Unknown user';
  };
  
  // Handle user selection/deselection
  const toggleUserSelection = (user) => {
    if (user.isCurrentUser) return; // Don't allow deselecting current user
    
    if (selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers(prev => [
        ...prev,
        {
          id: user.id,
          name: getUserDisplayName(user),
          username: user.username,
          photoURL: user.photoURL
        }
      ]);
    }
  };
  
  // Handle creating the group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Group name is required',
        description: 'Please enter a name for the group',
      });
      return;
    }
    
    if (selectedUsers.length < 2) {
      toast({
        variant: 'destructive',
        title: 'Not enough members',
        description: 'Please select at least one other user to create a group',
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      const groupData = {
        name: groupName.trim(),
        description: description.trim() || undefined,
        memberIds: selectedUsers.map(user => user.id),
        createdBy: currentUserId
      };
      
      await onCreateGroup(groupData);
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create group',
        description: error.message || 'There was an error creating the group',
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Group
          </DialogTitle>
          <DialogDescription>
            Create a group conversation with your connections.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="col-span-3"
              autoFocus
            />
          </div>
          
          {showAdvanced && (
            <div className="grid gap-2">
              <Label htmlFor="group-description">Description (Optional)</Label>
              <Input
                id="group-description"
                placeholder="Enter group description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="search-users" className="flex justify-between items-center">
              <span>Add Members ({selectedUsers.length})</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="h-6 px-2 text-xs"
              >
                {showAdvanced ? 'Basic' : 'Advanced'}
              </Button>
            </Label>
            
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-users"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            {/* Selected users list */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 mt-2">
                {selectedUsers.map(user => (
                  <div 
                    key={user.id} 
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-full text-xs border',
                      user.isCurrentUser ? 'bg-primary/10 border-primary/20' : 'bg-muted'
                    )}
                  >
                    <Avatar className="h-4 w-4">
                      {user.photoURL ? (
                        <AvatarImage src={user.photoURL} alt={user.name} />
                      ) : (
                        <AvatarFallback className="text-[10px]">
                          {user.name?.substring(0, 2) || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span>{user.name}</span>
                    {!user.isCurrentUser && (
                      <button 
                        onClick={() => toggleUserSelection(user)}
                        className="ml-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Available users list */}
            <div className="border rounded-md overflow-y-auto max-h-48">
              {filteredUsers.length > 0 ? (
                <div className="divide-y">
                  {filteredUsers.map(user => {
                    const displayName = getUserDisplayName(user);
                    
                    return (
                      <div 
                        key={user.id} 
                        className="flex items-center p-2 hover:bg-muted cursor-pointer"
                        onClick={() => toggleUserSelection(user)}
                      >
                        <Checkbox 
                          id={`user-${user.id}`}
                          checked={selectedUsers.some(u => u.id === user.id)}
                          className="mr-2"
                          onCheckedChange={() => toggleUserSelection(user)}
                        />
                        <Avatar className="h-8 w-8 mr-2">
                          {user.photoURL ? (
                            <AvatarImage src={user.photoURL} alt={displayName} />
                          ) : (
                            <AvatarFallback>
                              {displayName.substring(0, 2)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{displayName}</p>
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  {searchQuery ? (
                    <div className="flex flex-col items-center">
                      <Search className="h-4 w-4 mb-2" />
                      <p className="text-sm">No users found matching "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UserPlus className="h-4 w-4 mb-2" />
                      <p className="text-sm">Follow more users to add them to groups</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateGroup} 
            disabled={!groupName.trim() || selectedUsers.length < 2 || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : 'Create Group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;