const express = require('express');
const {
  createReservation,
  getMyReservations,
  cancelMyReservation,
  getAllReservations,
  adminUpdateReservation,
  adminCancelReservation,
} = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest, reservationValidators } = require('../middleware/validate');

const router = express.Router();

// Customer routes
router.post('/', protect, reservationValidators, validateRequest, createReservation);
router.get('/my', protect, getMyReservations);
router.delete('/:id', protect, cancelMyReservation);

// Admin routes
router.get('/', protect, authorize('admin'), getAllReservations);
router.put('/:id', protect, authorize('admin'), adminUpdateReservation);
router.delete('/:id/admin', protect, authorize('admin'), adminCancelReservation);

module.exports = router;
