const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
    trim: true,
    unique: true // Ensure unique display names
  },
  graphName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  assistantId: {
    type: String,
    required: true,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  starterQuestions: {
    type: [String],
    default: [],
    validate: [
      {
        validator: function(v) {
          return v.length <= 6;
        },
        message: props => 'An agent can have a maximum of 6 starter questions.'
      },
      {
        validator: function(v) {
          return v.every(question => question.length <= 150);
        },
        message: props => 'Each starter question must be 150 characters or less.'
      }
    ]
  }
}, { timestamps: true });

// Add virtual for lastModified to match API response format
agentSchema.virtual('lastModified').get(function() {
  return this.updatedAt;
});

// Ensure virtuals are included in JSON representation
agentSchema.set('toJSON', { virtuals: true });
agentSchema.set('toObject', { virtuals: true });

const Agent = mongoose.model('Agent', agentSchema);
module.exports = Agent;