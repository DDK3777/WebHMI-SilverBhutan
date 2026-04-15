import { useState } from 'react';
import { signInWithPassword, supabase } from '../lib/supabaseClient';

export default function LoginPage({ onDemoAccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('Login with your Supabase user account.');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('Checking your login...');

    const { error } = await signInWithPassword(email, password);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage('Login successful. Opening HMI...');
    setLoading(false);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-title">Solar Pump HMI</div>
          <div className="auth-subtitle">Secure Web Login</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              placeholder="operator@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Please wait...' : 'Login'}
          </button>
        </form>

        <div className="auth-message">{message}</div>

        {!supabase ? (
          <div className="auth-demo-panel">
            <p>Supabase is not configured yet. You can still open the screen in demo mode.</p>
            <button type="button" className="demo-button" onClick={onDemoAccess}>
              Open Demo HMI
            </button>
          </div>
        ) : (
          <div className="auth-help">
            Create the first user from Supabase Authentication, then open Users and click Add user.
          </div>
        )}
      </div>
    </div>
  );
}
