import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import InputField from './components/InputField';
import Button from './components/Button';
import FormSection from './components/FormSection';
import { api } from './api/client';
import { useAppContext } from './context/AppContext';
import './LoginScreen.css';

const LoginScreen = () => {
  const navigate = useNavigate();
  const { user, signIn } = useAppContext();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Navigate to="/browse-mentors" replace />;

  const isSignup = mode === 'signup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (isSignup && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const { token, user: nextUser } = isSignup
        ? await api.signup(email, password)
        : await api.login(email, password);
      signIn(token, nextUser);
      // New users set up their profile first; returning users go straight to mentors.
      navigate(isSignup ? '/mentee-profile' : '/browse-mentors');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-header">{isSignup ? 'Create your account' : 'Welcome Back!'}</h1>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 420 }}>
        <FormSection
          title={isSignup ? 'Sign up' : 'Log in'}
          description="Book 15-minute ask-me-anything sessions with industry mentors."
        >
          <InputField
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <InputField
            label="Password"
            type="password"
            placeholder={isSignup ? 'At least 6 characters' : 'Enter your password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button
            type="submit"
            label={isSubmitting ? 'Please wait...' : isSignup ? 'Create account' : 'Login'}
            variant="primary"
            fullWidth
            disabled={isSubmitting}
          />
          <p className="auth-switch">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(''); }}
            >
              {isSignup ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </FormSection>
      </form>
    </div>
  );
};

export default LoginScreen;
