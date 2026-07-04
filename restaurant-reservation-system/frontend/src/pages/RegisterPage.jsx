import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // New sign-ups are always created as "customer". Admin accounts are
      // provisioned separately (see backend/utils/seed.js), which keeps
      // the public registration form from being a way to self-grant
      // admin access.
      const user = await register({ ...form, role: 'customer' });
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Card title="Create an account" subtitle="Book tables at Bella Tavola">
        <form onSubmit={handleSubmit}>
          <Alert type="error" message={error} onClose={() => setError('')} />
          <Input label="Full name" name="name" value={form.name} onChange={handleChange} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <p className="password-hint">
             Password must be at least 6 characters and include letters and numbers.
          </p>
          <Button type="submit" loading={submitting} fullWidth>
            Sign up
          </Button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </Card>
    </div>
  );
};

export default RegisterPage;
