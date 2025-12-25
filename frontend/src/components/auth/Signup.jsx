import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

// Validation schema for registration
const signupSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .required('Username is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  password2: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (values, { setSubmitting }) => {
    setIsLoading(true);
    
    const result = await register(values);
    
    setIsLoading(false);
    setSubmitting(false);
    
    if (result.success) {
      // Show success message and redirect to login
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Sign Up for LearnBox</h2>
        <p className="auth-subtitle">Create your account to get started.</p>
        
        <Formik
          initialValues={{
            username: '',
            email: '',
            password: '',
            password2: '',
          }}
          validationSchema={signupSchema}
          onSubmit={handleRegister}
        >
          {({ isSubmitting }) => (
            <Form className="auth-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <Field
                  type="text"
                  name="username"
                  id="username"
                  placeholder="Choose a username"
                  className="form-input"
                />
                <ErrorMessage name="username" component="div" className="error-message" />
              </div>

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

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <Field
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Create a password"
                  className="form-input"
                />
                <ErrorMessage name="password" component="div" className="error-message" />
              </div>

              <div className="form-group">
                <label htmlFor="password2">Confirm Password</label>
                <Field
                  type="password"
                  name="password2"
                  id="password2"
                  placeholder="Confirm your password"
                  className="form-input"
                />
                <ErrorMessage name="password2" component="div" className="error-message" />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="auth-button"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>

              <div className="auth-redirect">
                Already have an account? <Link to="/login">Login</Link>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Signup;
