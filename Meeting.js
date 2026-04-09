const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isOnline: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  maxParticipants: {
    type: Number,
    default: 50
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  description: {
    type: String,
    default: ''
  },
  isLocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Method to add participant
meetingSchema.methods.addParticipant = function(userId) {
  if (!this.participants.some(p => p.user.toString() === userId.toString())) {
    this.participants.push({
      user: userId,
      joinedAt: new Date(),
      isOnline: true
    });
  } else {
    // Update existing participant to online
    const participant = this.participants.find(p => p.user.toString() === userId.toString());
    if (participant) {
      participant.isOnline = true;
      participant.joinedAt = new Date();
    }
  }
  return this.save();
};

// Method to remove participant
meetingSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (participant) {
    participant.isOnline = false;
  }
  return this.save();
};

// Method to get online participants count
meetingSchema.methods.getOnlineParticipantsCount = function() {
  return this.participants.filter(p => p.isOnline).length;
};

module.exports = mongoose.model('Meeting', meetingSchema);
