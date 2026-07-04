const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  validateRequest,
  registerValidators,
  loginValidators,
} = require('../middleware/validate');

const router = express.Router();

router.post('/register', registerValidators, validateRequest, register);
router.post('/login', loginValidators, validateRequest, login);
router.get('/me', protect, getMe);

module.exports = router;
