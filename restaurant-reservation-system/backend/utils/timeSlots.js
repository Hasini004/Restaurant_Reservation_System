/**
 * The restaurant accepts reservations in fixed, non-overlapping 1-hour
 * slots. Using fixed slots (instead of arbitrary start/end times) keeps
 * the availability logic simple and unambiguous, which is a deliberate
 * design choice documented in the README.
 */
const TIME_SLOTS = [
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '18:00-19:00',
  '19:00-20:00',
  '20:00-21:00',
  '21:00-22:00',
];

const isValidTimeSlot = (slot) => TIME_SLOTS.includes(slot);

module.exports = { TIME_SLOTS, isValidTimeSlot };
