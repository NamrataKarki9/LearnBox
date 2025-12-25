import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Pages.css';

const EmailVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      // Extract token from URL
      const token = searchParams.get('token');
      
      if (!token) {
        setVerifying(false);
        setError('Invalid verification link. No token provided.');
        return;
      }

      // Call verification API
      const result = await verifyEmail(token);
      
      setVerifying(false);
      
      if (result.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.error || 'Email verification failed.');
      }
    };

    verifyToken();
  }, [searchParams, verifyEmail, navigate]);

  return (
    <div className="page-container">
      <div className="page-card">
        <h2>Email Verification</h2>
        
        {verifying && (
          <div className="verification-status">
            <div className="spinner"></div>
            <p>Verifying your email...</p>
          </div>
        )}

        {success && (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Email Verified Successfully!</h3>
            <p>Your email has been verified. You can now login to your account.</p>
            <p className="redirect-message">Redirecting to login page in 3 seconds...</p>
            <Link to="/login" className="page-button">
              Go to Login
            </Link>
          </div>
        )}

        {error && !verifying && (
          <div className="error-message">
            <div className="error-icon">✗</div>
            <h3>Verification Failed</h3>
            <p>{error}</p>
            <div className="action-links">
              <Link to="/login" className="page-button">
                Go to Login
              </Link>
              <Link to="/signup" className="page-button secondary">
                Sign Up Again
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
