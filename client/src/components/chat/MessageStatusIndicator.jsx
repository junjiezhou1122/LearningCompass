/**
 * MessageStatusIndicator.jsx
 * A component that displays the status of a message (sending, sent, delivered, read, error)
 * Enhanced with direct WebSocket context integration and better animation/feedback
 */

import React, { useState, useCallback } from 'react';
import { Check, CheckCheck, Clock, AlertCircle, RefreshCw, XCircle, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWebSocketContext } from './WebSocketProvider';
import { Button } from '@/components/ui/button';

/**
 * MessageStatusIndicator component provides visual feedback about message status
 * 
 * @param {string} status - The status of the message (sending, sent, delivered, read, error)
 * @param {boolean} isCompact - Whether to show a compact version (icon only)
 * @param {function} onRetry - Optional callback when retry button is clicked (for failed messages)
 * @param {object} message - Optional message object for context-aware retries
 * @param {string} errorMessage - Optional error message to display
 */
const MessageStatusIndicator = ({ 
  status, 
  isCompact = false, 
  onRetry, 
  message = null,
  errorMessage = null 
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Get WebSocket context for direct message retries when no callback is provided
  const wsContext = useWebSocketContext();
  
  // Enhanced retry handler that works with or without a callback
  const handleRetry = useCallback(async () => {
    // Avoid multiple retry attempts
    if (isRetrying) return;
    
    try {
      setIsRetrying(true);
      
      // If an explicit retry handler is provided, use it
      if (onRetry) {
        await onRetry();
      } 
      // Otherwise, if we have message context and webSocket, use the websocket retry
      else if (message && message.tempId && wsContext) {
        // Dispatch a custom event that WebSocketProvider will handle
        const retryEvent = new CustomEvent('chat:message:retry', { 
          detail: { messageId: message.tempId || message.id }
        });
        window.dispatchEvent(retryEvent);
      } else {
        console.error('Cannot retry: no retry handler or message context provided');
      }
    } catch (error) {
      console.error('Error retrying message:', error);
    } finally {
      // Reset retry state after a delay to show animation
      setTimeout(() => setIsRetrying(false), 1500);
    }
  }, [onRetry, message, wsContext, isRetrying]);
  
  // Use the current retry state if actively retrying
  const actualStatus = isRetrying ? 'retrying' : status;
  
  // Enhanced status configurations with appropriate icons, messages, and animations
  const statusConfig = {
    sending: {
      icon: Clock,
      color: 'text-gray-400',
      message: 'Sending message...',
      animate: true,
      pulseColor: 'gray'
    },
    sent: {
      icon: Check,
      color: 'text-blue-500',
      message: 'Message sent',
      animate: false
    },
    delivered: {
      icon: Check,
      color: 'text-green-500',
      message: 'Message delivered',
      animate: false
    },
    read: {
      icon: CheckCheck,
      color: 'text-green-600',
      message: 'Message read',
      animate: false
    },
    failed: {
      icon: XCircle,
      color: 'text-red-500',
      message: errorMessage || 'Failed to send message. Click to retry.',
      animate: false,
      showRetry: true,
      pulseColor: 'red'
    },
    retrying: {
      icon: RefreshCw,
      color: 'text-amber-500',
      message: 'Retrying message...',
      animate: true,
      animateType: 'spin',
      pulseColor: 'amber'
    },
    network_error: {
      icon: WifiOff,
      color: 'text-red-500',
      message: 'Network connection lost while sending.',
      animate: false,
      showRetry: true,
      pulseColor: 'red'
    }
  };

  // Use default status if provided status is invalid
  const config = statusConfig[actualStatus] || statusConfig.sending;
  const StatusIcon = config.icon;
  
  // Build animation classes based on configuration
  const getAnimationClass = () => {
    if (!config.animate) return '';
    
    if (config.animateType === 'spin') {
      return 'animate-spin';
    }
    
    const pulseColor = config.pulseColor || 'gray';
    return `animate-pulse`;
  };
  
  const animationClass = getAnimationClass();

  // For compact display, just show the icon
  if (isCompact) {
    return (
      <span className={`inline-block ${config.color}`}>
        <StatusIcon className={`h-3 w-3 ${animationClass}`} />
      </span>
    );
  }

  // For full display with retry button
  if (config.showRetry) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="xs" 
              onClick={handleRetry} 
              disabled={isRetrying}
              className={`inline-flex h-6 items-center gap-1 px-2 py-0 ${config.color} hover:bg-red-50 rounded-sm border border-red-200`}
            >
              <StatusIcon className={`h-3.5 w-3.5 ${animationClass}`} />
              <span className="text-xs">{isRetrying ? 'Retrying...' : 'Retry'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            align="center" 
            className="bg-white border border-gray-200 text-xs"
          >
            <p>{config.message}</p>
            {wsContext && !wsContext.connected && (
              <p className="mt-1 text-xs text-red-500">
                Warning: WebSocket is disconnected. Retry may fail.
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Regular indicator with tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center ${config.color}`}>
            <StatusIcon className={`h-4 w-4 ${animationClass}`} />
            {!isCompact && status === 'sent' && (
              <span className="ml-1 text-xs">Sent</span>
            )}
            {!isCompact && status === 'delivered' && (
              <span className="ml-1 text-xs">Delivered</span>
            )}
            {!isCompact && status === 'read' && (
              <span className="ml-1 text-xs">Read</span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="center" 
          className="bg-white border border-gray-200 text-xs"
        >
          <p>{config.message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MessageStatusIndicator;
