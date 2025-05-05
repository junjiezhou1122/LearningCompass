/**
 * WebSocketService2.js
 * An improved WebSocket service with Promise-based interface
 */

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.messageQueue = [];
    this.heartbeatInterval = null;
    this.listeners = {};
    this.pendingRequests = new Map();
    this.userId = null;
    this.connectionStatus = 'disconnected';
    this.errorState = null;
  }

  /**
   * Generate a unique request ID
   * @returns {string} A unique ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Connect to the WebSocket server
   * @param {string} token - Authentication token
   * @returns {Promise} Resolves when connection is established and authenticated
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      if (this.socket && this.isConnected) {
        console.log('[WebSocketService] Already connected');
        resolve();
        return;
      }

      if (!token) {
        this.connectionStatus = 'auth_error';
        reject(new Error('No authentication token provided'));
        return;
      }

      try {
        this.connectionStatus = 'connecting';
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        console.log(`[WebSocketService] Connecting to ${wsUrl}`);
        this.socket = new WebSocket(wsUrl);

        // Setup event listeners
        this.socket.onopen = () => {
          console.log('[WebSocketService] Connection established');
          this.isConnected = true;
          this.connectionStatus = 'authenticating';
          this.reconnectAttempts = 0;
          
          // Authenticate immediately after connection
          this.send({
            type: 'auth',
            token
          });
          
          // Start heartbeat
          this.startHeartbeat();
          
          // Process any queued messages
          this.processQueue();
        };

        this.socket.onclose = (event) => {
          console.log(`[WebSocketService] Connection closed: ${event.code} ${event.reason}`);
          this.isConnected = false;
          this.connectionStatus = 'disconnected';
          this.clearHeartbeat();
          
          // Reject any pending requests
          this.rejectAllPendingRequests('WebSocket connection closed');
          
          // Don't reconnect on normal closure
          if (event.code !== 1000) {
            this.scheduleReconnect(token);
          }
          
          // Notify listeners
          if (event.code === 1006) {
            // Abnormal closure
            this.dispatchEvent('abnormal:closure', { code: event.code });
          }
        };

        this.socket.onerror = (error) => {
          console.error('[WebSocketService] Connection error:', error);
          this.errorState = {
            message: 'WebSocket connection error',
            details: error
          };
          
          // Only reject if we haven't authenticated yet
          if (this.connectionStatus === 'connecting' || this.connectionStatus === 'authenticating') {
            reject(new Error('WebSocket connection error'));
          }
          
          // Notify listeners
          this.dispatchEvent('error', { error });
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message, token, resolve, reject);
          } catch (error) {
            console.error('[WebSocketService] Error parsing message:', error);
            // Continue operation despite parse errors
          }
        };
      } catch (error) {
        console.error('[WebSocketService] Failed to create WebSocket:', error);
        this.connectionStatus = 'failed';
        this.errorState = {
          message: 'Failed to create WebSocket connection',
          details: error
        };
        reject(error);
        this.scheduleReconnect(token);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   * @param {Object} message - Parsed message data
   * @param {string} token - Authentication token (for reconnects)
   * @param {Function} resolve - Promise resolve function for connect
   * @param {Function} reject - Promise reject function for connect
   */
  handleMessage(message, token, resolve, reject) {
    // First, check if this is a response to a pending request
    if (message.requestId && this.pendingRequests.has(message.requestId)) {
      const { resolve: requestResolve, reject: requestReject } = this.pendingRequests.get(message.requestId);
      
      if (message.type === 'error') {
        requestReject(new Error(message.message || 'Unknown error'));
      } else {
        requestResolve(message);
      }
      
      this.pendingRequests.delete(message.requestId);
      return;
    }
    
    // Handle different message types
    switch (message.type) {
      case 'auth_success':
        console.log('[WebSocketService] Successfully authenticated');
        this.userId = message.userId;
        this.connectionStatus = 'connected';
        resolve(); // Resolve the connect Promise
        this.dispatchEvent('connected', { userId: message.userId });
        this.dispatchEvent('status:change', { status: 'connected' });
        break;
        
      case 'auth_error':
        console.error('[WebSocketService] Authentication failed:', message.message);
        this.connectionStatus = 'auth_error';
        reject(new Error(message.message || 'Authentication failed'));
        this.dispatchEvent('auth:error', { message: message.message });
        break;
        
      case 'ping':
        // Respond with pong
        this.send({ type: 'pong' });
        break;
        
      // Group chat related messages
      case 'group_chat_message':
        this.dispatchEvent('group:message', message);
        break;
        
      case 'group_message_sent':
        this.dispatchEvent('group:message:ack', message);
        break;
        
      case 'group_message_history':
        this.dispatchEvent('group:message:history', message);
        break;
        
      case 'marked_group_read_success':
        this.dispatchEvent('group:message:read', message);
        break;
        
      // Direct message related events
      case 'chat_message':
        this.dispatchEvent('direct:message', message);
        break;
        
      case 'message_ack':
        this.dispatchEvent('direct:message:ack', message);
        break;
        
      case 'message_read':
        this.dispatchEvent('direct:message:read', message);
        break;
        
      case 'user_status':
        this.dispatchEvent('user:status', message);
        break;
        
      case 'error':
        console.error('[WebSocketService] Received error:', message.message);
        this.dispatchEvent('error', message);
        break;
        
      default:
        // Dispatch as generic event
        this.dispatchEvent('message', message);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Normal closure');
      this.socket = null;
    }
    
    this.clearHeartbeat();
    this.connectionStatus = 'disconnected';
    this.isConnected = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Send a message through WebSocket
   * @param {Object} message - Message to send
   * @returns {boolean} Success status
   */
  send(message) {
    if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('[WebSocketService] Queueing message for later:', message);
      this.messageQueue.push(message);
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('[WebSocketService] Error sending message:', error);
      this.messageQueue.push(message);
      return false;
    }
  }

  /**
   * Send a request and expect a response
   * @param {Object} message - Message to send
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Resolves with the response
   */
  sendRequest(message, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      const requestMessage = { ...message, requestId };
      
      // Add to pending requests map
      this.pendingRequests.set(requestId, { resolve, reject, timestamp: Date.now() });
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          reject(new Error('Request timed out'));
          this.pendingRequests.delete(requestId);
        }
      }, timeout);
      
      // Send the request
      const sent = this.send(requestMessage);
      
      if (!sent) {
        // If immediate send failed, update the pending request to retry when connected
        this.pendingRequests.set(requestId, { 
          resolve, 
          reject, 
          timestamp: Date.now(),
          message: requestMessage,
          timeoutId
        });
      }
    });
  }

  /**
   * Get the message history for a group
   * @param {number|string} groupId - Group ID
   * @param {Object} options - Additional options like pagination
   * @returns {Promise} Resolves with message history
   */
  getGroupMessageHistory(groupId, options = {}) {
    return this.sendRequest({
      type: 'get_group_message_history',
      groupId,
      ...options
    })
    .then(response => {
      // Extract messages from the response
      return response.messages || [];
    });
  }

  /**
   * Send a group message
   * @param {number|string} groupId - Group ID
   * @param {string} content - Message content
   * @returns {Promise} Resolves when message is acknowledged
   */
  sendGroupMessage(groupId, content) {
    const tempId = `temp_${Date.now()}`;
    return this.sendRequest({
      type: 'group_chat_message',
      groupId,
      content,
      tempId
    });
  }

  /**
   * Mark group messages as read
   * @param {number|string} groupId - Group ID
   * @returns {Promise} Resolves when successfully marked as read
   */
  markGroupMessagesAsRead(groupId) {
    return this.sendRequest({
      type: 'mark_group_read',
      groupId
    });
  }

  /**
   * Create a new group
   * @param {Object} groupData - Group data
   * @returns {Promise} Resolves with created group
   */
  createGroup(groupData) {
    return this.sendRequest({
      type: 'create_group',
      ...groupData
    });
  }

  /**
   * Update a group's name
   * @param {number|string} groupId - Group ID
   * @param {string} name - New group name
   * @returns {Promise} Resolves when updated
   */
  updateGroupName(groupId, name) {
    return this.sendRequest({
      type: 'update_group',
      groupId,
      name
    });
  }

  /**
   * Add a member to a group
   * @param {number|string} groupId - Group ID
   * @param {number|string} userId - User ID to add
   * @returns {Promise} Resolves when member is added
   */
  addGroupMember(groupId, userId) {
    return this.sendRequest({
      type: 'add_group_member',
      groupId,
      userId
    });
  }

  /**
   * Remove a member from a group
   * @param {number|string} groupId - Group ID
   * @param {number|string} userId - User ID to remove
   * @returns {Promise} Resolves when member is removed
   */
  removeGroupMember(groupId, userId) {
    return this.sendRequest({
      type: 'remove_group_member',
      groupId,
      userId
    });
  }

  /**
   * Leave a group
   * @param {number|string} groupId - Group ID
   * @returns {Promise} Resolves when successfully left the group
   */
  leaveGroup(groupId) {
    return this.sendRequest({
      type: 'leave_group',
      groupId
    });
  }

  /**
   * Delete a group
   * @param {number|string} groupId - Group ID
   * @returns {Promise} Resolves when group is deleted
   */
  deleteGroup(groupId) {
    return this.sendRequest({
      type: 'delete_group',
      groupId
    });
  }

  /**
   * Fetch user's group chats
   * @returns {Promise} Resolves with group chats
   */
  fetchGroupChats() {
    return fetch('/api/chat/groups', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch group chats: ${response.status}`);
      }
      return response.json();
    });
  }

  /**
   * Fetch user's chat partners (direct message users)
   * @returns {Promise} Resolves with chat partners
   */
  fetchChatPartners() {
    return fetch('/api/chat/partners', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch chat partners: ${response.status}`);
      }
      return response.json();
    });
  }

  /**
   * Get message history with a specific user
   * @param {number|string} partnerId - User ID of the chat partner
   * @param {Object} options - Additional options like pagination
   * @returns {Promise} Resolves with message history
   */
  getDirectMessageHistory(partnerId, options = {}) {
    return this.sendRequest({
      type: 'get_direct_message_history',
      partnerId,
      ...options
    })
    .then(response => {
      // Extract messages from the response
      return response.messages || [];
    });
  }

  /**
   * Send a direct message to a user
   * @param {number|string} recipientId - Recipient user ID
   * @param {string} content - Message content
   * @returns {Promise} Resolves when message is acknowledged
   */
  sendDirectMessage(recipientId, content) {
    const tempId = `temp_${Date.now()}`;
    return this.sendRequest({
      type: 'direct_message',
      recipientId,
      content,
      tempId
    });
  }

  /**
   * Mark direct messages as read
   * @param {number|string} partnerId - Partner's user ID
   * @returns {Promise} Resolves when successfully marked as read
   */
  markDirectMessagesAsRead(partnerId) {
    return this.sendRequest({
      type: 'mark_direct_read',
      partnerId
    });
  }

  /**
   * Process queued messages
   */
  processQueue() {
    if (!this.isConnected || !this.socket || this.messageQueue.length === 0) return;
    
    console.log(`[WebSocketService] Processing ${this.messageQueue.length} queued messages`);
    const queue = [...this.messageQueue];
    this.messageQueue = [];
    
    for (const message of queue) {
      this.send(message);
    }
    
    // Also check for pending requests that need to be resent
    for (const [requestId, request] of this.pendingRequests.entries()) {
      if (request.message) {
        this.send(request.message);
        
        // Update the pending request to remove the message
        this.pendingRequests.set(requestId, {
          resolve: request.resolve,
          reject: request.reject,
          timestamp: request.timestamp,
          timeoutId: request.timeoutId
        });
      }
    }
  }

  /**
   * Reject all pending requests
   * @param {string} reason - Rejection reason
   */
  rejectAllPendingRequests(reason) {
    for (const [requestId, { reject, timeoutId }] of this.pendingRequests.entries()) {
      if (timeoutId) clearTimeout(timeoutId);
      reject(new Error(reason));
      this.pendingRequests.delete(requestId);
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   * @param {string} token - Authentication token
   */
  scheduleReconnect(token) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts += 1;
    const maxAttempts = 20;
    
    if (this.reconnectAttempts <= maxAttempts) {
      this.connectionStatus = `reconnecting:${this.reconnectAttempts}`;
      this.dispatchEvent('status:change', { status: this.connectionStatus });
      
      // Exponential backoff with max of 30 seconds
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
      console.log(`[WebSocketService] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${maxAttempts})`);
      
      this.reconnectTimer = setTimeout(() => {
        console.log(`[WebSocketService] Attempting to reconnect (${this.reconnectAttempts}/${maxAttempts})`);
        this.connect(token).catch(error => {
          console.error('[WebSocketService] Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.log('[WebSocketService] Max reconnection attempts reached');
      this.connectionStatus = 'failed';
      this.dispatchEvent('status:change', { status: 'failed' });
      this.dispatchEvent('connection:failed', { attempts: this.reconnectAttempts });
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.clearHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
        console.log('[WebSocketService] Application-level ping sent');
      }
    }, 20000); // 20 seconds
  }

  /**
   * Clear heartbeat interval
   */
  clearHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  removeEventListener(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  /**
   * Dispatch an event to listeners
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  dispatchEvent(event, data) {
    if (!this.listeners[event]) return;
    for (const callback of this.listeners[event]) {
      try {
        callback(data);
      } catch (error) {
        console.error(`[WebSocketService] Error in event listener for ${event}:`, error);
      }
    }
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;
