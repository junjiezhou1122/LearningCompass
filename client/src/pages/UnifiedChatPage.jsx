import React from "react";
import { useAuth } from "@/contexts/AuthContext";

const UnifiedChatPage = () => {
  console.log("UnifiedChatPage component loaded - SIMPLIFIED VERSION");
  const { user } = useAuth();
  console.log("User from AuthContext:", user ? "ID: " + user.id : "not authenticated");

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h1 className="text-2xl font-bold mb-4">Chat Page</h1>
        <p className="text-center mb-2">
          This is a simplified version of the chat page for troubleshooting.
        </p>
        <p className="text-center mb-4">
          {user ? `Logged in as: ${user.username || user.email}` : "Not logged in"}
        </p>
      </div>
    </div>
  );
};

export default UnifiedChatPage;
