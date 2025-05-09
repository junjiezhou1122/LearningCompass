/**
 * chatService.js - Centralized service for chat functionality
 * Handles all chat-related API calls and WebSocket interactions
 */

import axios from "axios";

const API_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";

// API calls for chat functionality
export const getChatRooms = async () => {
  try {
    const response = await axios.get(`${API_URL}/chat/rooms`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    throw error;
  }
};

export const createChatRoom = async (roomName) => {
  try {
    const response = await axios.post(
      `${API_URL}/chat/rooms`,
      { name: roomName },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating chat room:", error);
    throw error;
  }
};

export const joinChatRoom = async (roomId) => {
  try {
    const response = await axios.post(
      `${API_URL}/chat/rooms/${roomId}/join`,
      {},
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Error joining chat room:", error);
    throw error;
  }
};

export const leaveChatRoom = async (roomId) => {
  try {
    const response = await axios.post(
      `${API_URL}/chat/rooms/${roomId}/leave`,
      {},
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Error leaving chat room:", error);
    throw error;
  }
};

export const getRoomMessages = async (roomId) => {
  try {
    const response = await axios.get(
      `${API_URL}/chat/rooms/${roomId}/messages`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching room messages:", error);
    throw error;
  }
};

// Direct chat functionality
export const getUserDetails = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};

export const getDirectChatHistory = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/chat/messages/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

export const searchUsers = async (query) => {
  try {
    const response = await axios.get(
      `${API_URL}/users/search?q=${encodeURIComponent(query)}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
};

export const getFollowers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users/followers`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching followers:", error);
    throw error;
  }
};

export const getRecentChats = async () => {
  try {
    const response = await axios.get(`${API_URL}/chat/recent`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching recent chats:", error);
    throw error;
  }
};

// Group chat functionality
export const getGroupInfo = async (groupId) => {
  try {
    const response = await axios.get(`${API_URL}/chat/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching group info:", error);
    throw error;
  }
};

export const getGroupChatHistory = async (groupId) => {
  try {
    const response = await axios.get(
      `${API_URL}/chat/groups/${groupId}/messages`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching group chat history:", error);
    throw error;
  }
};

export const createGroup = async (groupData) => {
  try {
    const response = await axios.post(`${API_URL}/chat/groups`, groupData, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
};

// Room management functions
export const getRooms = async () => {
  try {
    const response = await axios.get(`${API_URL}/chat/rooms`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw error;
  }
};

export const getPublicRooms = async () => {
  try {
    const response = await axios.get(`${API_URL}/chat/rooms/public`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching public rooms:", error);
    throw error;
  }
};

export const createRoom = async (roomData) => {
  try {
    const response = await axios.post(`${API_URL}/chat/rooms`, roomData, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

export const joinRoom = async (roomId) => {
  try {
    const response = await axios.post(
      `${API_URL}/chat/rooms/${roomId}/join`,
      {},
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Error joining room:", error);
    throw error;
  }
};

export const leaveRoom = async (roomId) => {
  try {
    const response = await axios.post(
      `${API_URL}/chat/rooms/${roomId}/leave`,
      {},
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Error leaving room:", error);
    throw error;
  }
};

export const getRoomMembers = async (roomId) => {
  try {
    const response = await axios.get(
      `${API_URL}/chat/rooms/${roomId}/members`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching room members:", error);
    throw error;
  }
};
