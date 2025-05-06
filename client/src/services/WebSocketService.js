/**
 * WebSocketService.js
 * A robust, reliable WebSocket service with automatic reconnection, heartbeat checking,
 * and message queuing. Implements the WebSocket protocol with proper error handling.
 */

class WebSocketManager {
  constructor(options = {}) {
    // Configuration options with defaults
    this.options = {
      pingInterval: 20000, // Send ping every 20 seconds
      reconnectMaxAttempts: 10,
      reconnectBaseDelay: 1000, // Start with 1s delay, then exponential backoff
      reconnectMaxDelay: 30000, // Cap at 30s delay
      debug: process.env.NODE_ENV === 'development',
      ...options
    };

    // State variables
    this.socket = null;
    this.connectionState = 'disconnected'; // 'disconnected', 'connecting', 'connected'
    this.reconnectAttempts = 0;
    this.reconnectTimeout = null;
    this.pingInterval = null;
    this.lastMessageTime = 0;
    
    // Message queue for storing messages during disconnection
    this.messageQueue = new MessageQueue();
    
    // Callbacks
    this.onOpenCallbacks = [];
    this.onMessageCallbacks = [];
    this.onCloseCallbacks = [];
    this.onErrorCallbacks = [];
    this.onStateChangeCallbacks = [];
    
    // Bind methods to ensure 'this' context
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
    
    // Heartbeat manager
    this.heartbeat = new HeartbeatManager(this);
  }

  /**
   * Connect to the WebSocket server
   * @param {string} url - WebSocket server URL
   * @param {Object} params - Optional connection parameters
   * @returns {WebSocketManager} - This instance for chaining
   */
  connect(url, params = {}) {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      this.log('WebSocket already connected or connecting');
      return this;
    }

    this.setConnectionState('connecting');
    this.serverUrl = url;
    this.connectionParams = params;
    
    try {
      this.socket = new WebSocket(url);
      this.log('WebSocket connection created');
      
      // Set up event handlers
      this.socket.addEventListener('open', this.handleOpen);
      this.socket.addEventListener('message', this.handleMessage);
      this.socket.addEventListener('close', this.handleClose);
      this.socket.addEventListener('error', this.handleError);
      
      // Add protocol-level support for browsers that don't fully implement ping/pong
      this.addProtocolMethods();
      
      return this;
    } catch (error) {
      this.log('Error creating WebSocket:', error);
      this.handleError(error);
      return this;
    }
  }

  /**
   * Disconnect from the WebSocket server
   * @param {number} code - Close code
   * @param {string} reason - Close reason
   */
  disconnect(code = 1000, reason = 'Client disconnected') {
    if (!this.socket) return;
    
    this.clearTimers();
    try {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close(code, reason);
      }
    } catch (err) {
      this.log('Error closing WebSocket:', err);
    }
    
    this.setConnectionState('disconnected');
  }

  /**
   * Attempt to reconnect to the WebSocket server
   * @param {boolean} immediateReconnect - Whether to reconnect immediately (bypass backoff)
   */
  reconnect(immediateReconnect = false) {
    this.clearTimers();
    
    // Don't try to reconnect if we've exceeded max attempts
    if (this.reconnectAttempts >= this.options.reconnectMaxAttempts) {
      this.log(`Max reconnect attempts (${this.options.reconnectMaxAttempts}) reached`);
      // Tell the application about the connection failure
      window.dispatchEvent(new CustomEvent('ws:connection:failed', { 
        detail: { attempts: this.reconnectAttempts }
      }));
      return;
    }
    
    this.reconnectAttempts++;
    const delay = immediateReconnect ? 0 : this.getReconnectDelay();
    
    this.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.options.reconnectMaxAttempts}) in ${delay}ms...`);
    this.reconnectTimeout = setTimeout(() => {
      // Clear any existing socket before creating a new connection
      if (this.socket) {
        try {
          this.socket.removeEventListener('open', this.handleOpen);
          this.socket.removeEventListener('message', this.handleMessage);
          this.socket.removeEventListener('close', this.handleClose);
          this.socket.removeEventListener('error', this.handleError);
          
          if (this.socket.readyState === WebSocket.OPEN || 
              this.socket.readyState === WebSocket.CONNECTING) {
            this.socket.close();
          }
        } catch (err) {
          this.log('Error cleaning up socket before reconnect:', err);
        }
        this.socket = null;
      }
      
      if (this.serverUrl) {
        this.connect(this.serverUrl, this.connectionParams);
      }
    }, delay);
  }

  /**
   * Send a message through the WebSocket
   * @param {Object|string} data - Message to send
   * @returns {boolean} - Whether the message was sent successfully
   */
  sendMessage(data) {
    let messageStr;
    let tempId = null;
    
    // Extract tempId if it exists and convert object to JSON string if needed
    if (typeof data === 'object') {
      try {
        // Extract tempId before stringifying
        if (data.tempId) {
          tempId = data.tempId;
        }
        messageStr = JSON.stringify(data);
      } catch (err) {
        this.log('Error serializing message:', err);
        return false;
      }
    } else {
      messageStr = data;
      // Try to parse string to extract tempId
      try {
        const parsed = JSON.parse(messageStr);
        if (parsed.tempId) {
          tempId = parsed.tempId;
        }
      } catch (e) {
        // Not JSON or couldn't parse, that's fine
      }
    }
    
    // If not connected, queue the message for later
    if (!this.isConnected()) {
      this.messageQueue.add(messageStr, 0, tempId);
      this.log(`Message queued for later delivery${tempId ? ` (ID: ${tempId})` : ''}`);
      return false;
    }
    
    try {
      this.socket.send(messageStr);
      this.lastMessageTime = Date.now();
      return true;
    } catch (err) {
      this.log(`Error sending message${tempId ? ` (ID: ${tempId})` : ''}:`, err);
      this.messageQueue.add(messageStr, 0, tempId);
      return false;
    }
  }

  /**
   * Process any queued messages with retry tracking
   * @returns {number} - Number of successfully processed messages
   */
  processQueue() {
    if (!this.isConnected() || this.messageQueue.isEmpty()) return 0;
    
    this.log(`Processing ${this.messageQueue.size()} queued messages`);
    // Get messages with their metadata
    const messages = this.messageQueue.getAll(true);
    this.messageQueue.clear();
    
    let successCount = 0;
    const failedMessages = [];
    
    messages.forEach(item => {
      // Check if we've exceeded max retries for this message
      if (item.retryCount >= item.maxRetries) {
        this.log(`Message exceeded max retries (${item.maxRetries}), dropping: ${item.tempId || 'unknown'}`);
        // Emit a custom event for message delivery failure
        if (item.tempId) {
          const failureEvent = new CustomEvent('ws:message:failed', {
            detail: { tempId: item.tempId, message: item.message }
          });
          window.dispatchEvent(failureEvent);
        }
        return; // Skip this message
      }
      
      try {
        this.socket.send(item.message);
        successCount++;
        this.lastMessageTime = Date.now(); // Update last message time
        this.log('Successfully sent queued message');
      } catch (err) {
        this.log('Error sending queued message:', err);
        // Store the failed message for re-queuing with incremented retry counter
        failedMessages.push({
          message: item.message,
          retryCount: item.retryCount + 1,
          tempId: item.tempId
        });
      }
    });
    
    // Re-queue failed messages
    if (failedMessages.length > 0) {
      this.log(`Re-queuing ${failedMessages.length} failed messages`);
      failedMessages.forEach(item => {
        // Pass the tempId explicitly to maintain message tracking
        this.messageQueue.add(item.message, item.retryCount, item.tempId);
      });
    }
    
    return successCount;
  }

  /**
   * Checks if the WebSocket is currently connected
   * @returns {boolean} - Connection status
   */
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Set the connection state and trigger callbacks
   * @param {string} state - New connection state
   */
  setConnectionState(state) {
    if (this.connectionState === state) return;
    
    const previousState = this.connectionState;
    this.connectionState = state;
    
    this.log(`Connection state changed: ${previousState} -> ${state}`);
    this.onStateChangeCallbacks.forEach(callback => {
      try {
        callback(state, previousState);
      } catch (err) {
        console.error('Error in state change callback:', err);
      }
    });
  }

  /**
   * Calculate reconnection delay with exponential backoff
   * @returns {number} - Delay in milliseconds
   */
  getReconnectDelay() {
    const delay = this.options.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts - 1);
    return Math.min(delay, this.options.reconnectMaxDelay);
  }

  /**
   * Clear all timers to prevent memory leaks
   */
  clearTimers() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.heartbeat.stop();
  }

  /**
   * Add protocol-level ping/pong methods to the WebSocket
   */
  addProtocolMethods() {
    if (!this.socket) return;
    
    // Add ping method if not available
    if (!this.socket.ping) {
      this.socket.ping = function() {
        // Don't try to send binary frames as they can cause issues
        // Instead, we'll rely on our application-level heartbeat
        this.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      };
    }
    
    // Add pong method if not available
    if (!this.socket.pong) {
      this.socket.pong = function() {
        // Use application-level pong message instead of binary frames
        this.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      };
    }
    
    // Handle protocol-level ping/pong events
    this.socket.addEventListener('ping', () => {
      this.log('Received protocol-level ping');
      this.lastMessageTime = Date.now();
      if (typeof this.socket.pong === 'function') {
        try {
          this.socket.pong();
        } catch (err) {
          this.log('Error sending pong response:', err);
        }
      }
    });
    
    this.socket.addEventListener('pong', () => {
      this.log('Received protocol-level pong');
      this.lastMessageTime = Date.now();
    });
  }

  /**
   * Handler for WebSocket open event
   * @param {Event} event - WebSocket event
   */
  handleOpen(event) {
    this.log('WebSocket connection established');
    this.reconnectAttempts = 0;
    this.lastMessageTime = Date.now();
    this.setConnectionState('connected');
    
    // Start heartbeat
    this.heartbeat.start();
    
    // Process any queued messages
    setTimeout(() => this.processQueue(), 1000);
    
    // Call all registered open callbacks
    this.onOpenCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (err) {
        console.error('Error in open callback:', err);
      }
    });
  }

  /**
   * Handler for WebSocket message event
   * @param {MessageEvent} event - WebSocket message event
   */
  handleMessage(event) {
    this.lastMessageTime = Date.now();
    
    let data = event.data;
    let parsedData = null;
    
    // Try to parse JSON if the message is a string
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
        
        // Handle heartbeat messages internally
        if (parsedData.type === 'ping') {
          this.heartbeat.handlePing(parsedData);
          return;
        }
      } catch (err) {
        this.log('Received non-JSON message:', data);
      }
    }
    
    // Call all registered message callbacks
    this.onMessageCallbacks.forEach(callback => {
      try {
        callback(parsedData || data, event);
      } catch (err) {
        console.error('Error in message callback:', err);
      }
    });
  }

  /**
   * Handler for WebSocket close event
   * @param {CloseEvent} event - WebSocket close event
   */
  handleClose(event) {
    this.clearTimers();
    this.setConnectionState('disconnected');
    
    // Map of close codes to human-readable messages
    const closeReasons = {
      1000: 'Normal closure',
      1001: 'Going away',
      1002: 'Protocol error',
      1003: 'Unsupported data',
      1005: 'No status received',
      1006: 'Abnormal closure',
      1007: 'Invalid frame payload data',
      1008: 'Policy violation',
      1009: 'Message too big',
      1010: 'Mandatory extension',
      1011: 'Internal server error',
      1012: 'Service restart',
      1013: 'Try again later',
      1014: 'Bad gateway',
      1015: 'TLS handshake'
    };
    
    const reason = closeReasons[event.code] || 'Unknown reason';
    this.log(`WebSocket closed: ${event.code} (${reason})${event.reason ? ': ' + event.reason : ''}`);
    
    // Call all registered close callbacks
    this.onCloseCallbacks.forEach(callback => {
      try {
        callback(event, reason);
      } catch (err) {
        console.error('Error in close callback:', err);
      }
    });
    
    // Special handling for code 1006 (abnormal closure)
    // This is usually caused by network issues or server restart
    if (event.code === 1006) {
      this.log('Detected abnormal closure (code 1006). This may indicate network issues.');
      // Emit a custom event that components can listen for
      window.dispatchEvent(new CustomEvent('ws:abnormal:closure', { 
        detail: { timestamp: Date.now() }
      }));
      
      // Try to reconnect immediately for abnormal closures
      this.reconnect(true); // Pass true to reconnect immediately
      return;
    }
    
    // Some close codes should trigger automatic reconnection
    // 1000: Normal closure - may be server restarting
    // 1001: Going away - browser may be navigating away, but let's try reconnect anyway
    // 1005: No status code - worth trying to reconnect
    // 1011: Internal server error - server might recover, try to reconnect
    // 1012: Service restart - definitely try to reconnect
    // 1013: Try again later - server is telling us to reconnect later
    // undefined: Abnormal closure without code, likely a network issue
    const autoReconnectCodes = [1000, 1001, 1005, 1011, 1012, 1013, undefined];
    
    // Try to reconnect for non-permanent error codes
    if (autoReconnectCodes.includes(event.code) || event.code >= 1000 && event.code < 4000) {
      this.reconnect();
    }
  }

  /**
   * Handler for WebSocket error event
   * @param {Event} event - WebSocket error event
   */
  handleError(event) {
    this.log('WebSocket error event:', event?.message || 'Unknown error');
    
    // Call all registered error callbacks
    this.onErrorCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (err) {
        console.error('Error in error callback:', err);
      }
    });
  }

  /**
   * Register event callbacks
   */
  onOpen(callback) {
    if (typeof callback === 'function') {
      this.onOpenCallbacks.push(callback);
    }
    return this;
  }
  
  onMessage(callback) {
    if (typeof callback === 'function') {
      this.onMessageCallbacks.push(callback);
    }
    return this;
  }
  
  onClose(callback) {
    if (typeof callback === 'function') {
      this.onCloseCallbacks.push(callback);
    }
    return this;
  }
  
  onError(callback) {
    if (typeof callback === 'function') {
      this.onErrorCallbacks.push(callback);
    }
    return this;
  }
  
  onStateChange(callback) {
    if (typeof callback === 'function') {
      this.onStateChangeCallbacks.push(callback);
    }
    return this;
  }

  /**
   * Logging helper that respects debug option
   */
  log(...args) {
    if (this.options.debug) {
      console.log('[WebSocketManager]', ...args);
    }
  }
}

/**
 * Manages the heartbeat mechanism to keep the WebSocket connection alive
 */
class HeartbeatManager {
  constructor(wsManager) {
    this.wsManager = wsManager;
    this.pingInterval = null;
    this.pingTimeout = null;
    this.pingIntervalTime = wsManager.options.pingInterval || 20000; // Default: 20s
    this.pingTimeoutTime = 10000; // Wait 10s for pong response
  }

  /**
   * Start the heartbeat mechanism
   */
  start() {
    this.stop(); // Clear any existing timers
    
    // Send pings at regular intervals
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, this.pingIntervalTime);
    
    this.wsManager.log('Heartbeat started');
  }

  /**
   * Stop the heartbeat mechanism
   */
  stop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  /**
   * Send a ping message
   */
  sendPing() {
    if (!this.wsManager.isConnected()) {
      // If we think we're disconnected but the socket thinks we're connected,
      // force a reconnection to get back in sync
      if (this.wsManager.socket && this.wsManager.socket.readyState === WebSocket.OPEN) {
        this.wsManager.log('Connection state mismatch - forcing reconnect');
        this.wsManager.socket.close(1000, 'Connection state mismatch');
        setTimeout(() => this.wsManager.reconnect(), 1000);
      }
      return;
    }
    
    // First try application-level ping
    try {
      const pingSuccess = this.wsManager.sendMessage({
        type: 'ping',
        timestamp: Date.now()
      });
      
      if (pingSuccess) {
        this.wsManager.log('Application-level ping sent');
      } else {
        this.wsManager.log('Application-level ping failed to send');
        // If we can't send a ping, the connection might be dead
        if (this.wsManager.socket) {
          this.wsManager.socket.close(1000, 'Failed to send ping');
        }
        return;
      }
      
      // Set a timeout to detect if we don't get a response
      if (this.pingTimeout) clearTimeout(this.pingTimeout);
      this.pingTimeout = setTimeout(() => {
        // If the last message was too long ago, connection might be dead
        const timeSinceLastMessage = Date.now() - this.wsManager.lastMessageTime;
        if (timeSinceLastMessage > 2 * this.pingIntervalTime) {
          this.wsManager.log('No pong received, connection may be dead');
          if (this.wsManager.socket) {
            // Force close the socket to trigger reconnection
            this.wsManager.socket.close(1000, 'No pong response');
            // After socket closes, immediately try to reconnect
            setTimeout(() => this.wsManager.reconnect(), 500);
          }
        }
      }, this.pingTimeoutTime);
    } catch (err) {
      this.wsManager.log('Error sending ping:', err);
      // Try to reconnect if we encounter an error with the ping
      setTimeout(() => {
        if (this.wsManager.socket) {
          this.wsManager.socket.close(1000, 'Ping error');
          this.wsManager.reconnect();
        }
      }, 1000);
    }
  }

  /**
   * Handle incoming ping messages
   */
  handlePing(data) {
    if (!this.wsManager.isConnected()) return;
    
    this.wsManager.log('Received ping, sending pong');
    try {
      this.wsManager.sendMessage({
        type: 'pong',
        timestamp: Date.now(),
        pingTimestamp: data.timestamp // Echo back the ping timestamp
      });
    } catch (err) {
      this.wsManager.log('Error sending pong response:', err);
    }
  }
}

/**
 * Manages a queue of messages to be sent when reconnected
 */
class MessageQueue {
  constructor(maxSize = 100, maxRetries = 5) {
    this.queue = [];
    this.maxSize = maxSize;
    this.maxRetries = maxRetries;
  }

  /**
   * Add a message to the queue
   * @param {any} message - Message to queue
   * @param {number} retryCount - Number of retry attempts so far
   * @param {string} explicitTempId - Optional tempId to use instead of parsing from message
   */
  add(message, retryCount = 0, explicitTempId = null) {
    // If queue is full, remove oldest message
    if (this.queue.length >= this.maxSize) {
      this.queue.shift();
    }
    
    // Try to parse the message to get the tempId if it's a JSON string
    let messageData = message;
    let tempId = explicitTempId;
    
    // Only try to extract tempId from message if not explicitly provided
    if (!tempId && typeof message === 'string') {
      try {
        const parsed = JSON.parse(message);
        if (parsed.tempId) {
          tempId = parsed.tempId;
        }
        messageData = message; // Keep as string for sending
      } catch (e) {
        // Not JSON or couldn't parse, that's fine
      }
    }
    
    this.queue.push({
      message: messageData,
      tempId: tempId,
      timestamp: Date.now(),
      retryCount: retryCount,
      // Add additional tracking info
      maxRetries: this.maxRetries,
      lastAttempt: retryCount > 0 ? Date.now() : null
    });
  }

  /**
   * Get all messages in the queue with their metadata
   * @param {boolean} withMetadata - Whether to include metadata
   * @returns {Array} - All queued messages, with or without metadata
   */
  getAll(withMetadata = false) {
    return withMetadata ? 
      this.queue : 
      this.queue.map(item => item.message);
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue = [];
  }

  /**
   * Check if the queue is empty
   * @returns {boolean} - Whether the queue is empty
   */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * Get the number of messages in the queue
   * @returns {number} - Queue size
   */
  size() {
    return this.queue.length;
  }
}

export default WebSocketManager;