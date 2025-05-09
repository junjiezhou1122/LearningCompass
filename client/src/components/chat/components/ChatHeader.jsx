import React from "react";
import { ChevronLeft, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ChatHeader component displays the title and connection status
 */
const ChatHeader = ({
  title,
  connectionState,
  onBack,
  onReconnect,
  showBackButton = false,
}) => {
  const getConnectionIndicator = () => {
    switch (connectionState) {
      case "connected":
        return <Wifi className="w-5 h-5 text-green-500" />;
      case "connecting":
      case "reconnecting":
        return <Wifi className="w-5 h-5 text-orange-500" />;
      case "disconnected":
      case "error":
      case "failed":
        return <WifiOff className="w-5 h-5 text-red-500" />;
      case "offline":
        return <WifiOff className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionState) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "reconnecting":
        return "Reconnecting...";
      case "disconnected":
        return "Disconnected";
      case "error":
      case "failed":
        return "Connection Error";
      case "offline":
        return "Offline";
      default:
        return "Unknown Status";
    }
  };

  return (
    <div className="bg-white border-b shadow-sm p-3 sticky top-0 z-10">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="mr-2"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>

        <div className="flex items-center">
          <div
            className="flex items-center text-sm text-gray-600 mr-2"
            title={getConnectionText()}
          >
            <span className="mr-1">{getConnectionIndicator()}</span>
            <span className="hidden sm:inline">{getConnectionText()}</span>
          </div>

          {(connectionState === "disconnected" ||
            connectionState === "error" ||
            connectionState === "failed") && (
            <Button
              size="sm"
              variant="outline"
              onClick={onReconnect}
              className="text-xs"
            >
              Reconnect
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
