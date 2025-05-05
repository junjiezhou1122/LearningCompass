import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const CreateGroupModal = ({ open, onClose, onCreate, userList = [], isLoading = false }) => {
  const { toast } = useToast();
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setGroupName("");
      setSelectedUsers([]);
      setSearchQuery("");
    }
  }, [open]);

  // Filter users based on search query
  const filteredUsers = searchQuery.trim() === ""
    ? userList
    : userList.filter(user => 
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  const handleUserToggle = (userId) => {
    setSelectedUsers(prevSelected => 
      prevSelected.includes(userId)
        ? prevSelected.filter(id => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Group name required",
        description: "Please enter a name for your group",
        variant: "destructive",
      });
      return;
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "Select members",
        description: "Please select at least one member to add to the group",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      await onCreate({
        name: groupName.trim(),
        memberIds: selectedUsers,
      });
      onClose();
      toast({
        title: "Group created",
        description: `Your group "${groupName}" has been created successfully.`,
      });
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Failed to create group",
        description: error.message || "There was an error creating your group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Group Chat</DialogTitle>
          <DialogDescription>
            Create a new group and add members to start chatting together.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Add Members</Label>
            <Input
              placeholder="Search users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />

            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading users...</span>
              </div>
            ) : filteredUsers.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 pr-4">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleUserToggle(user.id)}
                    >
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => handleUserToggle(user.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <div className="bg-primary text-white w-full h-full flex items-center justify-center text-xs font-bold">
                          {user.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                      </Avatar>
                      <Label
                        htmlFor={`user-${user.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="text-sm font-medium">{user.username}</div>
                        {user.firstName && user.lastName && (
                          <div className="text-xs text-muted-foreground">
                            {user.firstName} {user.lastName}
                          </div>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {searchQuery ? "No users found matching your search" : "No users available"}
              </div>
            )}

            <div className="mt-2 text-sm text-muted-foreground">
              {selectedUsers.length} {selectedUsers.length === 1 ? "user" : "users"} selected
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateGroup} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Group"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;