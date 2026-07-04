import { useState } from 'react';
import Input from './Input';
import Button from './Button';
import Alert from './Alert';
import { TIME_SLOTS } from '../api/constants';
import { createReservation } from '../api/reservations';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Booking form for customers. Table is auto-assigned by the backend
 * (smallest table that fits the party and is free), which is why there's
 * no "choose a table" field — that mirrors how the assignment describes
 * booking a table for a date/time/party size, and keeps the conflict
 * logic in one place (the server).
 */
const ReservationForm = ({ onBooked }) => {
  const [form, setForm] = useState({ date: todayStr(), timeSlot: '', guests: 2 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'guests' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.timeSlot) {
      setError('Please choose a time slot.');
      return;
    }

    setSubmitting(true);
    try {
      const { reservation } = await createReservation(form);
      setSuccess(
        `Booked! Table ${reservation.table.label} on ${reservation.date} at ${reservation.timeSlot}.`
      );
      setForm((prev) => ({ ...prev, timeSlot: '' }));
      onBooked?.(reservation);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="reservation-form">
      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <Input
        label="Date"
        name="date"
        type="date"
        value={form.date}
        onChange={handleChange}
        min={todayStr()}
        required
      />

      <Input label="Time slot" name="timeSlot" as="select" value={form.timeSlot} onChange={handleChange} required>
        <option value="">Select a time slot</option>
        {TIME_SLOTS.map((slot) => (
          <option key={slot} value={slot}>
            {slot}
          </option>
        ))}
      </Input>

      <Input
        label="Number of guests"
        name="guests"
        type="number"
        min={1}
        value={form.guests}
        onChange={handleChange}
        required
      />

      <Button type="submit" loading={submitting} fullWidth>
        Reserve a table
      </Button>
    </form>
  );
};

export default ReservationForm;
