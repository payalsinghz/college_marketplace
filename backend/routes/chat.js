const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { generateNegotiationSuggestions } = require('../services/negotiationCopilot');

const router = express.Router();

const normalizeId = (value) => String(value?._id || value || '');
const isParticipant = (conversation, userId) =>
  conversation.participants.some(
    (participant) => normalizeId(participant) === normalizeId(userId)
  );

router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user })
      .populate('participants', 'name email')
      .populate('item', 'title imageUrl')
      .sort({ lastMessageAt: -1 });

    const withMeta = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          sender: { $ne: req.user },
          readBy: { $ne: req.user }
        });

        return { ...conversation.toObject(), unreadCount };
      })
    );

    res.json(withMeta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

router.post('/conversations', auth, async (req, res) => {
  try {
    const { recipientId, itemId } = req.body;

    if (!recipientId || recipientId === req.user) {
      return res.status(400).json({ message: 'Invalid recipient' });
    }

    const participants = [req.user, recipientId].sort();
    const normalizedItemId =
      itemId && mongoose.Types.ObjectId.isValid(itemId) ? itemId : null;

    const query = {
      participants: { $all: participants, $size: 2 },
      item: normalizedItemId
    };

    let conversation = await Conversation.findOne(query);
    if (!conversation) {
      conversation = await Conversation.create({
        participants,
        item: normalizedItemId
      });
    }

    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'name email')
      .populate('item', 'title imageUrl');

    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create conversation' });
  }
});

router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversation id' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !isParticipant(conversation, req.user)) {
      return res.status(403).json({ message: 'Not allowed to access this conversation' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 });

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user },
        readBy: { $ne: req.user }
      },
      { $addToSet: { readBy: req.user } }
    );

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

router.post('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const conversation = await Conversation.findById(conversationId).populate('participants', 'name email');
    if (!conversation || !isParticipant(conversation, req.user)) {
      return res.status(403).json({ message: 'Not allowed to send message in this conversation' });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user,
      text: text.trim(),
      readBy: [req.user]
    });

    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name email');
    const io = req.app.get('io');
    const payload = {
      conversationId,
      message: populatedMessage
    };

    io.to(`conversation:${conversationId}`).emit('new_message', payload);
    conversation.participants.forEach((participant) => {
      io.to(`user:${participant._id.toString()}`).emit('conversation_update', {
        conversationId,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt
      });
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

router.post('/conversations/:conversationId/copilot', auth, async (req, res) => {
  const safeFallback = {
    politeReply: 'Thanks for your offer. I appreciate your interest and would like to keep this discussion fair.',
    counterOffer:
      'I can offer a slightly better price considering the item condition. Let me know your best possible price.',
    dealSummary:
      'If we agree on the final amount, we can confirm the deal with campus pickup and immediate handover.',
    source: 'fallback'
  };

  try {
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversation id' });
    }

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name email')
      .populate('item', 'title');

    if (!conversation || !isParticipant(conversation, req.user)) {
      return res.status(403).json({ message: 'Not allowed to access this conversation' });
    }

    const recentMessages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .limit(12);

    const currentParticipant = conversation.participants.find(
      (participant) => normalizeId(participant) === normalizeId(req.user)
    );

    const suggestions = await generateNegotiationSuggestions({
      messages: recentMessages.reverse(),
      itemTitle: conversation.item?.title || '',
      currentUserId: req.user,
      currentUserName: currentParticipant?.name || 'Seller'
    });

    res.json(suggestions);
  } catch (error) {
    console.error('Copilot route error:', error);
    res.json(safeFallback);
  }
});

module.exports = router;
