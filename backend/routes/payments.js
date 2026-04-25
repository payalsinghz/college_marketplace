const crypto = require('crypto');
const express = require('express');
const Razorpay = require('razorpay');
const auth = require('../middleware/auth');
const Item = require('../models/Item');

const router = express.Router();

const hasRazorpayConfig = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const getRazorpayClient = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

const buildReceipt = (itemId) => {
  const shortItemId = String(itemId || '').slice(-10) || 'item';
  const timePart = Date.now().toString().slice(-8);
  // Razorpay receipt must be <= 40 chars.
  return `itm_${shortItemId}_${timePart}`;
};

router.get('/config', auth, (req, res) => {
  if (!hasRazorpayConfig()) {
    return res.status(500).json({ message: 'Razorpay keys are missing on server.' });
  }
  return res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

router.post('/create-order', auth, async (req, res) => {
  try {
    if (!hasRazorpayConfig()) {
      return res.status(500).json({ message: 'Payment service is not configured yet.' });
    }

    const { itemId } = req.body;
    const item = await Item.findById(itemId).populate('owner', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.isSold) return res.status(400).json({ message: 'This item is already sold.' });
    if (String(item.owner?._id || item.owner) === String(req.user)) {
      return res.status(400).json({ message: 'You cannot buy your own item.' });
    }

    const amountPaise = Math.round(Number(item.price) * 100);
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({ message: 'Invalid item price for payment.' });
    }

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: buildReceipt(item._id),
      notes: {
        itemId: String(item._id),
        buyerId: String(req.user),
        sellerId: String(item.owner?._id || item.owner)
      }
    });

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      item: {
        id: item._id,
        title: item.title,
        price: item.price
      }
    });
  } catch (error) {
    const razorpayMessage = error?.error?.description || error?.error?.reason || error?.message;
    console.error('Create order failed:', razorpayMessage);
    return res.status(500).json({ message: 'Failed to create payment order' });
  }
});

router.post('/verify', auth, async (req, res) => {
  try {
    if (!hasRazorpayConfig()) {
      return res.status(500).json({ message: 'Payment service is not configured yet.' });
    }

    const { itemId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!itemId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification fields.' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature.' });
    }

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.isSold) {
      return res.status(400).json({ message: 'This item has already been purchased.' });
    }
    if (String(item.owner) === String(req.user)) {
      return res.status(400).json({ message: 'Owner cannot verify own purchase.' });
    }

    item.isSold = true;
    item.soldTo = req.user;
    item.soldAt = new Date();
    item.paymentOrderId = razorpay_order_id;
    item.paymentId = razorpay_payment_id;
    await item.save();

    return res.json({ message: 'Payment verified and item marked as sold.' });
  } catch (error) {
    console.error('Verify payment failed:', error.message);
    return res.status(500).json({ message: 'Failed to verify payment' });
  }
});

module.exports = router;
