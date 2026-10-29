// server/middleware/validation.js

function validateEmail(email) {
  if (typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

function validatePassword(password) {
  if (typeof password !== 'string') return false;
  // Minimum 6 characters
  return password.length >= 6;
}

function validateRegistration(req, res, next) {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      message: 'Full name must be at least 2 characters.' 
    });
  }

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      message: 'A valid email address is required.' 
    });
  }

  if (!password || !validatePassword(password)) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      message: 'Password must be at least 6 characters.' 
    });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      message: 'A valid email address is required.' 
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ 
      error: 'Validation Error', 
      message: 'Password is required.' 
    });
  }

  next();
}

function validateBooking(req, res, next) {
  const { serviceId, serviceDate, timeSlot } = req.body;

  if (!serviceId || typeof serviceId !== 'string') {
    return res.status(400).json({ 
      error: 'Validation Error', 
      message: 'A valid serviceId is required.' 
    });
  }

  if (!serviceDate) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      message: 'Service date is required.' 
    });
  }

  if (!timeSlot) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      message: 'Time slot selection is required.' 
    });
  }

  next();
}

function validateAddress(req, res, next) {
  const { streetAddress, city, postalCode } = req.body;

  if (!streetAddress || typeof streetAddress !== 'string' || streetAddress.trim().length < 3) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      message: 'Street address is required.' 
    });
  }

  if (!city || typeof city !== 'string' || city.trim().length < 2) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      message: 'City is required.' 
    });
  }

  if (!postalCode || typeof postalCode !== 'string' || postalCode.trim().length < 3) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      message: 'Valid postal code is required.' 
    });
  }

  next();
}

module.exports = {
  validateEmail,
  validatePassword,
  validateRegistration,
  validateLogin,
  validateBooking,
  validateAddress
};
