const { validationResult, body } = require('express-validator');

/**
 * Runs after express-validator's chains and returns a 400 with a clear,
 * field-level breakdown if any validation failed. Keeping this generic
 * means every route can reuse the same "check + respond" pattern.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Reusable validator chains, shared between auth and reservation routes.
const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['customer', 'admin'])
    .withMessage('Role must be either customer or admin'),
];

const loginValidators = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const reservationValidators = [
  body('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('timeSlot').notEmpty().withMessage('Time slot is required'),
  body('guests')
    .isInt({ min: 1 })
    .withMessage('Guests must be a positive integer'),
  body('tableId').optional().isMongoId().withMessage('Invalid table id'),
];

module.exports = {
  validateRequest,
  registerValidators,
  loginValidators,
  reservationValidators,
};
