require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Conversation = require('./models/Conversation');

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const wishlistRoutes = require('./routes/wishlist');
const chatRoutes = require('./routes/chat');
const paymentRoutes = require('./routes/payments');
const seedAdmin = require('./seedAdmin');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);

app.use((error, req, res, next) => {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Request payload too large. Please upload a smaller image and try again.'
    });
  }
  return next(error);
});

io.use((socket, next) => {
  try {
    const authToken = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!authToken) return next(new Error('Authentication required'));

    const token = authToken.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.userId}`);

  socket.on('join_conversation', async ({ conversationId }) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      const isMember = conversation.participants.some(
        (participant) => participant.toString() === socket.userId
      );

      if (isMember) {
        socket.join(`conversation:${conversationId}`);
      }
    } catch (error) {
      console.error('join_conversation error:', error.message);
    }
  });

  socket.on('leave_conversation', ({ conversationId }) => {
    socket.leave(`conversation:${conversationId}`);
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected to ' + process.env.MONGODB_URI);
    await seedAdmin(); // Auto-create admin account if it doesn't exist
  })
  .catch(err => console.error('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
