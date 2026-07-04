import { useCallback, useEffect, useState } from 'react';
import Card from '../components/Card';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import ReservationForm from '../components/ReservationForm';
import ReservationCard from '../components/ReservationCard';
import { getMyReservations, cancelMyReservation } from '../api/reservations';

const CustomerDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const loadReservations = useCallback(async () => {
    setError('');
    try {
      const { reservations: list } = await getMyReservations();
      setReservations(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      await cancelMyReservation(id);
      await loadReservations();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">My reservations</h1>

      <div className="dashboard-grid">
        <Card title="Book a table" className="dashboard-form-card">
          <ReservationForm onBooked={loadReservations} />
        </Card>

        <Card title="Upcoming & past bookings" className="dashboard-list-card">
          <Alert type="error" message={error} onClose={() => setError('')} />

          {loading ? (
            <Loader label="Loading your reservations…" />
          ) : reservations.length === 0 ? (
            <p className="empty-state">You have no reservations yet. Book your first table!</p>
          ) : (
            <div className="reservation-list">
              {reservations.map((r) => (
                <ReservationCard
                  key={r._id}
                  reservation={r}
                  onCancel={handleCancel}
                  cancelling={cancellingId === r._id}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CustomerDashboard;
