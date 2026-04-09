import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setSocket(newSocket);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setSocket(null);
      });

      // Handle errors
      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user, token]);

  // Join room
  const joinRoom = (roomId) => {
    if (socket && user) {
      socket.emit('join-room', {
        roomId,
        userId: user.id,
        token
      });
    }
  };

  // Leave room
  const leaveRoom = (roomId) => {
    if (socket && user) {
      socket.emit('leave-room', {
        roomId,
        userId: user.id
      });
    }
  };

  // Send message
  const sendMessage = (roomId, message) => {
    if (socket && user) {
      socket.emit('send-message', {
        roomId,
        message,
        userId: user.id
      });
    }
  };

  // WebRTC signaling functions
  const sendOffer = (roomId, offer, targetUserId) => {
    if (socket) {
      socket.emit('offer', { roomId, offer, targetUserId });
    }
  };

  const sendAnswer = (roomId, answer, targetUserId) => {
    if (socket) {
      socket.emit('answer', { roomId, answer, targetUserId });
    }
  };

  const sendIceCandidate = (roomId, candidate, targetUserId) => {
    if (socket) {
      socket.emit('ice-candidate', { roomId, candidate, targetUserId });
    }
  };

  // Toggle video/audio
  const toggleVideo = (roomId, isVideoOn) => {
    if (socket) {
      socket.emit('toggle-video', { roomId, isVideoOn });
    }
  };

  const toggleAudio = (roomId, isAudioOn) => {
    if (socket) {
      socket.emit('toggle-audio', { roomId, isAudioOn });
    }
  };

  const value = {
    socket,
    onlineUsers,
    messages,
    setOnlineUsers,
    setMessages,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    toggleVideo,
    toggleAudio,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
