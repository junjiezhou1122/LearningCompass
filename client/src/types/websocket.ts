/**
 * WebSocket Message Type Definitions
 * These types define the structure of messages exchanged between client and server
 */

// Base message interface
export interface WebSocketMessage {
  type: string;
  timestamp?: string;
}

// Authentication messages
export interface AuthRequestMessage extends WebSocketMessage {
  type: "auth";
  token: string;
}

export interface AuthSuccessMessage extends WebSocketMessage {
  type: "auth_success";
  userId: number;
  message: string;
}

export interface AuthErrorMessage extends WebSocketMessage {
  type: "error";
  message: string;
}

// Direct chat messages
export interface ChatMessage extends WebSocketMessage {
  type: "chat_message";
  content: string;
  receiverId: number;
  tempId: string;
  userId?: number;
}

export interface ChatMessageSentResponse extends WebSocketMessage {
  type: "message_sent";
  message: {
    id: number;
    content: string;
    senderId: number;
    receiverId: number;
    createdAt: string;
    isRead: boolean;
    sender?: UserInfo;
  };
  tempId: string;
}

export interface NewMessageNotification extends WebSocketMessage {
  type: "new_message";
  message: {
    id: number;
    content: string;
    senderId: number;
    receiverId: number;
    createdAt: string;
    isRead: boolean;
    sender?: UserInfo;
  };
}

// Group chat messages
export interface GroupMessage extends WebSocketMessage {
  type: "group_message";
  content: string;
  groupId: number;
  tempId: string;
  userId?: number;
}

export interface GroupMessageSentResponse extends WebSocketMessage {
  type: "group_message_sent";
  message: {
    id: number;
    content: string;
    senderId: number;
    groupId: number;
    createdAt: string;
    sender?: UserInfo;
  };
  tempId: string;
}

// Room messages
export interface RoomMessage extends WebSocketMessage {
  type: "room_message";
  content: string;
  roomId: string | number;
  tempId: string;
  userId?: number;
}

export interface JoinRoomMessage extends WebSocketMessage {
  type: "join_room";
  roomId: string | number;
  userId?: number;
}

export interface LeaveRoomMessage extends WebSocketMessage {
  type: "leave_room";
  roomId: string | number;
  userId?: number;
}

// Read receipts
export interface MarkReadMessage extends WebSocketMessage {
  type: "mark_read";
  senderId: number;
  userId?: number;
}

export interface MessagesReadNotification extends WebSocketMessage {
  type: "messages_read";
  readBy: number;
}

// Connection status messages
export interface PingMessage extends WebSocketMessage {
  type: "ping";
  timestamp: number;
}

export interface PongMessage extends WebSocketMessage {
  type: "pong";
  timestamp: number;
  originalTimestamp: number;
}

// User info type used in messages
export interface UserInfo {
  id: number;
  username: string;
  displayName?: string;
  profileImage?: string;
}

// Union type of all possible incoming messages
export type IncomingWebSocketMessage =
  | AuthSuccessMessage
  | AuthErrorMessage
  | ChatMessageSentResponse
  | NewMessageNotification
  | GroupMessageSentResponse
  | MessagesReadNotification
  | PingMessage;

// Union type of all possible outgoing messages
export type OutgoingWebSocketMessage =
  | AuthRequestMessage
  | ChatMessage
  | GroupMessage
  | RoomMessage
  | JoinRoomMessage
  | LeaveRoomMessage
  | MarkReadMessage
  | PongMessage;
