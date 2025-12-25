import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

// Validation schema
const resetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  password2: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    // Extract token from URL
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      // No token provided, redirect to forgot password
      navigate('/forgot-password');
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (values, { setSubmitting }) => {
    if (!token) return;
    
    setIsLoading(true);
    
    const result = await resetPassword(token, values.password, values.password2);
    
    setIsLoading(false);
    setSubmitting(false);
    
    if (result.success) {
      setResetSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  if (!token) {
    return null; // or a loading spinner
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Reset Password</h2>
        <p className="auth-subtitle">Enter your new password below.</p>
        
        {resetSuccess ? (
          <div className="success-message">
            <p>✓ Password reset successful!</p>
            <p>Redirecting to login page...</p>
          </div>
        ) : (
          <Formik
            initialValues={{ password: '', password2: '' }}
            validationSchema={resetPasswordSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="auth-form">
                <div className="form-group">
                  <label htmlFor="password">New Password</label>
                  <Field
                    type="password"
                    name="password"
                    id="password"
                    placeholder="Enter new password"
                    className="form-input"
                  />
                  <ErrorMessage name="password" component="div" className="error-message" />
                </div>

                <div className="form-group">
                  <label htmlFor="password2">Confirm New Password</label>
                  <Field
                    type="password"
                    name="password2"
                    id="password2"
                    placeholder="Confirm new password"
                    className="form-input"
                  />
                  <ErrorMessage name="password2" component="div" className="error-message" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="auth-button"
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>

                <div className="auth-redirect">
                  Remember your password? <Link to="/login">Login</Link>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
