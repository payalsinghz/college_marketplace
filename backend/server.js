require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const wishlistRoutes = require('./routes/wishlist');
const seedAdmin = require('./seedAdmin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wishlist', wishlistRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected to ' + process.env.MONGODB_URI);
    await seedAdmin(); // Auto-create admin account if it doesn't exist
  })
  .catch(err => console.error('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
