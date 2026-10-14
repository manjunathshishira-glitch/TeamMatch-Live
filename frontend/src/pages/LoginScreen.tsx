// LoginScreen for TeamMatch
// First screen in the user journey: email, password, consent
// Handles both login and sign-up via the backend auth endpoints

import React, { useState } from 'react';
import PrimaryButton from '../components/ui/PrimaryButton';
import InputField from '../components/ui/InputField';
import * as api from '../api/client';

interface LoginScreenProps {
  onLogin: (token: string) => Promise<void>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });

  // Validation — only show errors after the field has been touched
  const errors: Record<string, string> = {};
  if (touched.email) {
    if (!email) errors.email = 'Email is required';
    else if (!email.includes('@') || !email.match(/\.(edu|ac\.uk|edu\.au)$/i)) errors.email = 'Please use a university email';
  }
  if (touched.password) {
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
  }

  const isValid = email && email.match(/\.(edu|ac\.uk|edu\.au)$/i) && password.length >= 6 && consent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid || loading) return;
    setApiError(null);
    setLoading(true);
    try {
      const data = mode === 'login'
        ? await api.login(email, password)
        : await api.signup(email, password);
      await onLogin(data.access_token);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo and tagline */}
        <div className="text-center mb-8">
          <h1 className="text-heading font-bold text-primary-500 mb-2">
            TeamMatch
          </h1>
          <p className="text-body text-text-muted">
            Find the right people for your next assignment.
          </p>
        </div>

        {/* Login / Sign-up form */}
        <form onSubmit={handleSubmit} className="card p-6">
          {/* Email field */}
          <InputField label="University email" name="email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
            placeholder="you@university.edu" error={errors.email} required className="mb-4" />

          {/* Password field */}
          <InputField label="Password" name="password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
            placeholder="••••••••" error={errors.password} required className="mb-4" />

          {/* Consent checkbox */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-2 border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-caption text-text-muted">
                I agree to the{' '}
                <button type="button" className="text-accent hover:underline">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button type="button" className="text-accent hover:underline">
                  Privacy Policy
                </button>
                .{' '}
                <span className="block mt-1 text-caption">
                  How we use your data: Your profile and availability data is stored securely in a Supabase database and used only within TeamMatch to match you with compatible teammates. Your data is not shared with third parties.
                </span>
              </span>
            </label>
          </div>

          {/* API error */}
          {apiError && <p className="input-error mb-3">{apiError}</p>}

          {/* Primary button — login or sign-up depending on mode */}
          <div className="mb-3">
            <PrimaryButton
              label={loading
                ? (mode === 'login' ? 'Logging in…' : 'Creating account…')
                : (mode === 'login' ? 'Log in' : 'Create account')}
              type="submit"
              disabled={!isValid || loading} />
          </div>

          {/* Toggle between login and sign-up */}
          <PrimaryButton
            label={mode === 'login' ? 'Create account' : 'Already have an account? Log in'}
            variant="secondary"
            onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setApiError(null); }}
            disabled={loading} />
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;