import express from 'express';
import { 
    register, 
    login, 
    refresh, 
    getMe, 
    createCollegeAdmin,
    verifyRegistrationOTP,
    forgotPassword,
    resetPassword,
    resendOTP
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole, preventSuperAdminCreation } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// Public routes
router.post('/register', preventSuperAdminCreation, register);
router.post('/verify-registration-otp', verifyRegistrationOTP); // NEW: Verify registration OTP
router.post('/login', login);
router.post('/token/refresh', refresh);
router.post('/forgot-password', forgotPassword); // NEW: Request password reset OTP
router.post('/reset-password', resetPassword); // NEW: Reset password with OTP
router.post('/resend-otp', resendOTP); // NEW: Resend OTP

// Protected routes
router.get('/me', authMiddleware, getMe);

// Admin routes - SUPER_ADMIN only
router.post('/admin/create-college-admin', authMiddleware, requireRole(ROLES.SUPER_ADMIN), createCollegeAdmin);

export default router;

