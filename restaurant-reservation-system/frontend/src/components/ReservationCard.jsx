import Button from './Button';

/**
 * Displays a single reservation with a Cancel action.
 * Used on the customer dashboard's "My reservations" list.
 */
const ReservationCard = ({ reservation, onCancel, cancelling }) => {
  const { date, timeSlot, guests, status, table } = reservation;
  const isCancelled = status === 'cancelled';

  return (
    <div className={`reservation-card ${isCancelled ? 'reservation-card-cancelled' : ''}`}>
      <div className="reservation-card-main">
        <p className="reservation-card-date">{date}</p>
        <p className="reservation-card-slot">{timeSlot}</p>
        <p className="reservation-card-meta">
          Table {table?.label ?? '—'} · {guests} guest{guests > 1 ? 's' : ''}
        </p>
      </div>

      <div className="reservation-card-side">
        <span className={`status-badge status-${status}`}>{status}</span>
        {!isCancelled && (
          <Button variant="danger" loading={cancelling} onClick={() => onCancel(reservation._id)}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReservationCard;
