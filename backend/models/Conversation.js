const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      default: null
    },
    lastMessage: {
      type: String,
      default: ''
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, item: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
