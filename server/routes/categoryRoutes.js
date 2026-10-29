// server/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const store = require('../data/store');

// 1. GET ALL CATEGORIES
router.get('/', (req, res) => {
  const categories = store.get('categories');
  const subcategories = store.get('subcategories');

  // Enrich with subcategory count and live service count
  const enriched = categories.map(cat => {
    const subcats = subcategories.filter(s => s.categoryId === cat.id);
    const services = store.filter('services', s => s.categoryId === cat.id || s.category === cat.slug);
    return {
      ...cat,
      subcategoriesCount: subcats.length,
      servicesCount: services.length || cat.count || 0
    };
  });

  res.status(200).json(enriched);
});

// 2. GET CATEGORY BY ID OR SLUG
router.get('/:idOrSlug', (req, res) => {
  const param = req.params.idOrSlug.toLowerCase();
  const cat = store.find('categories', c => c.id.toLowerCase() === param || c.slug.toLowerCase() === param);

  if (!cat) {
    return res.status(404).json({ error: 'NotFound', message: `Category '${req.params.idOrSlug}' not found.` });
  }

  const subcats = store.filter('subcategories', s => s.categoryId === cat.id);
  const services = store.filter('services', s => s.categoryId === cat.id || s.category === cat.slug);

  res.status(200).json({
    ...cat,
    subcategories: subcats,
    services: services
  });
});

// 3. GET SUBCATEGORIES FOR A CATEGORY
router.get('/:idOrSlug/subcategories', (req, res) => {
  const param = req.params.idOrSlug.toLowerCase();
  const cat = store.find('categories', c => c.id.toLowerCase() === param || c.slug.toLowerCase() === param);

  if (!cat) {
    return res.status(404).json({ error: 'NotFound', message: `Category '${req.params.idOrSlug}' not found.` });
  }

  const subcats = store.filter('subcategories', s => s.categoryId === cat.id);
  const enrichedSubcats = subcats.map(sub => {
    const services = store.filter('services', s => s.subcategoryId === sub.id || s.subcategoryName === sub.name);
    return {
      ...sub,
      servicesCount: services.length
    };
  });

  res.status(200).json(enrichedSubcats);
});

module.exports = router;
