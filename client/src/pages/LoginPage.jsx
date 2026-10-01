import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from;
  const redirectTo = from ? from.pathname + from.search : '/';

  if (loading) {
    return <p className="status">Loading…</p>;
  }
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  function validate() {
    const next = {};
    if (!email.trim()) {
      next.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      next.email = 'Enter a valid email address';
    }
    if (!password) {
      next.password = 'Password is required';
    }
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setErrors({ form: err.message });
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <h1>Log in</h1>
      {from && <p className="muted">Please log in to continue.</p>}

      <form onSubmit={handleSubmit} noValidate>
        {errors.form && <div className="alert alert-error" role="alert">{errors.form}</div>}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && <p id="email-error" className="field-error">{errors.email}</p>}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && <p id="password-error" className="field-error">{errors.password}</p>}
        </div>

        <button type="submit" className="button button-block" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </section>
  );
}
