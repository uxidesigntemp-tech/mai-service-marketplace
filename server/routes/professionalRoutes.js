// server/routes/professionalRoutes.js
const express = require('express');
const router = express.Router();
const store = require('../data/store');

// 1. GET ALL PROFESSIONALS (with search, category filter, sorting)
router.get('/', (req, res) => {
  let pros = store.get('professionals');
  const { search, q, category, sort } = req.query;

  const searchQuery = (search || q || '').toLowerCase().trim();

  if (searchQuery) {
    pros = pros.filter(p => 
      p.name.toLowerCase().includes(searchQuery) ||
      (p.businessName && p.businessName.toLowerCase().includes(searchQuery)) ||
      (p.title && p.title.toLowerCase().includes(searchQuery)) ||
      (p.serviceArea && p.serviceArea.toLowerCase().includes(searchQuery)) ||
      (p.skills && p.skills.some(s => s.toLowerCase().includes(searchQuery)))
    );
  }

  if (category) {
    const targetCat = category.toLowerCase();
    pros = pros.filter(p => 
      (p.category && p.category.toLowerCase() === targetCat) ||
      (p.categories && p.categories.some(c => c.toLowerCase() === targetCat))
    );
  }

  if (sort === 'rating') {
    pros.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === 'price_asc') {
    pros.sort((a, b) => (a.hourlyRate || a.startingPrice || 0) - (b.hourlyRate || b.startingPrice || 0));
  } else if (sort === 'price_desc') {
    pros.sort((a, b) => (b.hourlyRate || b.startingPrice || 0) - (a.hourlyRate || a.startingPrice || 0));
  } else {
    // Default: reviews count / top choice
    pros.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
  }

  res.status(200).json(pros);
});

// 2. GET PROFESSIONAL BY ID
router.get('/:id', (req, res) => {
  const pro = store.find('professionals', p => p.id === req.params.id);

  if (!pro) {
    return res.status(404).json({ error: 'NotFound', message: `Professional '${req.params.id}' not found.` });
  }

  // Find all services this professional offers
  const services = store.filter('services', s => 
    s.professionalId === pro.id || 
    (pro.servicesOffered && pro.servicesOffered.some(so => so.id === s.id))
  );

  res.status(200).json({
    ...pro,
    services
  });
});

// 3. GET SERVICES OFFERED BY A PROFESSIONAL
router.get('/:id/services', (req, res) => {
  const pro = store.find('professionals', p => p.id === req.params.id);
  if (!pro) {
    return res.status(404).json({ error: 'NotFound', message: `Professional '${req.params.id}' not found.` });
  }

  const services = store.filter('services', s => 
    s.professionalId === pro.id || 
    (pro.servicesOffered && pro.servicesOffered.some(so => so.id === s.id))
  );

  res.status(200).json(services);
});

// 4. GET AVAILABILITY SLOTS
router.get('/:id/availability', (req, res) => {
  const pro = store.find('professionals', p => p.id === req.params.id);
  if (!pro) {
    return res.status(404).json({ error: 'NotFound', message: `Professional '${req.params.id}' not found.` });
  }

  // Realistic working availability slots for the professional
  const slots = [
    { time: '09:00 - 11:00', label: 'Morning Slot (09:00 - 11:00)', available: true },
    { time: '11:30 - 13:30', label: 'Midday Slot (11:30 - 13:30)', available: true },
    { time: '14:00 - 16:00', label: 'Afternoon Slot (14:00 - 16:00)', available: true },
    { time: '16:30 - 18:30', label: 'Late Afternoon (16:30 - 18:30)', available: false }
  ];

  res.status(200).json({
    professionalId: pro.id,
    professionalName: pro.name,
    availableSlots: slots,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  });
});

module.exports = router;
