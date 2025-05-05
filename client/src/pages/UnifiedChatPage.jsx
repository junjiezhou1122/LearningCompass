import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWebSocketContext } from "@/components/chat/WebSocketContextProvider";
import DirectChatUI from "@/components/chat/DirectChatUI";
import GroupChatUI from "@/components/chat/GroupChatUI";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import GroupDetailsPanel from "@/components/chat/GroupDetailsPanel";

const UnifiedChatPage = () => {
  console.log("UnifiedChatPage component loaded");
  const { user } = useAuth();
  const { toast } = useToast();
  const [wsConnectionStatus, setWsConnectionStatus] = useState('initializing');
  const [wsError, setWsError] = useState(null);
  
  // Common state
  const [activeTab, setActiveTab] = useState("directMessages");
  const [input, setInput] = useState("");

  // Direct messages state
  const [activeChat, setActiveChat] = useState(null);
  const [directMessages, setDirectMessages] = useState([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [isLoadingDirectMessages, setIsLoadingDirectMessages] = useState(false);
  const [chatPartners, setChatPartners] = useState([]);
  const [hasMoreDirectMessages, setHasMoreDirectMessages] = useState(false);

  // Group chat state
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingGroupMessages, setIsLoadingGroupMessages] = useState(false);
  const [hasMoreGroupMessages, setHasMoreGroupMessages] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupDetailsPanel, setShowGroupDetailsPanel] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Try to access WebSocketContext with error handling
  const wsContext = useWebSocketContext();
  
  // Update connection status on mount and when it changes
  useEffect(() => {
    if (wsContext) {
      const { connectionStatus } = wsContext;
      setWsConnectionStatus(connectionStatus || 'unknown');
    }
  }, [wsContext?.connectionStatus]);
  
  // Update groups and chat partners when they change
  useEffect(() => {
    if (wsContext) {
      const { groupChats, chatPartners } = wsContext;
      
      // If WebSocketContext provides these values, use them
      if (groupChats && groupChats.length > 0) {
        setGroups(groupChats);
        setIsLoadingGroups(false);
      }
      
      if (chatPartners && chatPartners.length > 0) {
        setChatPartners(chatPartners);
        setIsLoadingPartners(false);
      }
    }
  }, [wsContext?.groupChats, wsContext?.chatPartners]);
  
  // Handle context errors
  useEffect(() => {
    if (wsContext?.error) {
      console.error("Error in WebSocketContext:", wsContext.error);
      setWsError(wsContext.error.message);
      toast({
        title: "WebSocket Error",
        description: "There was an issue connecting to the chat service. Please reload the page.",
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
    getMessageHistory: wsGetMessageHistory,
    getGroupMessageHistory: wsGetGroupMessageHistory,
    createGroup: wsCreateGroup,
    updateGroupName: wsUpdateGroupName,
    addGroupMember: wsAddGroupMember,
    removeGroupMember: wsRemoveGroupMember,
    leaveGroup: wsLeaveGroup,
    deleteGroup: wsDeleteGroup,
    loadChatPartners: wsLoadChatPartners,
    loadGroups: wsLoadGroups
  } = wsContext || {};

  // Load chat partners if they're not already loaded
  useEffect(() => {
    if (!user) return;
    
    if (chatPartners.length === 0 && wsLoadChatPartners && connected) {
      setIsLoadingPartners(true);
      wsLoadChatPartners()
        .then(partners => {
          setChatPartners(partners);
        })
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
  }, [user, connected, wsLoadChatPartners, chatPartners.length, toast]);

  // Load groups if they're not already loaded
  useEffect(() => {
    if (!user) return;
    
    if (groups.length === 0 && wsLoadGroups && connected) {
      setIsLoadingGroups(true);
      wsLoadGroups()
        .then(loadedGroups => {
          setGroups(loadedGroups);
        })
        .catch(error => {
          console.error("Error loading groups:", error);
          toast({
            title: "Error",
            description: "Failed to load chat groups. Please try again.",
            variant: "destructive"
          });
        })
        .finally(() => {
          setIsLoadingGroups(false);
        });
    }
  }, [user, connected, wsLoadGroups, groups.length, toast]);

  // Load direct messages when active chat changes
  useEffect(() => {
    if (!activeChat || !wsGetMessageHistory || !connected) return;
    
    setIsLoadingDirectMessages(true);
    wsGetMessageHistory(activeChat.id)
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
  }, [activeChat, wsGetMessageHistory, connected, toast]);

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

    const tempId = `temp-${Date.now()}`;
    const messageData = {
      type: "chat_message",
      content: input.trim(),
      receiverId: activeChat.id,
      tempId,
      senderId: user.id
    };

    // Add message to UI immediately
    const newMessage = {
      id: tempId,
      senderId: user.id,
      receiverId: activeChat.id,
      content: input.trim(),
      createdAt: new Date().toISOString(),
      isPending: true,
      sender: user
    };

    setDirectMessages(prev => [...prev, newMessage]);
    setInput("");
    
    // Send through WebSocket
    wsSendDirectMessage(messageData)
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
    if (!activeChat || !wsGetMessageHistory || !connected) return;
    
    const oldestMessageDate = directMessages.length > 0 
      ? new Date(directMessages[0].createdAt) 
      : new Date();
    
    setIsLoadingDirectMessages(true);
    wsGetMessageHistory(activeChat.id, oldestMessageDate)
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
  }, [activeChat, wsGetMessageHistory, connected, directMessages, toast]);

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
      // This would usually come from the WebSocket context or a direct API call
      const response = await fetch('/api/users/available', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users);
        return users;
      } else {
        throw new Error("Failed to load users");
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
    loadAvailableUsers().catch(console.error);
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
      <div className="border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="directMessages">Direct Messages</TabsTrigger>
            <TabsTrigger value="groupChats">Group Chats</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <TabsContent value="directMessages" className="h-full">
          {wsConnectionStatus !== 'connected' ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6 max-w-md">
                <h2 className="text-xl font-semibold mb-2">Connecting to chat service...</h2>
                <p className="text-muted-foreground">
                  Status: {wsConnectionStatus}
                </p>
                {wsError && (
                  <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
                    <p className="font-semibold">Connection Error</p>
                    <p>{wsError}</p>
                  </div>
                )}
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
          {wsConnectionStatus !== 'connected' ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6 max-w-md">
                <h2 className="text-xl font-semibold mb-2">Connecting to chat service...</h2>
                <p className="text-muted-foreground">
                  Status: {wsConnectionStatus}
                </p>
                {wsError && (
                  <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
                    <p className="font-semibold">Connection Error</p>
                    <p>{wsError}</p>
                  </div>
                )}
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
