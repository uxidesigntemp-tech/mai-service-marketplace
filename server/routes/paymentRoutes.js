// server/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { requireAuth, requireCustomer } = require('../middleware/auth');

router.use(requireAuth, requireCustomer);

// 1. GET USER PAYMENTS (WITH STRICT OWNERSHIP)
router.get('/', (req, res) => {
  const currentUserId = req.user.id;
  const userPayments = store.filter('payments', p => p.userId === currentUserId);

  userPayments.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.status(200).json(userPayments);
});

// 2. GET SINGLE PAYMENT (WITH STRICT OWNERSHIP CHECK - WORKFLOW G)
router.get('/:id', (req, res) => {
  const currentUserId = req.user.id;
  const payment = store.find('payments', p => p.id === req.params.id || p.paymentReference === req.params.id);

  if (!payment) {
    return res.status(404).json({ error: 'NotFound', message: `Payment record '${req.params.id}' not found.` });
  }

  // STRICT OWNERSHIP CHECK
  if (payment.userId !== currentUserId) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Access denied. You are not authorized to view this payment record.' 
    });
  }

  const booking = store.find('bookings', b => b.id === payment.bookingId || b.bookingReference === payment.bookingReference);

  res.status(200).json({
    ...payment,
    bookingDetails: booking
  });
});

// 3. PROCESS PAYMENT (DEV-SAFE MODULAR PAYMENT ADAPTER)
router.post('/pay', (req, res) => {
  const currentUserId = req.user.id;
  const { bookingId, paymentMethod } = req.body;

  if (!bookingId) {
    return res.status(400).json({ error: 'ValidationError', message: 'bookingId is required.' });
  }

  const booking = store.find('bookings', b => b.id === bookingId || b.bookingReference === bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'NotFound', message: 'Booking not found.' });
  }

  // Check booking ownership
  if (booking.customerId !== currentUserId) {
    return res.status(403).json({ error: 'Forbidden', message: 'You can only pay for your own bookings.' });
  }

  if (booking.paymentStatus === 'PAID') {
    return res.status(400).json({ error: 'AlreadyPaid', message: 'This booking has already been paid.' });
  }

  // Create payment record
  const refNum = Math.floor(10000 + Math.random() * 90000);
  const paymentReference = `MAI-PAY-${refNum}`;
  const paymentId = `pay-${Date.now()}`;
  const methodUsed = paymentMethod || 'Card (Visa ending 4242)';

  const newPayment = {
    id: paymentId,
    paymentReference,
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    userId: currentUserId,
    serviceName: booking.serviceTitle,
    professionalName: booking.professionalName,
    amount: booking.totalAmount,
    currency: 'GBP',
    paymentMethod: methodUsed,
    status: 'PAID',
    transactionId: `txn_mai_${Date.now()}`,
    receiptUrl: `/receipts/${paymentReference}.pdf`,
    createdAt: new Date().toISOString()
  };

  store.insert('payments', newPayment);

  // Update booking status
  store.update('bookings', booking.id, {
    paymentStatus: 'PAID',
    bookingStatus: booking.bookingStatus === 'PENDING' ? 'CONFIRMED' : booking.bookingStatus,
    updatedAt: new Date().toISOString()
  });

  // Create Notification
  store.insert('notifications', {
    id: 'notif-' + Date.now(),
    userId: currentUserId,
    title: 'Payment Successful',
    message: `Payment of £${booking.totalAmount.toFixed(2)} received for ${booking.serviceTitle} (${booking.bookingReference}).`,
    type: 'PAYMENT_RECEIVED',
    relatedBookingId: booking.id,
    relatedBookingRef: booking.bookingReference,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.status(200).json({
    message: 'Payment completed successfully',
    payment: newPayment
  });
});

module.exports = router;
