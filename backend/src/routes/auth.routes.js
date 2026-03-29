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
    resendOTP,
    updateProfile,
    verifyPassword,
    changePassword,
    getUserSettings,
    updateNotificationSettings,
    updatePreferences
} from '../controllers/auth.controller.js';
import {
    inviteCollegeAdmin,
    validateInvitation,
    acceptInvitationAndRegister,
    getPendingCollegeAdminInvitations,
    resendInvitationEmail,
    cancelInvitationEndpoint
} from '../controllers/invitation.controller.js';
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

// Invitation routes (public)
router.get('/validate-invitation/:token', validateInvitation); // NEW: Validate invite token
router.post('/accept-invitation', acceptInvitationAndRegister); // NEW: Accept invite & register

// Protected routes
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile); // NEW: Update user profile
router.post('/verify-password', authMiddleware, verifyPassword); // NEW: Verify current password
router.put('/change-password', authMiddleware, changePassword); // NEW: Change password
router.get('/settings', authMiddleware, getUserSettings);
router.put('/settings/notifications', authMiddleware, updateNotificationSettings);
router.put('/settings/preferences', authMiddleware, updatePreferences);

// Admin routes - SUPER_ADMIN only
router.post('/admin/create-college-admin', authMiddleware, requireRole(ROLES.SUPER_ADMIN), createCollegeAdmin);

// Invitation admin routes - SUPER_ADMIN only (NEW)
router.post('/admin/invite-college-admin', authMiddleware, requireRole(ROLES.SUPER_ADMIN), inviteCollegeAdmin); // NEW: Create invitation
router.get('/admin/invitations/pending', authMiddleware, requireRole(ROLES.SUPER_ADMIN), getPendingCollegeAdminInvitations); // NEW: List pending invitations
router.post('/admin/invitations/:invitationId/resend', authMiddleware, requireRole(ROLES.SUPER_ADMIN), resendInvitationEmail); // NEW: Resend email
router.post('/admin/invitations/:invitationId/cancel', authMiddleware, requireRole(ROLES.SUPER_ADMIN), cancelInvitationEndpoint); // NEW: Cancel invitation

export default router;

