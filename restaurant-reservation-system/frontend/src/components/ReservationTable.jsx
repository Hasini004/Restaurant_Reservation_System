import { useState } from 'react';
import Button from './Button';
import Modal from './Modal';
import Input from './Input';
import Alert from './Alert';
import { TIME_SLOTS } from '../api/constants';
import { adminUpdateReservation, adminCancelReservation } from '../api/reservations';

/**
 * Admin-only table of all reservations. Supports inline cancel and a
 * modal for editing date/time/guests/status on any reservation.
 */
const ReservationTable = ({ reservations, onChanged }) => {
  const [editing, setEditing] = useState(null); // reservation being edited
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const openEdit = (reservation) => {
    setEditing(reservation);
    setForm({
      date: reservation.date,
      timeSlot: reservation.timeSlot,
      guests: reservation.guests,
      status: reservation.status,
    });
    setError('');
  };

  const closeEdit = () => setEditing(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'guests' ? Number(value) : value }));
  };

  const saveEdit = async () => {
    setError('');
    setBusyId(editing._id);
    try {
      await adminUpdateReservation(editing._id, form);
      closeEdit();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (id) => {
    setBusyId(id);
    try {
      await adminCancelReservation(id);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (reservations.length === 0) {
    return <p className="empty-state">No reservations match this filter.</p>;
  }

  return (
    <>
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Date</th>
              <th>Time</th>
              <th>Table</th>
              <th>Guests</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r._id}>
                <td>
                  <div>{r.user?.name}</div>
                  <div className="text-muted">{r.user?.email}</div>
                </td>
                <td>{r.date}</td>
                <td>{r.timeSlot}</td>
                <td>{r.table?.label}</td>
                <td>{r.guests}</td>
                <td>
                  <span className={`status-badge status-${r.status}`}>{r.status}</span>
                </td>
                <td className="actions-cell">
                  <Button variant="secondary" onClick={() => openEdit(r)}>
                    Edit
                  </Button>
                  {r.status !== 'cancelled' && (
                    <Button
                      variant="danger"
                      loading={busyId === r._id}
                      onClick={() => handleCancel(r._id)}
                    >
                      Cancel
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        title="Edit reservation"
        onClose={closeEdit}
        footer={
          <>
            <Button variant="ghost" onClick={closeEdit}>
              Discard
            </Button>
            <Button onClick={saveEdit} loading={busyId === editing?._id}>
              Save changes
            </Button>
          </>
        }
      >
        {editing && (
          <>
            <Input label="Date" name="date" type="date" value={form.date} onChange={handleChange} />
            <Input label="Time slot" name="timeSlot" as="select" value={form.timeSlot} onChange={handleChange}>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </Input>
            <Input label="Guests" name="guests" type="number" min={1} value={form.guests} onChange={handleChange} />
            <Input label="Status" name="status" as="select" value={form.status} onChange={handleChange}>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </Input>
          </>
        )}
      </Modal>
    </>
  );
};

export default ReservationTable;
