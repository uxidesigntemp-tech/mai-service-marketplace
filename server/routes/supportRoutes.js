// server/routes/supportRoutes.js
const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { requireAuth, requireCustomer } = require('../middleware/auth');

const FAQS = [
  {
    q: "How does booking and scheduling work on MAI Service?",
    a: "Browse any category or professional, select the service details, choose an available date and time slot, and submit your booking. You can track status and communicate directly with your professional."
  },
  {
    q: "How does pricing and payment protection work?",
    a: "Every service has transparent pricing displayed (hourly or fixed rate). Prices are verified authoritatively on our backend, and payments are held safely until service completion is confirmed."
  },
  {
    q: "Can I reschedule or cancel a booking?",
    a: "Yes. From your My Bookings dashboard, you can reschedule or cancel any pending or confirmed booking prior to technician dispatch without penalty."
  },
  {
    q: "Are the professionals verified?",
    a: "All technicians and master craftspeople on MAI Service undergo identity checks, trade credential verification (such as NICEIC, CIPHE, City & Guilds), and public liability insurance checks."
  }
];

// Public FAQs
router.get('/faqs', (req, res) => {
  res.status(200).json(FAQS);
});

// Authenticated Support Tickets
router.use(requireAuth, requireCustomer);

// GET USER'S TICKETS
router.get('/tickets', (req, res) => {
  const currentUserId = req.user.id;
  const tickets = store.filter('supportTickets', t => t.userId === currentUserId);
  tickets.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.status(200).json(tickets);
});

// CREATE SUPPORT TICKET
router.post('/tickets', (req, res) => {
  const currentUserId = req.user.id;
  const { subject, category, message, priority } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ error: 'ValidationError', message: 'Subject and message are required.' });
  }

  const refNum = Math.floor(10000 + Math.random() * 90000);
  const ticketRef = `MAI-TCK-${refNum}`;

  const newTicket = {
    id: 'tck-' + Date.now(),
    ticketReference: ticketRef,
    userId: currentUserId,
    subject: subject.trim(),
    category: category || 'General Support',
    message: message.trim(),
    status: 'OPEN',
    priority: priority || 'MEDIUM',
    responses: [
      {
        sender: 'MAI Support System',
        message: 'Thank you for reaching out to MAI Support. An agent has been assigned to ticket ' + ticketRef + ' and will review your inquiry shortly.',
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.insert('supportTickets', newTicket);

  res.status(201).json({
    message: 'Support ticket submitted successfully',
    ticket: newTicket
  });
});

module.exports = router;
