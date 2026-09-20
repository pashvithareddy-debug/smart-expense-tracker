import React, { useState } from 'react';
import { Wallet, Sparkles, Lock, Mail, User, DollarSign, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('$');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fillDemoCredentials = () => {
    setEmail('ashvitha@example.com');
    setPassword('password123');
    setIsRegister(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Name is required');
        await register(name.trim(), email.trim(), password, currency);
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card glass-panel">
        {/* Header Branding */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <Wallet size={28} className="auth-logo-icon" />
          </div>
          <h1 className="auth-title font-display">Smart Expense Tracker</h1>
          <p className="auth-subtitle">
            {isRegister
              ? 'Create your account to unlock intelligent expense tracking'
              : 'Sign in to access your financial intelligence hub'}
          </p>
        </div>

        {/* Demo Credentials Helper Pill */}
        <div className="auth-demo-banner" onClick={fillDemoCredentials}>
          <div className="demo-badge">
            <Sparkles size={14} />
            <span>Try Demo</span>
          </div>
          <span className="demo-text">One-click fill test credentials</span>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-icon-wrapper">
                <User size={16} className="input-field-icon" />
                <input
                  type="text"
                  className="form-control with-icon"
                  placeholder="e.g. Ashvitha Reddy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-icon-wrapper">
              <Mail size={16} className="input-field-icon" />
              <input
                type="email"
                className="form-control with-icon"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={16} className="input-field-icon" />
              <input
                type="password"
                className="form-control with-icon"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Preferred Currency</label>
              <div className="input-icon-wrapper">
                <DollarSign size={16} className="input-field-icon" />
                <select
                  className="form-control with-icon"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="$">USD ($) - US Dollar</option>
                  <option value="₹">INR (₹) - Indian Rupee</option>
                  <option value="€">EUR (€) - Euro</option>
                  <option value="£">GBP (£) - British Pound</option>
                  <option value="¥">JPY (¥) - Japanese Yen</option>
                  <option value="CAD$">CAD (CAD$) - Canadian Dollar</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-auth-submit"
            disabled={loading}
          >
            <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Tab Toggle */}
        <div className="auth-footer-toggle">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setIsRegister(false);
                  setError('');
                }}
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                }}
              >
                Create Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
