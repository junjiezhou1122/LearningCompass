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
   */
  reconnect() {
    this.clearTimers();
    
    // Don't try to reconnect if we've exceeded max attempts
    if (this.reconnectAttempts >= this.options.reconnectMaxAttempts) {
      this.log(`Max reconnect attempts (${this.options.reconnectMaxAttempts}) reached`);
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.getReconnectDelay();
    
    this.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.options.reconnectMaxAttempts}) in ${delay}ms...`);
    this.reconnectTimeout = setTimeout(() => {
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
    
    // Convert object to JSON string if needed
    if (typeof data === 'object') {
      try {
        messageStr = JSON.stringify(data);
      } catch (err) {
        this.log('Error serializing message:', err);
        return false;
      }
    } else {
      messageStr = data;
    }
    
    // If not connected, queue the message for later
    if (!this.isConnected()) {
      this.messageQueue.add(messageStr);
      this.log('Message queued for later delivery');
      return false;
    }
    
    try {
      this.socket.send(messageStr);
      this.lastMessageTime = Date.now();
      return true;
    } catch (err) {
      this.log('Error sending message:', err);
      this.messageQueue.add(messageStr);
      return false;
    }
  }

  /**
   * Process any queued messages
   */
  processQueue() {
    if (!this.isConnected() || this.messageQueue.isEmpty()) return;
    
    this.log(`Processing ${this.messageQueue.size()} queued messages`);
    const messages = this.messageQueue.getAll();
    this.messageQueue.clear();
    
    messages.forEach(msg => {
      try {
        this.socket.send(msg);
      } catch (err) {
        this.log('Error sending queued message:', err);
        this.messageQueue.add(msg);
      }
    });
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
    
    // Some close codes should trigger automatic reconnection
    const autoReconnectCodes = [1000, 1001, 1005, 1006, 1012, 1013, undefined];
    if (autoReconnectCodes.includes(event.code)) {
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
    if (!this.wsManager.isConnected()) return;
    
    // First try application-level ping
    try {
      this.wsManager.sendMessage({
        type: 'ping',
        timestamp: Date.now()
      });
      this.wsManager.log('Application-level ping sent');
      
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
          }
        }
      }, this.pingTimeoutTime);
    } catch (err) {
      this.wsManager.log('Error sending ping:', err);
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
  constructor(maxSize = 100) {
    this.queue = [];
    this.maxSize = maxSize;
  }

  /**
   * Add a message to the queue
   * @param {any} message - Message to queue
   */
  add(message) {
    // If queue is full, remove oldest message
    if (this.queue.length >= this.maxSize) {
      this.queue.shift();
    }
    this.queue.push({
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Get all messages in the queue
   * @returns {Array} - All queued messages
   */
  getAll() {
    return this.queue.map(item => item.message);
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