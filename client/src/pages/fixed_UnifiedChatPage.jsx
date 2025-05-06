import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWebSocketContext } from "@/components/chat/WebSocketContextProvider";
import DirectChatUI from "@/components/chat/DirectChatUI";
import GroupChatUI from "@/components/chat/GroupChatUI";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import GroupDetailsPanel from "@/components/chat/GroupDetailsPanel";

// Connection status component to show consistent UI for different states
const ConnectionStatusDisplay = ({ status, error }) => {
  if (status === 'auth_error') {
    return (
      <>
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground mb-4">
          Please sign in to access the chat feature.
        </p>
        <div className="mt-4 p-4 bg-amber-50 text-amber-700 rounded-md">
          <p className="font-semibold">Session Expired</p>
          <p>Your session may have expired. Please refresh the page or sign in again.</p>
        </div>
      </>
    );
  } 
  
  if (status === 'failed') {
    return (
      <>
        <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
        <div className="flex items-center justify-center mb-4">
          <p className="text-muted-foreground">
            Could not establish a connection to the chat service.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Retry Connection
        </button>
      </>
    );
  }
  
  return (
    <>
      <h2 className="text-xl font-semibold mb-2">Connecting to chat service...</h2>
      <div className="flex items-center justify-center mb-4">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
        <p className="text-muted-foreground">
          Status: {status}
        </p>
      </div>
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
          <p className="font-semibold">Connection Error</p>
          <p>{error}</p>
        </div>
      )}
    </>
  );
};

const UnifiedChatPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const wsContext = useWebSocketContext();
  
  // State for direct messages
  const [chatPartners, setChatPartners] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [directMessages, setDirectMessages] = useState([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [isLoadingDirectMessages, setIsLoadingDirectMessages] = useState(false);
  const [hasMoreDirectMessages, setHasMoreDirectMessages] = useState(false);
  
  // State for group chats
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingGroupMessages, setIsLoadingGroupMessages] = useState(false);
  const [hasMoreGroupMessages, setHasMoreGroupMessages] = useState(false);
  
  // State for UI
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState("directMessages");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupDetailsPanel, setShowGroupDetailsPanel] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Show WebSocket errors in toast notifications
  useEffect(() => {
    if (wsContext?.error) {
      toast({
        title: "Connection Error",
        description: wsContext.error,
        variant: "destructive"
      });
    }
  }, [wsContext?.error, toast]);
  
  // Destructure needed WebSocket context methods with error handling
  const {
    connected,
    connectionStatus,
    sendDirectMessage: wsSendDirectMessage,
    sendGroupMessage: wsSendGroupMessage,
    getDirectMessageHistory: wsGetDirectMessageHistory,
    getGroupMessageHistory: wsGetGroupMessageHistory,
    createGroup: wsCreateGroup,
    updateGroupName: wsUpdateGroupName,
    addGroupMember: wsAddGroupMember,
    removeGroupMember: wsRemoveGroupMember,
    leaveGroup: wsLeaveGroup,
    deleteGroup: wsDeleteGroup,
    chatPartners: contextChatPartners,
    directMessages: wsDirectMessages,
    groups: contextGroups,
    refreshPartners: wsRefreshPartners
  } = wsContext || {};
  
  // Use chat partners from context
  useEffect(() => {
    if (contextChatPartners && contextChatPartners.length > 0) {
      setChatPartners(contextChatPartners);
      setIsLoadingPartners(false);
    } else if (connected && wsRefreshPartners) {
      // If not available, refresh partners
      setIsLoadingPartners(true);
      wsRefreshPartners()
        .catch(error => {
          console.error("Error loading chat partners:", error);
          toast({
            title: "Error",
            description: "Failed to load chat partners. Please try again.",
            variant: "destructive"
          });
        })
        .finally(() => {
          setIsLoadingPartners(false);
        });
    }
  }, [user, connected, wsRefreshPartners, contextChatPartners, toast]);
  
  // Load groups if they're not already loaded
  useEffect(() => {
    if (!user) return;
    
    if (contextGroups && contextGroups.length > 0) {
      setGroups(contextGroups);
      setIsLoadingGroups(false);
    } else if (connected) {
      // If no refresh function is available, at least we can set the loading state to false
      setIsLoadingGroups(false);
    }
  }, [user, connected, contextGroups, toast]);
  
  // Load direct messages when active chat changes
  useEffect(() => {
    if (!activeChat || !wsGetDirectMessageHistory || !connected) return;
    
    setIsLoadingDirectMessages(true);
    wsGetDirectMessageHistory(activeChat.id)
      .then(messages => {
        setDirectMessages(messages);
        setHasMoreDirectMessages(messages.length >= 50); // Assuming 50 is the page size
      })
      .catch(error => {
        console.error("Error loading direct messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again.",
          variant: "destructive"
        });
      })
      .finally(() => {
        setIsLoadingDirectMessages(false);
      });
  }, [activeChat, wsGetDirectMessageHistory, connected, toast]);
  
  // Load group messages when active group changes
  useEffect(() => {
    if (!activeGroup || !wsGetGroupMessageHistory || !connected) return;
    
    setIsLoadingGroupMessages(true);
    wsGetGroupMessageHistory(activeGroup.id)
      .then(messages => {
        setGroupMessages(messages);
        setHasMoreGroupMessages(messages.length >= 50); // Assuming 50 is the page size
      })
      .catch(error => {
        console.error("Error loading group messages:", error);
        toast({
          title: "Error",
          description: "Failed to load group messages. Please try again.",
          variant: "destructive"
        });
      })
      .finally(() => {
        setIsLoadingGroupMessages(false);
      });
  }, [activeGroup, wsGetGroupMessageHistory, connected, toast]);
  
  // Send direct message
  const sendDirectMessage = useCallback(() => {
    if (!input.trim() || !activeChat || !connected || !wsSendDirectMessage) return;

    // Add message to UI immediately
    const newMessage = {
      id: `temp-${Date.now()}`,
      senderId: user.id,
      recipientId: activeChat.id,
      content: input.trim(),
      createdAt: new Date().toISOString(),
      isPending: true,
      sender: user
    };

    setDirectMessages(prev => [...prev, newMessage]);
    setInput("");
    
    // Send through WebSocket
    wsSendDirectMessage(activeChat.id, input.trim())
      .catch(error => {
        console.error("Error sending message:", error);
        toast({
          title: "Failed to send message",
          description: "Your message could not be sent. It will be retried automatically.",
          variant: "destructive"
        });
      });
  }, [input, activeChat, connected, user, wsSendDirectMessage, toast]);
  
  // Send group message
  const sendGroupMessage = useCallback(() => {
    if (!input.trim() || !activeGroup || !connected || !wsSendGroupMessage) return;

    const tempId = `temp-${Date.now()}`;
    const messageData = {
      type: "group_message",
      content: input.trim(),
      groupId: activeGroup.id,
      tempId,
      senderId: user.id
    };

    // Add message to UI immediately
    const newMessage = {
      id: tempId,
      senderId: user.id,
      groupId: activeGroup.id,
      content: input.trim(),
      createdAt: new Date().toISOString(),
      isPending: true,
      sender: user
    };

    setGroupMessages(prev => [...prev, newMessage]);
    setInput("");
    
    // Send through WebSocket
    wsSendGroupMessage(messageData)
      .catch(error => {
        console.error("Error sending group message:", error);
        toast({
          title: "Failed to send message",
          description: "Your message could not be sent. It will be retried automatically.",
          variant: "destructive"
        });
      });
  }, [input, activeGroup, connected, user, wsSendGroupMessage, toast]);
  
  // Load more direct messages
  const loadMoreDirectMessages = useCallback(() => {
    if (!activeChat || !wsGetDirectMessageHistory || !connected) return;
    
    const oldestMessageDate = directMessages.length > 0 
      ? new Date(directMessages[0].createdAt) 
      : new Date();
    
    setIsLoadingDirectMessages(true);
    wsGetDirectMessageHistory(activeChat.id, { before: oldestMessageDate })
      .then(olderMessages => {
        if (olderMessages.length > 0) {
          setDirectMessages(prev => [...olderMessages, ...prev]);
          setHasMoreDirectMessages(olderMessages.length >= 50);
        } else {
          setHasMoreDirectMessages(false);
        }
      })
      .catch(error => {
        console.error("Error loading more messages:", error);
        toast({
          title: "Error",
          description: "Failed to load more messages. Please try again.",
          variant: "destructive"
        });
      })
      .finally(() => {
        setIsLoadingDirectMessages(false);
      });
  }, [activeChat, wsGetDirectMessageHistory, connected, directMessages, toast]);
  
  // Load more group messages
  const loadMoreGroupMessages = useCallback(() => {
    if (!activeGroup || !wsGetGroupMessageHistory || !connected) return;
    
    const oldestMessageDate = groupMessages.length > 0 
      ? new Date(groupMessages[0].createdAt) 
      : new Date();
    
    setIsLoadingGroupMessages(true);
    wsGetGroupMessageHistory(activeGroup.id, oldestMessageDate)
      .then(olderMessages => {
        if (olderMessages.length > 0) {
          setGroupMessages(prev => [...olderMessages, ...prev]);
          setHasMoreGroupMessages(olderMessages.length >= 50);
        } else {
          setHasMoreGroupMessages(false);
        }
      })
      .catch(error => {
        console.error("Error loading more group messages:", error);
        toast({
          title: "Error",
          description: "Failed to load more messages. Please try again.",
          variant: "destructive"
        });
      })
      .finally(() => {
        setIsLoadingGroupMessages(false);
      });
  }, [activeGroup, wsGetGroupMessageHistory, connected, groupMessages, toast]);
  
  // Handle creating new group
  const handleCreateGroup = useCallback(async (groupData) => {
    if (!wsCreateGroup || !connected) {
      throw new Error("Not connected to the chat service");
    }
    
    try {
      const newGroup = await wsCreateGroup(groupData);
      setGroups(prev => [...prev, newGroup]);
      setActiveGroup(newGroup);
      setActiveTab("groupChats");
      return newGroup;
    } catch (error) {
      console.error("Error creating group:", error);
      throw error;
    }
  }, [wsCreateGroup, connected]);
  
  // Load available users for adding to groups
  const loadAvailableUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      // Determine the base URL at runtime based on the current location
      const baseUrl = window.location.origin;
      console.log('Fetching available users from:', `${baseUrl}/api/users/available`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      const response = await fetch(`${baseUrl}/api/users/available`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Available users API response status:', response.status);
      
      if (response.ok) {
        const users = await response.json();
        console.log(`Successfully loaded ${users.length} available users`);
        setAvailableUsers(users);
        return users;
      } else {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to load users: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error("Error loading available users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoadingUsers(false);
    }
  }, [toast]);
  
  // Handle tab changes to reset input
  useEffect(() => {
    setInput("");
  }, [activeTab]);
  
  // Handle opening create group modal
  const handleOpenCreateGroupModal = useCallback(() => {
    console.log('Opening create group modal, loading available users...');
    loadAvailableUsers()
      .then(users => {
        console.log('Successfully loaded available users:', users.length);
      })
      .catch(error => {
        console.error('Error loading available users in modal:', error);
      });
    setShowCreateGroupModal(true);
  }, [loadAvailableUsers]);
  
  // Handle opening group details
  const handleOpenGroupDetails = useCallback((group) => {
    setShowGroupDetailsPanel(true);
  }, []);
  
  // Check if user is admin of current group
  const isGroupAdmin = activeGroup?.members?.some(
    member => member.id === user?.id && member.isAdmin
  ) || false;
  
  return (
    <div className="flex flex-col h-full bg-white">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        <div className="border-b">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="directMessages">Direct Messages</TabsTrigger>
            <TabsTrigger value="groupChats">Group Chats</TabsTrigger>
          </TabsList>
        </div>
      
        <div className="flex-1 overflow-hidden">
          <TabsContent value="directMessages" className="h-full">
            {connectionStatus !== 'connected' ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-6 max-w-md">
                  <ConnectionStatusDisplay status={connectionStatus} error={wsContext?.error} />
                </div>
              </div>
            ) : (
              <DirectChatUI
                chatPartners={chatPartners}
                activeChat={activeChat}
                setActiveChat={setActiveChat}
                messages={directMessages}
                input={input}
                setInput={setInput}
                sendMessage={sendDirectMessage}
                isLoadingPartners={isLoadingPartners}
                isLoadingMessages={isLoadingDirectMessages}
                hasMoreMessages={hasMoreDirectMessages}
                loadMoreMessages={loadMoreDirectMessages}
              />
            )}
          </TabsContent>
          
          <TabsContent value="groupChats" className="h-full">
            {connectionStatus !== 'connected' ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-6 max-w-md">
                  <ConnectionStatusDisplay status={connectionStatus} error={wsContext?.error} />
                </div>
              </div>
            ) : (
              <GroupChatUI
                groups={groups}
                activeGroup={activeGroup}
                setActiveGroup={setActiveGroup}
                messages={groupMessages}
                input={input}
                setInput={setInput}
                sendGroupMessage={sendGroupMessage}
                isLoadingGroups={isLoadingGroups}
                isLoadingMessages={isLoadingGroupMessages}
                hasMoreMessages={hasMoreGroupMessages}
                loadMoreMessages={loadMoreGroupMessages}
                onCreateGroup={handleOpenCreateGroupModal}
                onShowDetails={handleOpenGroupDetails}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Modals and Panels */}
      <CreateGroupModal
        open={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onCreate={handleCreateGroup}
        userList={availableUsers}
        isLoading={isLoadingUsers}
      />

      <GroupDetailsPanel
        open={showGroupDetailsPanel}
        onClose={() => setShowGroupDetailsPanel(false)}
        group={activeGroup}
        onAddMembers={handleOpenCreateGroupModal}
        onRemoveMember={wsRemoveGroupMember}
        onLeaveGroup={() => wsLeaveGroup(activeGroup?.id)}
        onDeleteGroup={() => wsDeleteGroup(activeGroup?.id)}
        onEditGroupName={(newName) => wsUpdateGroupName(activeGroup?.id, newName)}
        isAdmin={isGroupAdmin}
        isLoading={false}
      />
    </div>
  );
};

export default UnifiedChatPage;
