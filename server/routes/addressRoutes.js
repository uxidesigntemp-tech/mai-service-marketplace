// server/routes/addressRoutes.js
const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { requireAuth, requireCustomer } = require('../middleware/auth');
const { validateAddress } = require('../middleware/validation');

router.use(requireAuth, requireCustomer);

// 1. GET ALL ADDRESSES FOR USER
router.get('/', (req, res) => {
  const currentUserId = req.user.id;
  const addresses = store.filter('addresses', a => a.userId === currentUserId);
  res.status(200).json(addresses);
});

// 2. CREATE NEW ADDRESS
router.post('/', validateAddress, (req, res) => {
  const currentUserId = req.user.id;
  const { title, streetAddress, apartment, city, state, postalCode, country, isDefault, instructions } = req.body;

  // If this is set to default, unmark other addresses
  if (isDefault) {
    const existing = store.filter('addresses', a => a.userId === currentUserId);
    existing.forEach(a => {
      store.update('addresses', a.id, { isDefault: false });
    });
  }

  // If first address, auto default
  const userAddresses = store.filter('addresses', a => a.userId === currentUserId);
  const shouldBeDefault = isDefault || userAddresses.length === 0;

  const newAddr = {
    id: 'addr-' + Date.now(),
    userId: currentUserId,
    title: (title || 'Home').trim(),
    streetAddress: streetAddress.trim(),
    apartment: apartment ? apartment.trim() : '',
    city: city.trim(),
    state: state ? state.trim() : 'Greater London',
    postalCode: postalCode.trim().toUpperCase(),
    country: country ? country.trim() : 'United Kingdom',
    isDefault: shouldBeDefault,
    instructions: instructions ? instructions.trim() : '',
    createdAt: new Date().toISOString()
  };

  store.insert('addresses', newAddr);
  res.status(201).json({ message: 'Address created successfully', address: newAddr });
});

// 3. UPDATE ADDRESS (WITH OWNERSHIP CHECK)
router.patch('/:id', (req, res) => {
  const currentUserId = req.user.id;
  const addr = store.find('addresses', a => a.id === req.params.id);

  if (!addr) {
    return res.status(404).json({ error: 'NotFound', message: 'Address not found.' });
  }

  // STRICT OWNERSHIP CHECK
  if (addr.userId !== currentUserId) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. You can only modify your own addresses.' });
  }

  const { title, streetAddress, apartment, city, state, postalCode, country, isDefault, instructions } = req.body;

  if (isDefault) {
    const existing = store.filter('addresses', a => a.userId === currentUserId);
    existing.forEach(a => {
      if (a.id !== addr.id) store.update('addresses', a.id, { isDefault: false });
    });
  }

  const updated = store.update('addresses', addr.id, {
    ...(title ? { title: title.trim() } : {}),
    ...(streetAddress ? { streetAddress: streetAddress.trim() } : {}),
    ...(apartment !== undefined ? { apartment: apartment.trim() } : {}),
    ...(city ? { city: city.trim() } : {}),
    ...(state !== undefined ? { state: state.trim() } : {}),
    ...(postalCode ? { postalCode: postalCode.trim().toUpperCase() } : {}),
    ...(country ? { country: country.trim() } : {}),
    ...(isDefault !== undefined ? { isDefault: Boolean(isDefault) } : {}),
    ...(instructions !== undefined ? { instructions: instructions.trim() } : {})
  });

  res.status(200).json({ message: 'Address updated successfully', address: updated });
});

// 4. SET DEFAULT ADDRESS
router.patch('/:id/default', (req, res) => {
  const currentUserId = req.user.id;
  const addr = store.find('addresses', a => a.id === req.params.id);

  if (!addr) {
    return res.status(404).json({ error: 'NotFound', message: 'Address not found.' });
  }

  if (addr.userId !== currentUserId) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied.' });
  }

  const existing = store.filter('addresses', a => a.userId === currentUserId);
  existing.forEach(a => {
    store.update('addresses', a.id, { isDefault: a.id === addr.id });
  });

  res.status(200).json({ message: 'Default address updated successfully' });
});

// 5. DELETE ADDRESS (WITH OWNERSHIP CHECK)
router.delete('/:id', (req, res) => {
  const currentUserId = req.user.id;
  const addr = store.find('addresses', a => a.id === req.params.id);

  if (!addr) {
    return res.status(404).json({ error: 'NotFound', message: 'Address not found.' });
  }

  if (addr.userId !== currentUserId) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied.' });
  }

  store.delete('addresses', addr.id);
  res.status(200).json({ message: 'Address deleted successfully' });
});

module.exports = router;
