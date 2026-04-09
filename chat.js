const Message = require('../models/Message');
const User = require('../models/User');
const Meeting = require('../models/Meeting');

// Socket.io chat handler
const chatHandler = (io) => {
  // Store online users and their socket IDs
  const onlineUsers = new Map();
  const roomUsers = new Map(); // roomId -> Set of socket IDs

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a meeting room
    socket.on('join-room', async ({ roomId, userId, token }) => {
      try {
        // Verify token (simplified - in production, verify JWT properly)
        const user = await User.findById(userId);
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        // Verify meeting exists
        const meeting = await Meeting.findOne({ roomId: roomId.toUpperCase() });
        if (!meeting) {
          socket.emit('error', { message: 'Meeting not found' });
          return;
        }

        // Join socket room
        socket.join(roomId);
        
        // Track user in room
        if (!roomUsers.has(roomId)) {
          roomUsers.set(roomId, new Set());
        }
        roomUsers.get(roomId).add(socket.id);
        
        // Store user info
        onlineUsers.set(socket.id, {
          userId,
          roomId,
          name: user.name,
          avatar: user.avatar
        });

        // Notify others in room
        socket.to(roomId).emit('user-joined', {
          user: {
            id: user._id,
            name: user.name,
            avatar: user.avatar
          }
        });

        // Send current room users list
        const roomSockets = Array.from(roomUsers.get(roomId) || []);
        const roomUsersInfo = roomSockets.map(sid => onlineUsers.get(sid)).filter(Boolean);
        
        socket.emit('room-users', roomUsersInfo);

      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Send message
    socket.on('send-message', async ({ roomId, message, userId }) => {
      try {
        const user = await User.findById(userId);
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        // Verify meeting exists
        const meeting = await Meeting.findOne({ roomId: roomId.toUpperCase() });
        if (!meeting) {
          socket.emit('error', { message: 'Meeting not found' });
          return;
        }

        // Create message object
        const messageData = {
          id: Date.now().toString(), // Simple ID generation
          user: {
            id: user._id,
            name: user.name,
            avatar: user.avatar
          },
          message: message.trim(),
          timestamp: new Date(),
          roomId
        };

        // Broadcast to all users in room
        io.to(roomId).emit('new-message', messageData);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle WebRTC signaling
    socket.on('offer', ({ roomId, offer, targetUserId }) => {
      socket.to(roomId).emit('offer', {
        offer,
        fromUserId: onlineUsers.get(socket.id)?.userId,
        fromSocketId: socket.id
      });
    });

    socket.on('answer', ({ roomId, answer, targetUserId }) => {
      socket.to(roomId).emit('answer', {
        answer,
        fromUserId: onlineUsers.get(socket.id)?.userId,
        fromSocketId: socket.id
      });
    });

    socket.on('ice-candidate', ({ roomId, candidate, targetUserId }) => {
      socket.to(roomId).emit('ice-candidate', {
        candidate,
        fromUserId: onlineUsers.get(socket.id)?.userId,
        fromSocketId: socket.id
      });
    });

    // Handle video/audio toggle
    socket.on('toggle-video', ({ roomId, isVideoOn }) => {
      const userInfo = onlineUsers.get(socket.id);
      if (userInfo) {
        socket.to(roomId).emit('user-video-toggled', {
          userId: userInfo.userId,
          isVideoOn
        });
      }
    });

    socket.on('toggle-audio', ({ roomId, isAudioOn }) => {
      const userInfo = onlineUsers.get(socket.id);
      if (userInfo) {
        socket.to(roomId).emit('user-audio-toggled', {
          userId: userInfo.userId,
          isAudioOn
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      
      const userInfo = onlineUsers.get(socket.id);
      if (userInfo) {
        const { roomId, userId } = userInfo;
        
        // Remove from room tracking
        if (roomUsers.has(roomId)) {
          roomUsers.get(roomId).delete(socket.id);
          if (roomUsers.get(roomId).size === 0) {
            roomUsers.delete(roomId);
          }
        }
        
        // Remove user from meeting participants
        try {
          const meeting = await Meeting.findOne({ roomId: roomId.toUpperCase() });
          if (meeting) {
            await meeting.removeParticipant(userId);
          }
        } catch (error) {
          console.error('Error removing participant on disconnect:', error);
        }
        
        // Notify others in room
        socket.to(roomId).emit('user-left', {
          userId
        });
        
        // Remove from online users
        onlineUsers.delete(socket.id);
      }
    });

    // Leave room
    socket.on('leave-room', async ({ roomId, userId }) => {
      try {
        const userInfo = onlineUsers.get(socket.id);
        if (userInfo && userInfo.roomId === roomId) {
          // Remove from room tracking
          if (roomUsers.has(roomId)) {
            roomUsers.get(roomId).delete(socket.id);
            if (roomUsers.get(roomId).size === 0) {
              roomUsers.delete(roomId);
            }
          }
          
          // Remove user from meeting participants
          const meeting = await Meeting.findOne({ roomId: roomId.toUpperCase() });
          if (meeting) {
            await meeting.removeParticipant(userId);
          }
          
          // Leave socket room
          socket.leave(roomId);
          
          // Notify others
          socket.to(roomId).emit('user-left', { userId });
          
          // Update user info
          onlineUsers.delete(socket.id);
        }
      } catch (error) {
        console.error('Leave room error:', error);
        socket.emit('error', { message: 'Failed to leave room' });
      }
    });
  });
};

module.exports = chatHandler;
