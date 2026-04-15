const express = require('express');
const User = require('../models/User');
const Item = require('../models/Item');
const Review = require('../models/Review');
const { auth, requireAdmin } = require('../middleware/authAdmin');

const router = express.Router();

// All admin routes require auth + admin role
router.use(auth, requireAdmin);

// GET /api/admin/stats - Platform statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalItems = await Item.countDocuments();
    const totalReviews = await Review.countDocuments();
    const recentUsers = await User.find({ role: { $ne: 'admin' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password');

    res.json({ totalUsers, totalItems, totalReviews, recentUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// GET /api/admin/users - All users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/users/:id - Ban a user (delete their account + items)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot ban an admin account' });

    await Item.deleteMany({ owner: req.params.id }); // Delete all their items
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: `User ${user.name} has been banned and their listings removed.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error banning user' });
  }
});

// GET /api/admin/items - All items for review
router.get('/items', async (req, res) => {
  try {
    const items = await Item.find({}).populate('owner', 'name email').sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/items/:id - Remove inappropriate item
router.delete('/items/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item removed from the platform.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
