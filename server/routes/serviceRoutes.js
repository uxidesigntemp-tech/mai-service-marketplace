// server/routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const store = require('../data/store');

// 1. GET SERVICES (with search, category, subcategory, price range, and sorting)
router.get('/', (req, res) => {
  let services = store.get('services');
  const { 
    search, 
    q, 
    category, 
    categoryId, 
    subcategory, 
    subcategoryId, 
    minPrice, 
    maxPrice, 
    pricingModel, 
    sort 
  } = req.query;

  const searchQuery = (search || q || '').toLowerCase().trim();

  // Search filter
  if (searchQuery) {
    services = services.filter(s => 
      s.title.toLowerCase().includes(searchQuery) ||
      (s.shortDescription && s.shortDescription.toLowerCase().includes(searchQuery)) ||
      (s.description && s.description.toLowerCase().includes(searchQuery)) ||
      (s.categoryName && s.categoryName.toLowerCase().includes(searchQuery)) ||
      (s.subcategoryName && s.subcategoryName.toLowerCase().includes(searchQuery)) ||
      (s.tags && s.tags.some(t => t.toLowerCase().includes(searchQuery)))
    );
  }

  // Category filter
  if (category || categoryId) {
    const targetCat = (category || categoryId).toLowerCase();
    services = services.filter(s => 
      (s.categoryId && s.categoryId.toLowerCase() === targetCat) ||
      (s.category && s.category.toLowerCase() === targetCat) ||
      (s.categoryName && s.categoryName.toLowerCase() === targetCat)
    );
  }

  // Subcategory filter
  if (subcategory || subcategoryId) {
    const targetSub = (subcategory || subcategoryId).toLowerCase();
    services = services.filter(s => 
      (s.subcategoryId && s.subcategoryId.toLowerCase() === targetSub) ||
      (s.subcategory && s.subcategory.toLowerCase() === targetSub) ||
      (s.subcategoryName && s.subcategoryName.toLowerCase() === targetSub)
    );
  }

  // Pricing model filter
  if (pricingModel) {
    services = services.filter(s => s.pricingModel === pricingModel.toLowerCase());
  }

  // Price range filters
  if (minPrice !== undefined && !isNaN(parseFloat(minPrice))) {
    const min = parseFloat(minPrice);
    services = services.filter(s => (s.price || s.startingPrice || 0) >= min);
  }

  if (maxPrice !== undefined && !isNaN(parseFloat(maxPrice))) {
    const max = parseFloat(maxPrice);
    services = services.filter(s => (s.price || s.startingPrice || 0) <= max);
  }

  // Sorting
  if (sort === 'price_asc') {
    services.sort((a, b) => (a.price || a.startingPrice || 0) - (b.price || b.startingPrice || 0));
  } else if (sort === 'price_desc') {
    services.sort((a, b) => (b.price || b.startingPrice || 0) - (a.price || a.startingPrice || 0));
  } else if (sort === 'rating') {
    services.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else {
    // Default: popular / reviews count
    services.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
  }

  res.status(200).json(services);
});

// 2. GET SERVICE BY ID OR SLUG
router.get('/:idOrSlug', (req, res) => {
  const param = req.params.idOrSlug.toLowerCase();
  const service = store.find('services', s => 
    s.id.toLowerCase() === param || (s.slug && s.slug.toLowerCase() === param)
  );

  if (!service) {
    return res.status(404).json({ error: 'NotFound', message: `Service '${req.params.idOrSlug}' not found.` });
  }

  // Find category and subcategory info
  const category = store.find('categories', c => c.id === service.categoryId);
  const subcategory = store.find('subcategories', s => s.id === service.subcategoryId);

  // Find available professionals offering this service
  const professionals = store.filter('professionals', p => 
    p.id === service.professionalId || 
    (p.categories && p.categories.includes(service.categoryId || service.category)) ||
    (p.servicesOffered && p.servicesOffered.some(so => so.id === service.id || so.title === service.title))
  );

  res.status(200).json({
    ...service,
    categoryDetails: category,
    subcategoryDetails: subcategory,
    availableProfessionals: professionals
  });
});

module.exports = router;
