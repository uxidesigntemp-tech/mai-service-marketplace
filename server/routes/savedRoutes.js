// server/routes/savedRoutes.js
const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { requireAuth, requireCustomer } = require('../middleware/auth');

router.use(requireAuth, requireCustomer);

// 1. GET ALL SAVED ITEMS FOR CURRENT USER
router.get('/', (req, res) => {
  const currentUserId = req.user.id;
  const saved = store.filter('savedProfiles', s => s.userId === currentUserId);

  const enriched = saved.map(item => {
    if (item.itemType === 'service') {
      const service = store.find('services', s => s.id === item.itemId);
      return { ...item, itemDetails: service || null };
    } else {
      const pro = store.find('professionals', p => p.id === item.itemId);
      return { ...item, itemDetails: pro || null };
    }
  });

  res.status(200).json(enriched);
});

// 2. SAVE ITEM (PREVENT DUPLICATES)
router.post('/', (req, res) => {
  const currentUserId = req.user.id;
  const { itemType, itemId } = req.body;

  if (!itemType || !itemId) {
    return res.status(400).json({ error: 'ValidationError', message: 'itemType and itemId are required.' });
  }

  // Check if already saved
  const existing = store.find('savedProfiles', s => 
    s.userId === currentUserId && s.itemType === itemType && s.itemId === itemId
  );

  if (existing) {
    return res.status(200).json({ message: 'Item already saved', savedItem: existing });
  }

  const newItem = {
    id: 'saved-' + Date.now(),
    userId: currentUserId,
    itemType,
    itemId,
    createdAt: new Date().toISOString()
  };

  store.insert('savedProfiles', newItem);
  res.status(201).json({ message: 'Saved successfully', savedItem: newItem });
});

// 3. REMOVE SAVED ITEM
router.delete('/:idOrItemId', (req, res) => {
  const currentUserId = req.user.id;
  const target = req.params.idOrItemId;

  const item = store.find('savedProfiles', s => 
    s.userId === currentUserId && (s.id === target || s.itemId === target)
  );

  if (!item) {
    return res.status(404).json({ error: 'NotFound', message: 'Saved item not found.' });
  }

  store.delete('savedProfiles', item.id);
  res.status(200).json({ message: 'Item removed from saved list successfully' });
});

module.exports = router;
