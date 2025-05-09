/**
 * ChatConnectionStatus.jsx
 * A component that displays the current WebSocket connection status
 * Enhanced with more detailed information and interactive elements
 */

import React, { useState, useEffect } from "react";
import {
  WifiOff,
  RefreshCw,
  Loader2,
  Wifi,
  Info,
  AlertCircle,
} from "lucide-react";
import { useSocketIO } from "./SocketIOProvider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ChatConnectionStatus = () => {
  // Get connection state and additional details from WebSocket context
  const {
    connectionState,
    reconnectAttempt,
    isPolling,
    connect,
    getConnectionDetails,
    lastError,
    lastMessageTime,
  } = useSocketIO();

  // Track last time a connection state change happened
  const [lastStateChange, setLastStateChange] = useState(Date.now());
  const [showDetails, setShowDetails] = useState(false);

  // Update timestamp when connection state changes
  useEffect(() => {
    setLastStateChange(Date.now());
  }, [connectionState]);

  // Format relative time for display
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Unknown";

    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 5) return "Just now";
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  };

  // Get connection details
  const details = getConnectionDetails ? getConnectionDetails() : {};
  const hasError = lastError || connectionState === "error";

  // Common wrapper with expandable details
  const StatusWrapper = ({ icon: Icon, color, label, children }) => (
    <div className="flex flex-col w-full">
      <div
        className={`flex items-center ${color} text-sm rounded px-2 py-1 relative`}
      >
        <Icon className="h-4 w-4 mr-2" />
        <span className="font-medium">{label}</span>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setShowDetails(!showDetails)}
              >
                <Info className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Show details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {children}
      </div>

      {showDetails && (
        <div className="text-xs p-2 mt-1 bg-gray-50 rounded border border-gray-200 text-gray-600">
          <p>
            <span className="font-medium">State:</span> {connectionState}
          </p>
          <p>
            <span className="font-medium">Last change:</span>{" "}
            {formatRelativeTime(lastStateChange)}
          </p>
          {lastMessageTime && (
            <p>
              <span className="font-medium">Last message:</span>{" "}
              {formatRelativeTime(lastMessageTime)}
            </p>
          )}
          {reconnectAttempt > 0 && (
            <p>
              <span className="font-medium">Reconnect attempts:</span>{" "}
              {reconnectAttempt}
            </p>
          )}
          {hasError && (
            <p className="text-red-500">
              <span className="font-medium">Last error:</span>{" "}
              {lastError || "Connection error"}
            </p>
          )}
        </div>
      )}
    </div>
  );

  // Render different indicators based on connection state
  if (connectionState === "disconnected" && reconnectAttempt > 0) {
    return (
      <StatusWrapper
        icon={RefreshCw}
        color="text-yellow-500 bg-yellow-50 border border-yellow-200"
        label="Reconnecting..."
      >
        <span className="ml-1 text-xs bg-yellow-200 text-yellow-800 px-1 rounded-sm">
          {reconnectAttempt}
        </span>
      </StatusWrapper>
    );
  }

  if (connectionState === "disconnected") {
    return (
      <StatusWrapper
        icon={WifiOff}
        color="text-red-500 bg-red-50 border border-red-200"
        label="Disconnected"
      >
        <Button
          variant="outline"
          size="sm"
          className="ml-auto text-xs h-6 px-2 py-0 border-red-200 text-red-700 hover:bg-red-100"
          onClick={() => connect && connect()}
        >
          Reconnect
        </Button>
      </StatusWrapper>
    );
  }

  if (connectionState === "connecting") {
    return (
      <StatusWrapper
        icon={Loader2}
        color="text-amber-500 bg-amber-50 border border-amber-200"
        label="Connecting"
      >
        <span className="ml-2 animate-pulse">...</span>
      </StatusWrapper>
    );
  }

  if (hasError) {
    return (
      <StatusWrapper
        icon={AlertCircle}
        color="text-red-600 bg-red-50 border border-red-200"
        label="Connection Error"
      >
        <Button
          variant="outline"
          size="sm"
          className="ml-auto text-xs h-6 px-2 py-0 border-red-200 text-red-700 hover:bg-red-100"
          onClick={() => connect && connect()}
        >
          Retry
        </Button>
      </StatusWrapper>
    );
  }

  if (isPolling) {
    return (
      <StatusWrapper
        icon={Loader2}
        color="text-blue-500 bg-blue-50 border border-blue-200"
        label="Using Fallback Connection"
      >
        <span className="ml-1 text-xs bg-blue-200 text-blue-800 px-1 rounded-sm">
          Polling
        </span>
      </StatusWrapper>
    );
  }

  if (connectionState === "connected") {
    return (
      <StatusWrapper
        icon={Wifi}
        color="text-green-500 bg-green-50 border border-green-200"
        label="Connected"
      >
        <span className="ml-1 text-xs bg-green-200 text-green-800 px-1 rounded-sm">
          Stable
        </span>
      </StatusWrapper>
    );
  }

  // Default - for unhandled states
  return (
    <StatusWrapper
      icon={Info}
      color="text-gray-500 bg-gray-50 border border-gray-200"
      label="Unknown Status"
    />
  );
};

export default ChatConnectionStatus;
