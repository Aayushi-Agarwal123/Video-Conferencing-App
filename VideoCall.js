import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Users, 
  MessageSquare, 
  Copy, 
  Check,
  Monitor,
  Maximize2,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const VideoCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinRoom, leaveRoom, sendOffer, sendAnswer, sendIceCandidate, toggleVideo, toggleAudio } = useSocket();

  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInCall, setIsInCall] = useState(false);

  const localVideoRef = useRef(null);
  const peerConnections = useRef(new Map());
  const messagesEndRef = useRef(null);

  // WebRTC configuration
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  useEffect(() => {
    if (!roomId || !user) {
      navigate('/dashboard');
      return;
    }

    initializeCall();
    
    return () => {
      cleanup();
    };
  }, [roomId, user]);

  useEffect(() => {
    if (socket) {
      // Socket event listeners
      socket.on('user-joined', handleUserJoined);
      socket.on('user-left', handleUserLeft);
      socket.on('offer', handleOffer);
      socket.on('answer', handleAnswer);
      socket.on('ice-candidate', handleIceCandidate);
      socket.on('new-message', handleNewMessage);
      socket.on('room-users', handleRoomUsers);
      socket.on('user-video-toggled', handleUserVideoToggled);
      socket.on('user-audio-toggled', handleUserAudioToggled);
      socket.on('error', handleError);

      return () => {
        socket.off('user-joined', handleUserJoined);
        socket.off('user-left', handleUserLeft);
        socket.off('offer', handleOffer);
        socket.off('answer', handleAnswer);
        socket.off('ice-candidate', handleIceCandidate);
        socket.off('new-message', handleNewMessage);
        socket.off('room-users', handleRoomUsers);
        socket.off('user-video-toggled', handleUserVideoToggled);
        socket.off('user-audio-toggled', handleUserAudioToggled);
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

  const initializeCall = async () => {
    try {
      // Get meeting details
      const response = await fetch(`/api/meeting/${roomId}`);
      const data = await response.json();
      setMeeting(data.meeting);

      // Join room
      joinRoom(roomId);

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setIsInCall(true);
    } catch (error) {
      console.error('Failed to initialize call:', error);
      toast.error('Failed to initialize video call');
      navigate('/dashboard');
    }
  };

  const createPeerConnection = (userId) => {
    const pc = new RTCPeerConnection(configuration);

    // Add local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      setRemoteStreams(prev => new Map(prev.set(userId, event.streams[0])));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendIceCandidate(roomId, event.candidate, userId);
      }
    };

    peerConnections.current.set(userId, pc);
    return pc;
  };

  const handleUserJoined = (data) => {
    const newUser = data.user;
    setParticipants(prev => [...prev.filter(p => p.id !== newUser.id), newUser]);
    
    // Create peer connection for new user
    const pc = createPeerConnection(newUser.id);
    
    // Create and send offer
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        sendOffer(roomId, pc.localDescription, newUser.id);
      });
  };

  const handleUserLeft = (data) => {
    const { userId } = data;
    setParticipants(prev => prev.filter(p => p.id !== userId));
    
    // Clean up peer connection
    const pc = peerConnections.current.get(userId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(userId);
    }
    
    // Remove remote stream
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });
  };

  const handleOffer = async (data) => {
    const { offer, fromUserId } = data;
    let pc = peerConnections.current.get(fromUserId);
    
    if (!pc) {
      pc = createPeerConnection(fromUserId);
    }
    
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sendAnswer(roomId, answer, fromUserId);
  };

  const handleAnswer = async (data) => {
    const { answer, fromUserId } = data;
    const pc = peerConnections.current.get(fromUserId);
    
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleIceCandidate = async (data) => {
    const { candidate, fromUserId } = data;
    const pc = peerConnections.current.get(fromUserId);
    
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const handleNewMessage = (messageData) => {
    setMessages(prev => [...prev, messageData]);
  };

  const handleRoomUsers = (users) => {
    setParticipants(users.filter(u => u.userId !== user.id));
  };

  const handleUserVideoToggled = (data) => {
    setParticipants(prev => prev.map(p => 
      p.id === data.userId ? { ...p, isVideoOn: data.isVideoOn } : p
    ));
  };

  const handleUserAudioToggled = (data) => {
    setParticipants(prev => prev.map(p => 
      p.id === data.userId ? { ...p, isAudioOn: data.isAudioOn } : p
    ));
  };

  const handleError = (error) => {
    console.error('Socket error:', error);
    toast.error(error.message || 'An error occurred');
  };

  const toggleVideoStream = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
        toggleVideo(roomId, !isVideoOn);
      }
    }
  };

  const toggleAudioStream = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn;
        setIsAudioOn(!isAudioOn);
        toggleAudio(roomId, !isAudioOn);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
        }
        
        // Get camera stream again
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const cameraTrack = cameraStream.getVideoTracks()[0];
        
        // Replace track in all peer connections
        peerConnections.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(cameraTrack);
          }
        });
        
        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = cameraStream;
        }
        
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Replace track in all peer connections
        peerConnections.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });
        
        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        // Handle screen share end
        screenTrack.onended = () => {
          toggleScreenShare();
        };
        
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error('Screen share error:', error);
      toast.error('Failed to toggle screen sharing');
    }
  };

  const leaveCall = () => {
    cleanup();
    navigate('/dashboard');
  };

  const cleanup = () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    
    // Leave room
    if (socket && roomId) {
      leaveRoom(roomId);
    }
    
    setIsInCall(false);
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

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      socket.emit('send-message', {
        roomId,
        message: newMessage.trim(),
        userId: user.id
      });
      setNewMessage('');
    }
  };

  if (!isInCall) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Initializing video call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-secondary-900">
      {/* Header */}
      <div className="bg-secondary-800 border-b border-secondary-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-white font-semibold">
              {meeting?.title || 'Meeting'} - Room: {roomId}
            </h1>
            <button
              onClick={copyRoomId}
              className="text-secondary-400 hover:text-white transition-colors"
              title="Copy Room ID"
            >
              {copiedRoomId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-secondary-400 text-sm">
              {participants.length + 1} participants
            </span>
            <button
              onClick={leaveCall}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-full">
            {/* Local Video */}
            <div className="relative bg-secondary-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                You {isVideoOn ? '' : '(Video Off)'}
              </div>
              {!isVideoOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary-800">
                  <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Remote Videos */}
            {Array.from(remoteStreams.entries()).map(([userId, stream]) => {
              const participant = participants.find(p => p.userId === userId);
              return (
                <div key={userId} className="relative bg-secondary-800 rounded-lg overflow-hidden">
                  <video
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    ref={(video) => {
                      if (video && video.srcObject !== stream) {
                        video.srcObject = stream;
                      }
                    }}
                  />
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    {participant?.name || 'User'} {participant?.isVideoOn === false ? '(Video Off)' : ''}
                  </div>
                  {participant?.isVideoOn === false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-secondary-800">
                      <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="bg-black bg-opacity-50 rounded-full px-6 py-3 flex items-center space-x-4">
              <button
                onClick={toggleVideoStream}
                className={`p-3 rounded-full transition-colors ${
                  isVideoOn 
                    ? 'bg-secondary-700 hover:bg-secondary-600 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title={isVideoOn ? 'Turn off video' : 'Turn on video'}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              
              <button
                onClick={toggleAudioStream}
                className={`p-3 rounded-full transition-colors ${
                  isAudioOn 
                    ? 'bg-secondary-700 hover:bg-secondary-600 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title={isAudioOn ? 'Mute' : 'Unmute'}
              >
                {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              
              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-full transition-colors ${
                  isScreenSharing 
                    ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                    : 'bg-secondary-700 hover:bg-secondary-600 text-white'
                }`}
                title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
              >
                <Monitor className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`p-3 rounded-full transition-colors ${
                  showParticipants 
                    ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                    : 'bg-secondary-700 hover:bg-secondary-600 text-white'
                }`}
                title="Participants"
              >
                <Users className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-3 rounded-full transition-colors ${
                  showChat 
                    ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                    : 'bg-secondary-700 hover:bg-secondary-600 text-white'
                }`}
                title="Chat"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-secondary-800 border-l border-secondary-700 flex flex-col">
          {/* Participants Panel */}
          {showParticipants && (
            <div className="flex-1 p-4">
              <h3 className="text-white font-semibold mb-4">Participants</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 text-white">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span>You (Host)</span>
                </div>
                {participants.map(participant => (
                  <div key={participant.userId} className="flex items-center space-x-3 text-white">
                    <div className="w-8 h-8 bg-secondary-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <span>{participant.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Panel */}
          {showChat && (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-secondary-700">
                <h3 className="text-white font-semibold">Chat</h3>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-3">
                  {messages.map((msg, index) => (
                    <div key={msg.id || index} className="text-white">
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 bg-secondary-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-3 h-3" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{msg.user.name}</span>
                            <span className="text-xs text-secondary-400">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-secondary-200">{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              <div className="p-4 border-t border-secondary-700">
                <form onSubmit={sendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-secondary-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
