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

const vibrantGradients = [
  "bg-gradient-to-br from-pink-400 via-orange-300 to-yellow-400",
  "bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400",
  "bg-gradient-to-br from-green-400 via-teal-300 to-blue-400",
  "bg-gradient-to-br from-yellow-400 via-pink-400 to-red-400",
  "bg-gradient-to-br from-indigo-400 via-blue-300 to-green-300",
  "bg-gradient-to-br from-fuchsia-400 via-purple-400 to-blue-400",
  "bg-gradient-to-br from-orange-400 via-yellow-300 to-pink-400",
];
function getGradient(idx) {
  return vibrantGradients[idx % vibrantGradients.length];
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
          className="h-full w-80 bg-white/60 backdrop-blur-xl shadow-2xl rounded-r-3xl flex flex-col relative border-l border-orange-100"
          style={{ zIndex: 30 }}
        >
          {/* Sticky, glassy header */}
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b-2 border-orange-200 px-7 py-5 flex items-center justify-between rounded-tr-3xl shadow-md">
            <h3 className="font-extrabold text-transparent text-2xl bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-yellow-400 tracking-wide w-full text-center drop-shadow-lg">
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
          {/* Animated member list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {members?.length > 0 ? (
              <AnimatePresence initial={false}>
                {members.map((member, idx) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{
                      delay: idx * 0.04,
                      duration: 0.4,
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                    }}
                    whileHover={{
                      scale: 1.03,
                      boxShadow: "0 4px 24px 0 rgba(255, 186, 73, 0.12)",
                    }}
                    className="flex items-center gap-4 bg-white/80 rounded-2xl shadow-lg px-4 py-3 border border-orange-100 hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Avatar
                      className={`h-14 w-14 shadow-md transition-transform duration-200 ${getGradient(
                        idx
                      )} hover:scale-105`}
                    >
                      <AvatarFallback className="text-white font-bold text-xl">
                        {member.displayName?.[0]?.toUpperCase() ||
                          member.username?.[0]?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-orange-900 text-lg truncate">
                        {member.displayName || member.username}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        @{member.username}
                      </div>
                    </div>
                    {member.online && (
                      <span
                        className="ml-2 text-green-500 animate-pulse"
                        title="Online"
                      >
                        ●
                      </span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
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
