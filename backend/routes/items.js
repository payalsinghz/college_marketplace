const express = require('express');
const Item = require('../models/Item');
const User = require('../models/User');
const { upload } = require('../config/cloudinary');
const auth = require('../middleware/auth');
const { generateListingSuggestion } = require('../services/listingAssistant');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;
    let query = { isSold: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const items = await Item.find(query).populate('owner', 'name email phone').sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get items by specific user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const items = await Item.find({ owner: req.params.userId }).populate('owner', 'name email phone').sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/', [auth, upload.single('image')], async (req, res) => {
  try {
    const { title, description, price, category, tags } = req.body;
    let imageUrl = '';
    
    if (req.file && req.file.path) {
      imageUrl = req.file.path;
    } else {
      return res.status(400).json({ message: 'Image upload failed or missing image. Check Cloudinary settings.' });
    }

    const newItem = new Item({
      title,
      description,
      price,
      category,
      tags: typeof tags === 'string'
        ? tags.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 8)
        : [],
      imageUrl,
      owner: req.user
    });
    
    const item = await newItem.save();
    const populatedItem = await item.populate('owner', 'name email phone');
    res.status(201).json(populatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error. Check Cloudinary credentials.' });
  }
});

router.post('/ai-suggest', auth, async (req, res) => {
  try {
    const { roughText = '', imageBase64 = '', mimeType = '' } = req.body;
    const cleanedText = String(roughText).trim();

    if (cleanedText.length < 6) {
      return res.status(400).json({ message: 'Please provide at least a short rough description.' });
    }

    const suggestion = await generateListingSuggestion({
      roughText: cleanedText,
      imageBase64: imageBase64 ? String(imageBase64) : '',
      mimeType: mimeType ? String(mimeType) : ''
    });

    res.json(suggestion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate AI listing suggestion' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    if (item.owner.toString() !== req.user) {
      return res.status(401).json({ message: 'User not authorized to delete this item' });
    }
    
    await item.deleteOne();
    res.json({ message: 'Item removed successfully' });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
