import { useState } from 'react';
import Button from './Button';
import Input from './Input';
import Alert from './Alert';
import { createTable, updateTable, deleteTable } from '../api/tables';

/**
 * Admin-only panel for managing the restaurant's physical tables:
 * add new tables, edit capacity/label, or deactivate a table.
 */
const TableManager = ({ tables, onChanged }) => {
  const [form, setForm] = useState({ label: '', capacity: 2 });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'capacity' ? Number(value) : value }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.label.trim()) {
      setError('Table label is required.');
      return;
    }
    setSubmitting(true);
    try {
      await createTable(form);
      setForm({ label: '', capacity: 2 });
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCapacityChange = async (table, capacity) => {
    setBusyId(table._id);
    try {
      await updateTable(table._id, { capacity });
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeactivate = async (table) => {
    setBusyId(table._id);
    try {
      await deleteTable(table._id);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <Alert type="error" message={error} onClose={() => setError('')} />

      <form onSubmit={handleAdd} className="table-manager-form">
        <Input label="Label" name="label" value={form.label} onChange={handleChange} placeholder="e.g. T7" />
        <Input label="Capacity" name="capacity" type="number" min={1} value={form.capacity} onChange={handleChange} />
        <Button type="submit" loading={submitting}>
          Add table
        </Button>
      </form>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Capacity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => (
              <tr key={t._id}>
                <td>{t.label}</td>
                <td>
                  <input
                    type="number"
                    min={1}
                    defaultValue={t.capacity}
                    className="form-control form-control-inline"
                    onBlur={(e) => {
                      const val = Number(e.target.value);
                      if (val !== t.capacity && val > 0) handleCapacityChange(t, val);
                    }}
                  />
                </td>
                <td>
                  <Button variant="danger" loading={busyId === t._id} onClick={() => handleDeactivate(t)}>
                    Deactivate
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableManager;
