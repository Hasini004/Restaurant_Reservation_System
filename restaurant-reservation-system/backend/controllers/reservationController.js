const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { isValidTimeSlot } = require('../utils/timeSlots');

/**
 * Returns true if `dateStr` (YYYY-MM-DD) is strictly before today,
 * using the server's local date. Used to reject bookings in the past.
 */
const isPastDate = (dateStr) => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  return dateStr < todayStr;
};

/**
 * Core availability check shared by both booking paths (specific table
 * and auto-assign). A table is available for a given date + slot if
 * there is no other *confirmed* reservation on it for that exact
 * date + slot. Cancelled reservations are excluded, which is what lets
 * a slot be rebooked after a cancellation.
 */
const isTableAvailable = async (tableId, date, timeSlot, excludeReservationId = null) => {
  const query = { table: tableId, date, timeSlot, status: 'confirmed' };
  if (excludeReservationId) query._id = { $ne: excludeReservationId };
  const conflict = await Reservation.findOne(query);
  return !conflict;
};

// @route  POST /api/reservations
// @access Private/Customer
// Body: { date, timeSlot, guests, tableId? }
// If tableId is omitted, the smallest available table that can seat the
// party is auto-assigned. This mirrors how a host at a real restaurant
// would seat a walk-in: give them the smallest table that fits, so
// larger tables stay free for larger parties.
const createReservation = asyncHandler(async (req, res) => {
  const { date, timeSlot, guests, tableId } = req.body;

  if (!isValidTimeSlot(timeSlot)) {
    throw new ApiError(400, `Invalid time slot: ${timeSlot}`);
  }
  if (isPastDate(date)) {
    throw new ApiError(400, 'Cannot book a reservation for a past date');
  }

  let table;

  if (tableId) {
    table = await Table.findOne({ _id: tableId, isActive: true });
    if (!table) throw new ApiError(404, 'Table not found or inactive');

    if (table.capacity < guests) {
      throw new ApiError(
        400,
        `Table ${table.label} seats up to ${table.capacity} guests, which is fewer than the ${guests} requested`
      );
    }

    const available = await isTableAvailable(table._id, date, timeSlot);
    if (!available) {
      throw new ApiError(
        409,
        `Table ${table.label} is already booked for ${date} at ${timeSlot}`
      );
    }
  } else {
    // Auto-assign: find candidate tables big enough for the party,
    // smallest capacity first, and take the first one that's free.
    const candidates = await Table.find({
      isActive: true,
      capacity: { $gte: guests },
    }).sort({ capacity: 1 });

    if (candidates.length === 0) {
      throw new ApiError(
        400,
        `No table can accommodate a party of ${guests}. Please reduce the group size or contact the restaurant.`
      );
    }

    for (const candidate of candidates) {
      // eslint-disable-next-line no-await-in-loop
      if (await isTableAvailable(candidate._id, date, timeSlot)) {
        table = candidate;
        break;
      }
    }

    if (!table) {
      throw new ApiError(
        409,
        `No tables are available for ${date} at ${timeSlot} for a party of ${guests}. Please try a different date or time.`
      );
    }
  }

  try {
    const reservation = await Reservation.create({
      user: req.user._id,
      table: table._id,
      date,
      timeSlot,
      guests,
    });
    const populated = await reservation.populate('table', 'label capacity');
    res.status(201).json({ success: true, reservation: populated });
  } catch (error) {
    // Race condition guard: the partial unique index on the Reservation
    // model rejects a second confirmed reservation for the same
    // table/date/timeSlot even if two requests passed the check above
    // at nearly the same time.
    if (error.code === 11000) {
      throw new ApiError(409, 'This table was just booked by someone else for that slot. Please try again.');
    }
    throw error;
  }
});

// @route  GET /api/reservations/my
// @access Private/Customer
const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user._id })
    .populate('table', 'label capacity')
    .sort({ date: -1, timeSlot: 1 });
  res.status(200).json({ success: true, count: reservations.length, reservations });
});

// @route  DELETE /api/reservations/:id
// @access Private/Customer (only their own reservation)
const cancelMyReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw new ApiError(404, 'Reservation not found');

  if (reservation.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only cancel your own reservations');
  }
  if (reservation.status === 'cancelled') {
    throw new ApiError(400, 'This reservation is already cancelled');
  }

  reservation.status = 'cancelled';
  await reservation.save();
  res.status(200).json({ success: true, message: 'Reservation cancelled', reservation });
});

// ----------------------- Admin endpoints -----------------------

// @route  GET /api/reservations?date=YYYY-MM-DD
// @access Private/Admin
const getAllReservations = asyncHandler(async (req, res) => {
  const { date, status } = req.query;
  const filter = {};
  if (date) filter.date = date;
  if (status) filter.status = status;

  const reservations = await Reservation.find(filter)
    .populate('table', 'label capacity')
    .populate('user', 'name email')
    .sort({ date: -1, timeSlot: 1 });

  res.status(200).json({ success: true, count: reservations.length, reservations });
});

// @route  PUT /api/reservations/:id
// @access Private/Admin
// Lets an admin update date/timeSlot/table/guests/status on any
// reservation, re-running the same availability check as a normal booking
// whenever the table/date/timeSlot actually changes.
const adminUpdateReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw new ApiError(404, 'Reservation not found');

  const { date, timeSlot, guests, tableId, status } = req.body;

  const nextDate = date ?? reservation.date;
  const nextSlot = timeSlot ?? reservation.timeSlot;
  const nextTableId = tableId ?? reservation.table.toString();
  const nextGuests = guests ?? reservation.guests;

  if (timeSlot && !isValidTimeSlot(timeSlot)) {
    throw new ApiError(400, `Invalid time slot: ${timeSlot}`);
  }

  const tableChanged =
    date || timeSlot || tableId
      ? nextTableId !== reservation.table.toString() || nextDate !== reservation.date || nextSlot !== reservation.timeSlot
      : false;

  if (tableChanged) {
    const table = await Table.findOne({ _id: nextTableId, isActive: true });
    if (!table) throw new ApiError(404, 'Table not found or inactive');
    if (table.capacity < nextGuests) {
      throw new ApiError(400, `Table ${table.label} seats up to ${table.capacity} guests`);
    }
    const available = await isTableAvailable(nextTableId, nextDate, nextSlot, reservation._id);
    if (!available) {
      throw new ApiError(409, `Table ${table.label} is already booked for ${nextDate} at ${nextSlot}`);
    }
    reservation.table = nextTableId;
  }

  reservation.date = nextDate;
  reservation.timeSlot = nextSlot;
  reservation.guests = nextGuests;
  if (status && ['confirmed', 'cancelled'].includes(status)) {
    reservation.status = status;
  }

  await reservation.save();
  const populated = await reservation.populate([
    { path: 'table', select: 'label capacity' },
    { path: 'user', select: 'name email' },
  ]);

  res.status(200).json({ success: true, reservation: populated });
});

// @route  DELETE /api/reservations/:id/admin
// @access Private/Admin
// Admins can cancel any reservation (customers can only cancel their own,
// handled by cancelMyReservation above).
const adminCancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw new ApiError(404, 'Reservation not found');

  reservation.status = 'cancelled';
  await reservation.save();
  res.status(200).json({ success: true, message: 'Reservation cancelled', reservation });
});

module.exports = {
  createReservation,
  getMyReservations,
  cancelMyReservation,
  getAllReservations,
  adminUpdateReservation,
  adminCancelReservation,
};
