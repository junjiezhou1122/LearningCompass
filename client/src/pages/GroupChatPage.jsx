import React, { useState, useEffect } from 'react';
import { useWebSocketContext } from '@/components/chat/WebSocketContextProvider';
import GroupChatList from '@/components/chat/GroupChatList';
import GroupChatMessages from '@/components/chat/GroupChatMessages';
import CreateGroupModal from '@/components/chat/CreateGroupModal';
import GroupDetailsPanel from '@/components/chat/GroupDetailsPanel';
import { Button } from '@/components/ui/button';
import { PlusCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const GroupChatPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    connected,
    connectionStatus,
    loading,
    groupChats,
    activeGroupId,
    setActiveGroup,
    fetchGroupChats,
    createGroup,
    addGroupMember,
    removeGroupMember,
    sendGroupMessage,
  } = useWebSocketContext();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Update selected group when activeGroupId changes
  useEffect(() => {
    if (activeGroupId && groupChats.length > 0) {
      const group = groupChats.find(g => g.id === activeGroupId);
      setSelectedGroup(group || null);
    } else {
      setSelectedGroup(null);
    }
  }, [activeGroupId, groupChats]);

  // Handle group selection
  const handleSelectGroup = (groupId) => {
    setActiveGroup(groupId);
    setShowGroupDetails(false);  // Close details panel if open
  };

  // Handle group creation
  const handleCreateGroup = async (groupData) => {
    try {
      const newGroup = await createGroup(groupData);
      toast({
        title: 'Group created!',
        description: `${newGroup.name} has been created successfully.`,
      });
      setActiveGroup(newGroup.id);
      return newGroup;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create group',
        description: error.message || 'There was an error creating the group.',
      });
      throw error;
    }
  };

  // Handle sending a message
  const handleSendMessage = (message) => {
    if (!selectedGroup) return false;
    
    // Generate a temporary ID for local tracking
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    sendGroupMessage({
      groupId: selectedGroup.id,
      content: message,
      tempId,
      senderName: user?.firstName || user?.username,
      senderId: user?.id,
    });
    
    return true;
  };

  // Handle adding a member to the group
  const handleAddMember = async (userId) => {
    if (!selectedGroup) return;
    
    try {
      await addGroupMember(selectedGroup.id, userId);
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to add member',
        description: error.message || 'There was an error adding the member.',
      });
      return false;
    }
  };

  // Handle removing a member from the group
  const handleRemoveMember = async (userId) => {
    if (!selectedGroup) return;
    
    try {
      await removeGroupMember(selectedGroup.id, userId);
      
      // If current user is removed, go back to group list
      if (userId === user?.id) {
        setActiveGroup(null);
        setSelectedGroup(null);
        setShowGroupDetails(false);
      }
      
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to remove member',
        description: error.message || 'There was an error removing the member.',
      });
      return false;
    }
  };

  // Connection status component
  const renderConnectionStatus = () => {
    if (connectionStatus === 'connected') return null;
    
    return (
      <div className="p-4 text-center">
        <div className="bg-muted rounded-md p-4 inline-block">
          {connectionStatus === 'connecting' || isConnecting ? (
            <>
              <div className="spinner mb-2"></div>
              <p>Connecting to chat server...</p>
            </>
          ) : (
            <>
              <p className="mb-2">Not connected to chat server.</p>
              <Button 
                onClick={() => {
                  setIsConnecting(true);
                  fetchGroupChats().finally(() => setIsConnecting(false));
                }}
                disabled={isConnecting}
              >
                Reconnect
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* Group Chat List */}
      <div className="w-1/3 border-r h-full flex flex-col bg-white">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Group Chats</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowCreateModal(true)}
            title="Create new group"
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>
        
        {renderConnectionStatus()}
        
        <div className="flex-grow overflow-y-auto">
          <GroupChatList
            groups={groupChats}
            activeGroupId={activeGroupId}
            onSelectGroup={handleSelectGroup}
            loading={loading}
          />
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="w-2/3 h-full flex flex-col">
        {selectedGroup ? (
          <>
            <div className="p-4 border-b flex justify-between items-center bg-white">
              <h2 className="text-lg font-semibold">{selectedGroup.name}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGroupDetails(!showGroupDetails)}
                title="View group details"
              >
                <Info className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-grow flex">
              <div className={`${showGroupDetails ? 'w-2/3' : 'w-full'} h-full`}>
                <GroupChatMessages
                  groupId={selectedGroup.id}
                  onSendMessage={handleSendMessage}
                  currentUserId={user?.id}
                />
              </div>
              
              {showGroupDetails && (
                <div className="w-1/3 border-l h-full">
                  <GroupDetailsPanel
                    group={selectedGroup}
                    onClose={() => setShowGroupDetails(false)}
                    onAddMember={handleAddMember}
                    onRemoveMember={handleRemoveMember}
                    currentUserId={user?.id}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-muted/20">
            <div className="text-center p-6 max-w-md">
              <h3 className="text-lg font-medium mb-2">Welcome to Group Chat</h3>
              <p className="text-muted-foreground mb-4">
                Select an existing group conversation or create a new one to start chatting
                with multiple people at once.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create a New Group
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateGroup={handleCreateGroup}
        currentUserId={user?.id}
      />
    </div>
  );
};

export default GroupChatPage;