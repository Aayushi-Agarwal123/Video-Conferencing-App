import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  ArrowLeft, 
  Send, 
  Users, 
  MessageSquare, 
  Phone, 
  Video,
  Copy,
  Check,
  Smile,
  Paperclip
} from 'lucide-react';
import toast from 'react-hot-toast';

const Chat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinRoom, leaveRoom, sendMessage, onlineUsers, setMessages, messages } = useSocket();

  const [meeting, setMeeting] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [copiedRoomId, setCopiedRoomId] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!roomId || !user) {
      navigate('/dashboard');
      return;
    }

    initializeChat();
    
    return () => {
      cleanup();
    };
  }, [roomId, user]);

  useEffect(() => {
    if (socket) {
      // Socket event listeners
      socket.on('connect', () => {
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('new-message', handleNewMessage);
      socket.on('room-users', handleRoomUsers);
      socket.on('user-joined', handleUserJoined);
      socket.on('user-left', handleUserLeft);
      socket.on('error', handleError);

      return () => {
        socket.off('new-message', handleNewMessage);
        socket.off('room-users', handleRoomUsers);
        socket.off('user-joined', handleUserJoined);
        socket.off('user-left', handleUserLeft);
        socket.off('error', handleError);
      };
    }
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      // Get meeting details
      const response = await fetch(`/api/meeting/${roomId}`);
      const data = await response.json();
      setMeeting(data.meeting);

      // Join room
      if (socket) {
        joinRoom(roomId);
      }

      // Clear previous messages
      setMessages([]);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      toast.error('Failed to load chat room');
      navigate('/dashboard');
    }
  };

  const handleNewMessage = (messageData) => {
    setMessages(prev => [...prev, messageData]);
  };

  const handleRoomUsers = (users) => {
    // Users are handled by SocketContext
  };

  const handleUserJoined = (data) => {
    toast.success(`${data.user.name} joined the chat`);
  };

  const handleUserLeft = (data) => {
    toast(`${data.userId} left the chat`);
  };

  const handleError = (error) => {
    console.error('Socket error:', error);
    toast.error(error.message || 'An error occurred');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (newMessage.trim() && socket) {
      sendMessage(roomId, newMessage.trim());
      setNewMessage('');
      inputRef.current?.focus();
    }
  };

  const cleanup = () => {
    if (socket && roomId) {
      leaveRoom(roomId);
    }
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedRoomId(true);
      toast.success('Room ID copied to clipboard!');
      setTimeout(() => setCopiedRoomId(false), 2000);
    } catch (error) {
      toast.error('Failed to copy Room ID');
    }
  };

  const joinVideoCall = () => {
    navigate(`/meeting/${roomId}`);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      const date = formatDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  if (!meeting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading chat room...</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-secondary-600 hover:text-secondary-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-semibold text-secondary-900">{meeting.title}</h1>
              <div className="flex items-center space-x-2 text-sm text-secondary-600">
                <span>Room: {roomId}</span>
                <button
                  onClick={copyRoomId}
                  className="hover:text-secondary-900 transition-colors"
                  title="Copy Room ID"
                >
                  {copiedRoomId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
                <span>·</span>
                <span className={`flex items-center space-x-1 ${
                  isConnected ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-600' : 'bg-red-600'
                  }`}></span>
                  <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={joinVideoCall}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Join Video</span>
            </button>
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex items-center space-x-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Participants</span>
              <span className="bg-secondary-300 text-secondary-700 text-xs px-2 py-1 rounded-full">
                {onlineUsers.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-12 h-12 text-secondary-400 mb-4" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">No messages yet</h3>
                <p className="text-secondary-600 mb-6">
                  Be the first to start the conversation!
                </p>
                <div className="text-sm text-secondary-500">
                  <p>Meeting: {meeting.title}</p>
                  <p>Room ID: {roomId}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(messageGroups).map(([date, dateMessages]) => (
                  <div key={date}>
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-secondary-100 text-secondary-600 text-xs px-3 py-1 rounded-full">
                        {date}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {dateMessages.map((message, index) => (
                        <div key={message.id || index} className={`flex ${
                          message.user.id === user.id ? 'justify-end' : 'justify-start'
                        }`}>
                          <div className={`max-w-xs lg:max-w-md ${
                            message.user.id === user.id ? 'order-2' : 'order-1'
                          }`}>
                            {message.user.id !== user.id && (
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary-600">
                                    {message.user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-secondary-700">
                                  {message.user.name}
                                </span>
                                <span className="text-xs text-secondary-500">
                                  {formatTime(message.timestamp)}
                                </span>
                              </div>
                            )}
                            
                            <div className={`px-4 py-2 rounded-lg ${
                              message.user.id === user.id
                                ? 'bg-primary-600 text-white'
                                : 'bg-secondary-100 text-secondary-900'
                            }`}>
                              <p className="text-sm">{message.message}</p>
                            </div>
                            
                            {message.user.id === user.id && (
                              <div className="flex items-center justify-end mt-1">
                                <span className="text-xs text-secondary-500">
                                  {formatTime(message.timestamp)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-secondary-200 px-4 py-4">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <button
                type="button"
                className="text-secondary-500 hover:text-secondary-700 transition-colors"
                title="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              
              <button
                type="button"
                className="text-secondary-500 hover:text-secondary-700 transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-secondary-50 border border-secondary-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={!isConnected}
              />
              
              <button
                type="submit"
                disabled={!newMessage.trim() || !isConnected}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-300 text-white p-2 rounded-lg transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="w-80 bg-secondary-50 border-l border-secondary-200 flex flex-col">
            <div className="p-4 border-b border-secondary-200">
              <h3 className="font-semibold text-secondary-900">Participants ({onlineUsers.length})</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {/* Current user */}
                <div className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-secondary-900">{user.name} (You)</div>
                    <div className="text-sm text-secondary-600">Host</div>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                
                {/* Other participants */}
                {onlineUsers.map((participant) => (
                  <div key={participant.userId} className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                    <div className="w-8 h-8 bg-secondary-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-secondary-700">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-secondary-900">{participant.name}</div>
                      <div className="text-sm text-secondary-600">Participant</div>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                ))}
              </div>
              
              {onlineUsers.length === 0 && (
                <div className="text-center text-secondary-500 py-8">
                  <Users className="w-8 h-8 mx-auto mb-2 text-secondary-400" />
                  <p>No other participants</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
