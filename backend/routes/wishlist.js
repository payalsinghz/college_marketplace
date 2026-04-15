const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Item = require('../models/Item');

const router = express.Router();

const auth = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'No token. Authorization denied.' });
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// GET /api/wishlist — fetch current user's wishlist with full item details
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('wishlist');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.wishlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching wishlist' });
  }
});

// GET /api/wishlist/ids — just the IDs (for fast UI checking)
router.get('/ids', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('wishlist');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.wishlist.map(id => id.toString()));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/wishlist/toggle/:itemId — add or remove from wishlist
router.post('/toggle/:itemId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const itemId = req.params.itemId;
    const index = user.wishlist.indexOf(itemId);

    if (index === -1) {
      user.wishlist.push(itemId);  // Add to wishlist
    } else {
      user.wishlist.splice(index, 1); // Remove from wishlist
    }

    await user.save();
    res.json({
      saved: index === -1,
      wishlist: user.wishlist.map(id => id.toString())
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error toggling wishlist' });
  }
});

module.exports = router;
