const express = require('express');
const jwt = require('jsonwebtoken');
const Review = require('../models/Review');
const User = require('../models/User');

const router = express.Router();

const auth = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// POST a new review for a seller
router.post('/', auth, async (req, res) => {
  try {
    const { sellerId, itemId, rating, comment } = req.body;
    
    // Prevent self-review (optional but good practice)
    if (sellerId === req.user) {
      return res.status(400).json({ message: 'You cannot review yourself' });
    }

    const review = new Review({
      seller: sellerId,
      buyer: req.user,
      item: itemId,
      rating: Number(rating),
      comment
    });

    await review.save();
    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while submitting review' });
  }
});

// GET average rating and reviews for a specific seller
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const reviews = await Review.find({ seller: req.params.sellerId })
      .populate('buyer', 'name')
      .sort({ createdAt: -1 });

    const avgRating = reviews.length > 0 
      ? (reviews.reduce((acc, current) => acc + current.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({ averageRating: avgRating, totalReviews: reviews.length, reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching reviews' });
  }
});

module.exports = router;
