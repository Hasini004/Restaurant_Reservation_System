import { useCallback, useEffect, useState } from 'react';
import Card from '../components/Card';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import Input from '../components/Input';
import Button from '../components/Button';
import ReservationTable from '../components/ReservationTable';
import TableManager from '../components/TableManager';
import { getAllReservations } from '../api/reservations';
import { getTables } from '../api/tables';

const AdminDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('reservations'); // 'reservations' | 'tables'

  const loadData = useCallback(async () => {
    setError('');
    try {
      const filters = {};
      if (dateFilter) filters.date = dateFilter;
      if (statusFilter) filters.status = statusFilter;

      const [resData, tableData] = await Promise.all([getAllReservations(filters), getTables()]);
      setReservations(resData.reservations);
      setTables(tableData.tables);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="page-container">
      <h1 className="page-title">Admin dashboard</h1>

      <div className="tabs">
        <button
          type="button"
          className={`tab ${activeTab === 'reservations' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          Reservations
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'tables' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('tables')}
        >
          Tables
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {activeTab === 'reservations' ? (
        <Card
          title="All reservations"
          actions={
            <div className="filter-bar">
              <Input
                label=""
                name="dateFilter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              <Input
                label=""
                name="statusFilter"
                as="select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </Input>
              <Button
                variant="ghost"
                onClick={() => {
                  setDateFilter('');
                  setStatusFilter('');
                }}
              >
                Clear
              </Button>
            </div>
          }
        >
          {loading ? <Loader label="Loading reservations…" /> : <ReservationTable reservations={reservations} onChanged={loadData} />}
        </Card>
      ) : (
        <Card title="Manage tables" subtitle="Add, resize, or deactivate restaurant tables">
          {loading ? <Loader label="Loading tables…" /> : <TableManager tables={tables} onChanged={loadData} />}
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
