import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';

const LoginPage: React.FC = () => {
  const { login, sendCode } = useUser();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    try {
      setIsSendingCode(true);
      setError('');
      const responseCode = await sendCode(email.trim());
      
      if (responseCode) {
        // Development mode - show the code
        setDevCode(responseCode);
      }
      
      setStep('code');
    } catch (error) {
      setError('Failed to send verification code. Please try again.');
      console.error('Send code error:', error);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    try {
      setIsVerifyingCode(true);
      setError('');
      await login(email.trim(), code.trim());
    } catch (error) {
      setError('Invalid verification code. Please try again.');
      console.error('Verify code error:', error);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCode('');
    setError('');
    setDevCode('');
  };

  if (step === 'email') {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h1>Welcome to Arena Scheduler</h1>
            <p>Enter your email address to receive a verification code</p>
          </div>

          <form onSubmit={handleSendCode} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isSendingCode}
                className="form-input"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={isSendingCode || !email.trim()}
            >
              {isSendingCode ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>

          <div className="login-footer">
            <p>
              <strong>Admin Access:</strong> Use <code>s@flabs.se</code> for admin privileges
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Enter Verification Code</h1>
          <p>We sent a verification code to <strong>{email}</strong></p>
        </div>

        {devCode && (
          <div className="dev-code-notice">
            <p><strong>Development Mode:</strong> Your verification code is:</p>
            <code className="dev-code">{devCode}</code>
          </div>
        )}

        <form onSubmit={handleVerifyCode} className="login-form">
          <div className="form-group">
            <label htmlFor="code">Verification Code</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter verification code"
              required
              disabled={isVerifyingCode}
              className="form-input"
              autoComplete="one-time-code"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={handleBackToEmail}
              className="btn btn-secondary"
              disabled={isVerifyingCode}
            >
              Back to Email
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isVerifyingCode || !code.trim()}
            >
              {isVerifyingCode ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>
        </form>

        <div className="login-footer">
          <p>Didn't receive the code? Check your spam folder or try again.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
