/**
 * WebSocket Monitoring Utility
 * Provides monitoring for WebSocket connections, message throughput, and errors
 */
import fs from "fs";
import path from "path";

class WebSocketMonitor {
  constructor(options = {}) {
    // Configure options with defaults
    this.options = {
      logToConsole: true,
      logToFile: false,
      logFilePath: path.join(process.cwd(), "logs", "websocket-monitor.log"),
      statInterval: 60000, // Stats collection interval in ms (1 minute)
      ...options,
    };

    // Create stats object to track metrics
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0,
      messageTypes: {},
      reconnects: 0,
      averageLatency: 0,
      latencySamples: 0,
      latencyTotal: 0,
      startTime: Date.now(),
    };

    // Ensure log directory exists if logging to file
    if (this.options.logToFile) {
      const logDir = path.dirname(this.options.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }

    // Start periodic stats logging
    this.startStatsCollection();
  }

  // Track a new connection
  trackConnection() {
    this.stats.totalConnections++;
    this.stats.activeConnections++;
    this.log(
      `New connection. Active: ${this.stats.activeConnections}, Total: ${this.stats.totalConnections}`
    );
  }

  // Track a connection close
  trackDisconnection(code, reason) {
    this.stats.activeConnections = Math.max(
      0,
      this.stats.activeConnections - 1
    );
    this.log(
      `Connection closed (${code}: ${
        reason || "No reason"
      }). Active connections: ${this.stats.activeConnections}`
    );
  }

  // Track reconnection attempts
  trackReconnect() {
    this.stats.reconnects++;
    this.log(
      `Reconnection attempt. Total reconnects: ${this.stats.reconnects}`
    );
  }

  // Track received messages
  trackMessageReceived(messageType) {
    this.stats.messagesReceived++;

    // Track message type distribution
    if (!this.stats.messageTypes[messageType]) {
      this.stats.messageTypes[messageType] = { received: 0, sent: 0 };
    }
    this.stats.messageTypes[messageType].received++;
  }

  // Track sent messages
  trackMessageSent(messageType) {
    this.stats.messagesSent++;

    // Track message type distribution
    if (!this.stats.messageTypes[messageType]) {
      this.stats.messageTypes[messageType] = { received: 0, sent: 0 };
    }
    this.stats.messageTypes[messageType].sent++;
  }

  // Track errors
  trackError(error) {
    this.stats.errors++;
    this.log(`WebSocket error: ${error.message || error}`, "error");
  }

  // Track message latency (time between request and response)
  trackLatency(latencyMs) {
    this.stats.latencySamples++;
    this.stats.latencyTotal += latencyMs;
    this.stats.averageLatency =
      this.stats.latencyTotal / this.stats.latencySamples;
  }

  // Reset stats for a new collection period
  resetStats() {
    const previousStats = { ...this.stats };

    // Reset counters but keep totals
    this.stats.messagesReceived = 0;
    this.stats.messagesSent = 0;
    this.stats.errors = 0;
    this.stats.reconnects = 0;
    this.stats.messageTypes = {};
    this.stats.latencySamples = 0;
    this.stats.latencyTotal = 0;
    this.stats.averageLatency = 0;

    return previousStats;
  }

  // Start periodic stats collection
  startStatsCollection() {
    this.statsInterval = setInterval(() => {
      const previousStats = this.resetStats();

      const now = Date.now();
      const uptime = now - previousStats.startTime;

      const statsReport = {
        timestamp: new Date().toISOString(),
        uptime: this.formatUptime(uptime),
        activeConnections: previousStats.activeConnections,
        totalConnections: previousStats.totalConnections,
        messagesReceived: previousStats.messagesReceived,
        messagesSent: previousStats.messagesSent,
        errors: previousStats.errors,
        reconnects: previousStats.reconnects,
        messageTypes: previousStats.messageTypes,
        averageLatency: previousStats.averageLatency.toFixed(2) + "ms",
      };

      this.log(
        `WebSocket Stats: ${JSON.stringify(statsReport, null, 2)}`,
        "info"
      );
    }, this.options.statInterval);
  }

  // Stop stats collection
  stopStatsCollection() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
  }

  // Format uptime to human-readable string
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
  }

  // Log utility function
  log(message, level = "info") {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    // Log to console if enabled
    if (this.options.logToConsole) {
      const consoleMethod = level === "error" ? "error" : "log";
      console[consoleMethod](logMessage);
    }

    // Log to file if enabled
    if (this.options.logToFile) {
      fs.appendFileSync(this.options.logFilePath, logMessage + "\n", {
        encoding: "utf8",
      });
    }
  }
}

// Create singleton instance
const monitor = new WebSocketMonitor();

export default monitor;
