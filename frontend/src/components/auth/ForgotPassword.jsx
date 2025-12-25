import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

// Validation schema
const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsLoading(true);
    
    const result = await forgotPassword(values.email);
    
    setIsLoading(false);
    setSubmitting(false);
    
    if (result.success) {
      setEmailSent(true);
      resetForm();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        <p className="auth-subtitle">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {emailSent ? (
          <div className="success-message">
            <p>✓ Password reset link sent!</p>
            <p>Please check your email for instructions to reset your password.</p>
            <Link to="/login" className="auth-button" style={{ marginTop: '20px' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <Formik
            initialValues={{ email: '' }}
            validationSchema={forgotPasswordSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <Field
                    type="email"
                    name="email"
                    id="email"
                    placeholder="Enter your email"
                    className="form-input"
                  />
                  <ErrorMessage name="email" component="div" className="error-message" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="auth-button"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;
