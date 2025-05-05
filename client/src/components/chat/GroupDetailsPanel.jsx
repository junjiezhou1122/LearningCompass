import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, User, X, LogOut, Trash2, Pencil, Check, RotateCcw } from "lucide-react";

const GroupDetailsPanel = ({
  open,
  onClose,
  group,
  onAddMembers,
  onRemoveMember,
  onLeaveGroup,
  onDeleteGroup,
  onEditGroupName,
  isAdmin = false,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize form when group changes
  useEffect(() => {
    if (group) {
      setNewGroupName(group.name || "");
    }
  }, [group]);

  // Filter members based on search
  const filteredMembers = !group || !group.members || searchQuery.trim() === ""
    ? (group?.members || [])
    : (group.members || []).filter(member => {
        const usernameMatch = member.username?.toLowerCase().includes(searchQuery.toLowerCase());
        const nameMatch = 
          (member.firstName && member.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (member.lastName && member.lastName.toLowerCase().includes(searchQuery.toLowerCase()));
        return usernameMatch || nameMatch;
      });

  const handleEditName = () => {
    if (isEditing) {
      // Save changes
      if (newGroupName.trim() !== group.name && newGroupName.trim() !== "") {
        onEditGroupName(newGroupName.trim())
          .then(() => {
            toast({
              title: "Group name updated",
              description: `The group name has been updated to "${newGroupName.trim()}".`,
            });
            setIsEditing(false);
          })
          .catch(error => {
            toast({
              title: "Failed to update group name",
              description: error.message || "There was an error updating the group name.",
              variant: "destructive",
            });
          });
      } else {
        // Reset to original if empty or unchanged
        setNewGroupName(group.name);
        setIsEditing(false);
      }
    } else {
      // Enter editing mode
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setNewGroupName(group.name);
    setIsEditing(false);
  };

  const handleLeaveGroup = () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      onLeaveGroup()
        .then(() => {
          toast({
            title: "Left group",
            description: "You have successfully left the group.",
          });
          onClose();
        })
        .catch(error => {
          toast({
            title: "Failed to leave group",
            description: error.message || "There was an error leaving the group.",
            variant: "destructive",
          });
        });
    }
  };

  const handleDeleteGroup = () => {
    if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      onDeleteGroup()
        .then(() => {
          toast({
            title: "Group deleted",
            description: "The group has been permanently deleted.",
          });
          onClose();
        })
        .catch(error => {
          toast({
            title: "Failed to delete group",
            description: error.message || "There was an error deleting the group.",
            variant: "destructive",
          });
        });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose} position="right">
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Group Details</SheetTitle>
          <SheetDescription>
            View and manage group information and members.
          </SheetDescription>
        </SheetHeader>

        {group && (
          <div className="py-6 space-y-6">
            {/* Group name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Group Name</Label>
                {isAdmin && (
                  <div>
                    {isEditing ? (
                      <div className="flex space-x-1">
                        <Button size="icon" variant="ghost" onClick={handleCancelEdit} title="Cancel">
                          <RotateCcw size={16} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={handleEditName} title="Save">
                          <Check size={16} />
                        </Button>
                      </div>
                    ) : (
                      <Button size="icon" variant="ghost" onClick={handleEditName} title="Edit name">
                        <Pencil size={16} />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              ) : (
                <div className="font-medium text-lg">{group.name}</div>
              )}
            </div>

            {/* Members section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Members ({group.members?.length || 0})</Label>
                {isAdmin && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center space-x-1"
                    onClick={onAddMembers}
                  >
                    <UserPlus size={16} />
                    <span>Add</span>
                  </Button>
                )}
              </div>

              <Input
                placeholder="Search members"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-2"
              />

              <ScrollArea className="h-[300px] rounded-md border p-2">
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-4">Loading members...</div>
                  ) : filteredMembers.length > 0 ? (
                    filteredMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center text-xs font-bold">
                              {member.username?.charAt(0).toUpperCase() || "U"}
                            </div>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.username}</div>
                            {member.isAdmin && (
                              <div className="text-xs text-muted-foreground">Group Admin</div>
                            )}
                          </div>
                        </div>

                        {/* Show remove button for admins, except for themselves */}
                        {isAdmin && member.id !== user?.id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onRemoveMember(member.id)}
                            title="Remove member"
                          >
                            <X size={16} />
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No members found matching your search.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Actions section */}
            <div className="pt-4 space-y-2">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center space-x-2"
                onClick={handleLeaveGroup}
              >
                <LogOut size={16} />
                <span>Leave Group</span>
              </Button>

              {isAdmin && (
                <Button 
                  variant="destructive" 
                  className="w-full flex items-center justify-center space-x-2"
                  onClick={handleDeleteGroup}
                >
                  <Trash2 size={16} />
                  <span>Delete Group</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default GroupDetailsPanel;