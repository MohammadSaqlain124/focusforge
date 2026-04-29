

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    goal: {
      type: String,
      required: [true, 'Session goal is required'],
      trim: true,
      maxlength: 200,
    },

    plannedDuration: {
      type: Number,
      required: true,
      min: [1, 'Planned duration must be at least 1 minute'],
      max: [240, 'Planned duration cannot exceed 4 hours'],
    },

    
    actualDuration: {
      type: Number,
      default: 0,
    },

    
    startedAt: {
      type: Date,
      default: Date.now,
    },

    
    endedAt: {
      type: Date,
      default: null,
    },

    
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },

    
    breaks: [
        {
            startedAt: {
                type: Date,
                required: true,
            },
            plannedDuration: {
                type: Number, 
                required: true,
                min: 1,
                max: 60,
            },
            endedAt: {
                type: Date,
                default: null,
            },
            actualDuration: {
                type: Number, 
            default: null,
            },
        },
    ],
    totalBreakMinutes: {
        type: Number,
        default: 0, 
    },
    isOnBreak: {
        type: Boolean,
        default: false, 
    },
    
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, 
  }
);


sessionSchema.index({ userId: 1, startedAt: -1 });

module.exports = mongoose.model('Session', sessionSchema);