// models/Session.js
// Defines the structure of a "focus session" document in MongoDB.

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    // WHO owns this session — references a User document
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // WHAT the user wants to accomplish
    goal: {
      type: String,
      required: [true, 'Session goal is required'],
      trim: true,
      maxlength: 200,
    },

    // How long the user PLANNED to focus (in minutes)
    plannedDuration: {
      type: Number,
      required: true,
      min: [1, 'Planned duration must be at least 1 minute'],
      max: [240, 'Planned duration cannot exceed 4 hours'],
    },

    // How long the user ACTUALLY focused (filled in when session ends)
    actualDuration: {
      type: Number,
      default: 0,
    },

    // WHEN the session began (defaults to now)
    startedAt: {
      type: Date,
      default: Date.now,
    },

    // WHEN the session ended (null until ended)
    endedAt: {
      type: Date,
      default: null,
    },

    // Lifecycle state
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },

    // How many breaks taken during the session
    breaksTaken: {
      type: Number,
      default: 0,
    },

    // Optional tags like ["DSA", "deep-work"]
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // auto-adds createdAt and updatedAt
  }
);

// Compound index: optimizes "get this user's sessions, newest first"
// (the most common query our app will run)
sessionSchema.index({ userId: 1, startedAt: -1 });

module.exports = mongoose.model('Session', sessionSchema);