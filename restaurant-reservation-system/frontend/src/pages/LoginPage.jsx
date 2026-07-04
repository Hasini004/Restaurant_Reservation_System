import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Card title="Log in" subtitle="Welcome back to Bella Tavola">
        <form onSubmit={handleSubmit}>
          <Alert type="error" message={error} onClose={() => setError('')} />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <Button type="submit" loading={submitting} fullWidth>
            Log in
          </Button>
        </form>
        <p className="auth-switch">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </Card>
    </div>
  );
};

export default LoginPage;
