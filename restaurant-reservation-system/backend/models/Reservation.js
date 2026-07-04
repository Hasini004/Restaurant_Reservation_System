const mongoose = require('mongoose');
const { TIME_SLOTS } = require('../utils/timeSlots');

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    // Stored as 'YYYY-MM-DD' string rather than a full Date object.
    // This sidesteps timezone-conversion bugs when comparing "the same day"
    // across client and server, which matters more here than storing a
    // precise instant in time.
    date: {
      type: String,
      required: [true, 'Reservation date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      enum: TIME_SLOTS,
    },
    guests: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: [1, 'There must be at least 1 guest'],
    },
    status: {
      // 'cancelled' reservations are kept (not deleted) for history/audit,
      // and are excluded from conflict checks so the slot frees up.
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
);

// Speeds up the availability check that runs on every booking attempt,
// and up admin "reservations by date" queries.
reservationSchema.index({ user: 1 });
reservationSchema.index({ date: 1 });

// Database-level safety net against double bookings: two *confirmed*
// reservations cannot exist for the same table/date/timeSlot. This is a
// partial index (only applies when status === 'confirmed') so cancelled
// reservations don't block the slot from being rebooked. The application
// layer already checks this before insert (see reservationController), but
// a concurrent request could slip past that check in a race condition —
// this index makes MongoDB itself reject the second insert.
reservationSchema.index(
  { table: 1, date: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' } }
);

module.exports = mongoose.model('Reservation', reservationSchema);
