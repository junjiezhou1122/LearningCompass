import React, { useCallback, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// Helper: assign a unique color to each user (except current user)
const userColors = [
  "#FFB347", // orange 1
  "#FF7F50", // orange 2
  "#FFA500", // orange 3
  "#FF8C00", // orange 4
  "#FF7043", // orange 5
  "#FF9800", // orange 6
  "#FF5722", // orange 7
];
function getUserColor(userId, currentUserId) {
  if (userId === currentUserId) return "#FF6F00"; // main orange for self
  const idx = Math.abs(userId) % userColors.length;
  return userColors[idx];
}

const GroupSidebar = memo(function GroupSidebar({
  groupInfo,
  members,
  open,
  onClose,
}) {
  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="h-full w-72 bg-gradient-to-b from-orange-50 to-orange-100 shadow-xl rounded-r-2xl flex flex-col relative"
          style={{ zIndex: 30 }}
        >
          {/* Single sticky section header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-100 to-orange-50 border-b-2 border-orange-200 px-5 py-4 flex items-center justify-between rounded-tr-2xl shadow-sm">
            <h3 className="font-bold text-orange-700 text-lg tracking-wide w-full text-center">
              Group Members
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-orange-600 md:hidden absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          {/* Member list only, no extra header */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {members?.length > 0 ? (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 bg-white rounded-xl shadow-sm px-3 py-2 border border-orange-100 hover:shadow-md transition-all"
                >
                  <Avatar className="h-11 w-11">
                    <AvatarFallback
                      style={{
                        background: getUserColor(member.id, null),
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 20,
                      }}
                    >
                      {member.displayName?.[0]?.toUpperCase() ||
                        member.username?.[0]?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-orange-900 truncate">
                      {member.displayName || member.username}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      @{member.username}
                    </div>
                  </div>
                  {member.online && (
                    <span className="ml-2 text-green-500" title="Online">
                      ●
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-orange-400">No members found</div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
});

export default GroupSidebar;
