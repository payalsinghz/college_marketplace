const express = require('express');
const User = require('../models/User');
const Item = require('../models/Item');
const Review = require('../models/Review');

const router = express.Router();

// Get admin contact details for direct support chat
router.get('/admin/contact', async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' }).select('name email');
    if (!admin) return res.status(404).json({ message: 'Admin account not found' });

    res.json({
      id: admin._id,
      name: admin.name,
      email: admin.email
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching admin contact' });
  }
});

// Get public user profile details
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -phone'); // Don't expose sensitive info
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get active items
    const items = await Item.find({ owner: user._id }).sort({ createdAt: -1 });

    // Get aggregated rating
    const reviews = await Review.find({ seller: user._id });
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((acc, current) => acc + current.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({
      user: { name: user.name, email: user.email, joinedAt: user.createdAt },
      items,
      stats: { averageRating: Number(avgRating), totalReviews: reviews.length }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

module.exports = router;
