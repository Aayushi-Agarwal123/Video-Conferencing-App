const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Meeting = require('../models/Meeting');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/meeting/create
// @desc    Create a new meeting
// @access  Private
router.post('/create', auth, async (req, res) => {
  try {
    const { title, description, maxParticipants } = req.body;

    // Validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Meeting title is required' 
      });
    }

    // Generate unique room ID
    const roomId = uuidv4().substring(0, 8).toUpperCase();

    // Create meeting
    const meeting = new Meeting({
      roomId,
      title: title.trim(),
      description: description || '',
      host: req.user._id,
      maxParticipants: maxParticipants || 50,
      participants: [{
        user: req.user._id,
        joinedAt: new Date(),
        isOnline: true
      }]
    });

    await meeting.save();

    // Populate host and participants
    await meeting.populate('host', 'name email avatar');
    await meeting.populate('participants.user', 'name email avatar');

    res.status(201).json({
      message: 'Meeting created successfully',
      meeting
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ 
      message: 'Server error while creating meeting' 
    });
  }
});

// @route   POST /api/meeting/join
// @desc    Join a meeting by room ID
// @access  Private
router.post('/join', auth, async (req, res) => {
  try {
    const { roomId } = req.body;

    // Validation
    if (!roomId || roomId.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Room ID is required' 
      });
    }

    // Find meeting by room ID
    const meeting = await Meeting.findOne({ 
      roomId: roomId.toUpperCase(),
      isActive: true 
    })
    .populate('host', 'name email avatar')
    .populate('participants.user', 'name email avatar');

    if (!meeting) {
      return res.status(404).json({ 
        message: 'Meeting not found or inactive' 
      });
    }

    // Check if meeting is locked
    if (meeting.isLocked) {
      return res.status(403).json({ 
        message: 'Meeting is locked. You cannot join.' 
      });
    }

    // Check if max participants reached
    const onlineCount = meeting.getOnlineParticipantsCount();
    if (onlineCount >= meeting.maxParticipants) {
      return res.status(403).json({ 
        message: 'Meeting is full. Maximum participants reached.' 
      });
    }

    // Add participant if not already present
    await meeting.addParticipant(req.user._id);

    // Get updated meeting with populated data
    const updatedMeeting = await Meeting.findById(meeting._id)
      .populate('host', 'name email avatar')
      .populate('participants.user', 'name email avatar');

    res.json({
      message: 'Joined meeting successfully',
      meeting: updatedMeeting
    });
  } catch (error) {
    console.error('Join meeting error:', error);
    res.status(500).json({ 
      message: 'Server error while joining meeting' 
    });
  }
});

// @route   GET /api/meeting/:roomId
// @desc    Get meeting details by room ID
// @access  Private
router.get('/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const meeting = await Meeting.findOne({ 
      roomId: roomId.toUpperCase(),
      isActive: true 
    })
    .populate('host', 'name email avatar')
    .populate('participants.user', 'name email avatar');

    if (!meeting) {
      return res.status(404).json({ 
        message: 'Meeting not found or inactive' 
      });
    }

    res.json({ meeting });
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching meeting' 
    });
  }
});

// @route   GET /api/meeting/user/meetings
// @desc    Get user's meetings (hosted and participated)
// @access  Private
router.get('/user/meetings', auth, async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { host: req.user._id },
        { 'participants.user': req.user._id }
      ],
      isActive: true
    })
    .populate('host', 'name email avatar')
    .populate('participants.user', 'name email avatar')
    .sort({ createdAt: -1 });

    res.json({ meetings });
  } catch (error) {
    console.error('Get user meetings error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching meetings' 
    });
  }
});

// @route   POST /api/meeting/:roomId/leave
// @desc    Leave a meeting
// @access  Private
router.post('/:roomId/leave', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const meeting = await Meeting.findOne({ 
      roomId: roomId.toUpperCase(),
      isActive: true 
    });

    if (!meeting) {
      return res.status(404).json({ 
        message: 'Meeting not found or inactive' 
      });
    }

    // Remove participant
    await meeting.removeParticipant(req.user._id);

    res.json({ message: 'Left meeting successfully' });
  } catch (error) {
    console.error('Leave meeting error:', error);
    res.status(500).json({ 
      message: 'Server error while leaving meeting' 
    });
  }
});

// @route   POST /api/meeting/:roomId/end
// @desc    End a meeting (host only)
// @access  Private
router.post('/:roomId/end', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const meeting = await Meeting.findOne({ 
      roomId: roomId.toUpperCase(),
      isActive: true 
    });

    if (!meeting) {
      return res.status(404).json({ 
        message: 'Meeting not found or inactive' 
      });
    }

    // Check if user is the host
    if (meeting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Only the host can end the meeting' 
      });
    }

    // End meeting
    meeting.isActive = false;
    meeting.endTime = new Date();
    await meeting.save();

    res.json({ message: 'Meeting ended successfully' });
  } catch (error) {
    console.error('End meeting error:', error);
    res.status(500).json({ 
      message: 'Server error while ending meeting' 
    });
  }
});

module.exports = router;
