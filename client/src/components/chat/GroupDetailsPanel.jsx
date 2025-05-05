import React, { useState } from 'react';
import { useWebSocketContext } from '@/components/chat/WebSocketContextProvider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { X, Settings, Users, UserX, UserPlus, LogOut, Trash2, Pencil, Shield, Check } from 'lucide-react';

const GroupDetailsPanel = ({ group, onClose, onAddMember, onRemoveMember, currentUserId }) => {
  const { toast } = useToast();
  const { mutualFollowers, updateGroup, deleteGroup } = useWebSocketContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const isAdmin = group?.createdBy === currentUserId;
  const members = group?.members || [];
  
  // Filter potential members based on search
  const filteredPotentialMembers = mutualFollowers.filter(user => {
    // Exclude users who are already members
    if (members.some(member => member.id === user.id)) return false;
    
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
  
  // Handle saving group details
  const handleSaveDetails = async () => {
    if (!groupName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Group name is required',
        description: 'Please enter a name for the group',
      });
      return;
    }
    
    setIsUpdating(true);
    
    try {
      await updateGroup(group.id, {
        name: groupName.trim(),
        description: description.trim() || undefined
      });
      
      toast({
        title: 'Group updated',
        description: 'Group details have been updated successfully',
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to update group',
        description: error.message || 'There was an error updating the group',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle leaving the group
  const handleLeaveGroup = async () => {
    try {
      await onRemoveMember(currentUserId);
      setShowConfirmLeave(false);
      
      toast({
        title: 'Left group',
        description: `You have left "${group.name}"`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to leave group',
        description: error.message || 'There was an error leaving the group',
      });
    }
  };
  
  // Handle deleting the group
  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(group.id);
      setShowConfirmDelete(false);
      
      toast({
        title: 'Group deleted',
        description: `"${group.name}" has been deleted`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete group',
        description: error.message || 'There was an error deleting the group',
      });
    }
  };
  
  // Handle adding a member
  const handleAddMember = async (userId) => {
    try {
      await onAddMember(userId);
      
      toast({
        title: 'Member added',
        description: 'New member has been added to the group',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to add member',
        description: error.message || 'There was an error adding the member',
      });
    }
  };
  
  // Handle removing a member
  const handleRemoveMember = async (userId) => {
    try {
      await onRemoveMember(userId);
      
      toast({
        title: 'Member removed',
        description: 'Member has been removed from the group',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to remove member',
        description: error.message || 'There was an error removing the member',
      });
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-base font-medium">Group Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Group info */}
      <div className="p-4 border-b">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="group-description">Description (Optional)</Label>
              <Input
                id="group-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter group description"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setGroupName(group.name);
                  setDescription(group.description || '');
                  setIsEditing(false);
                }}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveDetails}
                disabled={!groupName.trim() || isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between">
              <h3 className="text-lg font-medium">{group.name}</h3>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  title="Edit group details"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {group.description && (
              <p className="text-muted-foreground text-sm">
                {group.description}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmLeave(true)}
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Leave Group
              </Button>
              
              {isAdmin && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowConfirmDelete(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete Group
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Members section */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium flex items-center">
            <Users className="h-4 w-4 mr-1" /> Members
          </h4>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddMembers(!showAddMembers)}
            >
              {showAddMembers ? (
                <Check className="h-3.5 w-3.5 mr-1" />
              ) : (
                <UserPlus className="h-3.5 w-3.5 mr-1" />
              )}
              {showAddMembers ? 'Done' : 'Add'}
            </Button>
          )}
        </div>
        
        {showAddMembers && (
          <div className="mb-4 space-y-3">
            <Input
              placeholder="Search for people to add..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm"
            />
            
            <div className="border rounded-md overflow-y-auto max-h-36">
              {filteredPotentialMembers.length > 0 ? (
                <div className="divide-y">
                  {filteredPotentialMembers.map(user => (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-2 hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          {user.photoURL ? (
                            <AvatarImage src={user.photoURL} alt={getUserDisplayName(user)} />
                          ) : (
                            <AvatarFallback className="text-xs">
                              {getUserDisplayName(user).substring(0, 2)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-sm">{getUserDisplayName(user)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleAddMember(user.id)}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No users found matching your search' : 'No more users to add'}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="space-y-1">
          {members.map(member => {
            const isCurrentUser = member.id === currentUserId;
            const isOwner = member.id === group.createdBy;
            
            return (
              <div 
                key={member.id} 
                className="flex items-center justify-between py-2 px-1"
              >
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    {member.photoURL ? (
                      <AvatarImage src={member.photoURL} alt={member.name || member.username} />
                    ) : (
                      <AvatarFallback className="text-xs">
                        {(member.name || member.username || '').substring(0, 2)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <span className={cn(
                      'text-sm',
                      isCurrentUser && 'font-medium'
                    )}>
                      {isCurrentUser ? 'You' : (member.name || member.username)}
                    </span>
                    {isOwner && (
                      <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                
                {isAdmin && !isOwner && !isCurrentUser && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <UserX className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Leave group confirmation */}
      <AlertDialog open={showConfirmLeave} onOpenChange={setShowConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave "{group.name}"? You will stop receiving messages from this group.
              {isAdmin && ' As the admin, leaving will not delete the group but will make someone else the admin.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLeaveGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete group confirmation */}
      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{group.name}"? This action cannot be undone and all messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GroupDetailsPanel;