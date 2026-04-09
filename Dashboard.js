import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Video, Users, Calendar, Clock, Plus, LogIn, Loader2, Copy, Check } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [joiningMeeting, setJoiningMeeting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState('');
  
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    maxParticipants: 50
  });
  
  const [joinRoomId, setJoinRoomId] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await axios.get('/api/meeting/user/meetings');
      setMeetings(response.data.meetings);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    
    if (!newMeeting.title.trim()) {
      toast.error('Meeting title is required');
      return;
    }

    setCreatingMeeting(true);
    
    try {
      const response = await axios.post('/api/meeting/create', newMeeting);
      toast.success('Meeting created successfully!');
      setShowCreateModal(false);
      setNewMeeting({ title: '', description: '', maxParticipants: 50 });
      fetchMeetings();
      
      // Navigate to meeting room
      navigate(`/meeting/${response.data.meeting.roomId}`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create meeting';
      toast.error(message);
    } finally {
      setCreatingMeeting(false);
    }
  };

  const handleJoinMeeting = async (e) => {
    e.preventDefault();
    
    if (!joinRoomId.trim()) {
      toast.error('Room ID is required');
      return;
    }

    setJoiningMeeting(true);
    
    try {
      const response = await axios.post('/api/meeting/join', { roomId: joinRoomId });
      toast.success('Joined meeting successfully!');
      setShowJoinModal(false);
      setJoinRoomId('');
      fetchMeetings();
      
      // Navigate to meeting room
      navigate(`/meeting/${response.data.meeting.roomId}`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to join meeting';
      toast.error(message);
    } finally {
      setJoiningMeeting(false);
    }
  };

  const handleCopyRoomId = async (roomId) => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedRoomId(roomId);
      toast.success('Room ID copied to clipboard!');
      setTimeout(() => setCopiedRoomId(''), 2000);
    } catch (error) {
      toast.error('Failed to copy Room ID');
    }
  };

  const handleJoinExistingMeeting = async (roomId) => {
    try {
      const response = await axios.post('/api/meeting/join', { roomId });
      navigate(`/meeting/${response.data.meeting.roomId}`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to join meeting';
      toast.error(message);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-secondary-600">
          Create or join meetings and start collaborating with your team.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowCreateModal(true)}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Plus className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">Create New Meeting</h3>
              <p className="text-secondary-600">Start a new video conference</p>
            </div>
          </div>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowJoinModal(true)}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <LogIn className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">Join Meeting</h3>
              <p className="text-secondary-600">Enter Room ID to join</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Meetings */}
      <div className="card">
        <div className="p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">Your Meetings</h2>
        </div>
        
        {meetings.length === 0 ? (
          <div className="p-12 text-center">
            <Video className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No meetings yet</h3>
            <p className="text-secondary-600 mb-6">
              Create your first meeting or join an existing one to get started.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary px-6 py-2"
              >
                Create Meeting
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="btn btn-outline px-6 py-2"
              >
                Join Meeting
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-secondary-200">
            {meetings.map((meeting) => (
              <div key={meeting._id} className="p-6 hover:bg-secondary-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-secondary-900">{meeting.title}</h3>
                      {meeting.isActive && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    
                    {meeting.description && (
                      <p className="text-secondary-600 mb-3">{meeting.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-sm text-secondary-500">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{meeting.participants.length} participants</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(meeting.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Video className="w-4 h-4" />
                        <span>Room: {meeting.roomId}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopyRoomId(meeting.roomId)}
                      className="btn btn-outline p-2"
                      title="Copy Room ID"
                    >
                      {copiedRoomId === meeting.roomId ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleJoinExistingMeeting(meeting.roomId)}
                      className="btn btn-primary px-4 py-2"
                    >
                      Join Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Create New Meeting</h2>
            <form onSubmit={handleCreateMeeting}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Meeting Title
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Enter meeting title"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Enter meeting description"
                    value={newMeeting.description}
                    onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Maximum Participants
                  </label>
                  <select
                    className="input"
                    value={newMeeting.maxParticipants}
                    onChange={(e) => setNewMeeting({ ...newMeeting, maxParticipants: parseInt(e.target.value) })}
                  >
                    <option value={10}>10 participants</option>
                    <option value={25}>25 participants</option>
                    <option value={50}>50 participants</option>
                    <option value={100}>100 participants</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingMeeting}
                  className="btn btn-primary px-4 py-2 disabled:opacity-50"
                >
                  {creatingMeeting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Meeting'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Meeting Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Join Meeting</h2>
            <form onSubmit={handleJoinMeeting}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Room ID
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Enter Room ID"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  />
                  <p className="text-sm text-secondary-500 mt-1">
                    Enter the 8-character Room ID provided by the meeting host
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="btn btn-outline px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joiningMeeting}
                  className="btn btn-primary px-4 py-2 disabled:opacity-50"
                >
                  {joiningMeeting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Meeting'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
