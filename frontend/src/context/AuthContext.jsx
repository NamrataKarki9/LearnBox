import { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        
        // Get Firebase ID token
        const idToken = await firebaseUser.getIdToken();
        
        // Verify with backend and get JWT tokens
        try {
          const response = await authAPI.firebaseLogin({ idToken });
          const { tokens, user: userData } = response.data;
          
          localStorage.setItem('access_token', tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);
          localStorage.setItem('user', JSON.stringify(userData));
          
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Backend verification failed:', error);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Register with Firebase
  const register = async (userData) => {
    try {
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      // Send verification email (Firebase handles this automatically)
      await sendEmailVerification(userCredential.user);
      
      // Register user in Django backend
      const idToken = await userCredential.user.getIdToken();
      await authAPI.register({
        ...userData,
        firebase_uid: userCredential.user.uid,
        idToken
      });
      
      toast.success('Registration successful! Please check your email to verify your account.');
      return { success: true, user: userCredential.user };
    } catch (error) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Login with Firebase
  const login = async (credentials) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        toast.error('Please verify your email before logging in. Check your inbox.');
        return { success: false, error: 'Email not verified' };
      }
      
      toast.success('Login successful!');
      return { success: true, user: userCredential.user };
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
  };

  // Resend verification email
  const resendVerification = async () => {
    try {
      if (firebaseUser) {
        await sendEmailVerification(firebaseUser);
        toast.success('Verification email sent! Please check your inbox.');
        return { success: true };
      }
      toast.error('No user found. Please register first.');
      return { success: false };
    } catch (error) {
      const errorMessage = error.message || 'Failed to resend verification email.';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    firebaseUser,
    isAuthenticated,
    loading,
    register,
    login,
    logout,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
