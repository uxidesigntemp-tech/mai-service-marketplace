// server/routes/subcategoryRoutes.js
const express = require('express');
const router = express.Router();
const store = require('../data/store');

// 1. GET ALL SUBCATEGORIES
router.get('/', (req, res) => {
  const { categoryId } = req.query;
  let subcats = store.get('subcategories');

  if (categoryId) {
    subcats = subcats.filter(s => s.categoryId === categoryId);
  }

  res.status(200).json(subcats);
});

// 2. GET SUBCATEGORY BY ID OR SLUG
router.get('/:idOrSlug', (req, res) => {
  const param = req.params.idOrSlug.toLowerCase();
  const subcat = store.find('subcategories', s => s.id.toLowerCase() === param || s.slug.toLowerCase() === param);

  if (!subcat) {
    return res.status(404).json({ error: 'NotFound', message: `Subcategory '${req.params.idOrSlug}' not found.` });
  }

  const category = store.find('categories', c => c.id === subcat.categoryId);
  const services = store.filter('services', s => s.subcategoryId === subcat.id || s.subcategoryName === subcat.name);

  res.status(200).json({
    ...subcat,
    category,
    services
  });
});

// 3. GET SERVICES FOR A SUBCATEGORY
router.get('/:idOrSlug/services', (req, res) => {
  const param = req.params.idOrSlug.toLowerCase();
  const subcat = store.find('subcategories', s => s.id.toLowerCase() === param || s.slug.toLowerCase() === param);

  if (!subcat) {
    return res.status(404).json({ error: 'NotFound', message: `Subcategory '${req.params.idOrSlug}' not found.` });
  }

  const services = store.filter('services', s => s.subcategoryId === subcat.id || s.subcategoryName === subcat.name);
  res.status(200).json(services);
});

module.exports = router;
