import express from 'express';
import {
    inviteCollegeAdmin,
    validateInvitation,
    acceptInvitationAndRegister,
    getPendingCollegeAdminInvitations,
    resendInvitationEmail,
    cancelInvitationEndpoint
} from '../controllers/invitation.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// Public routes
router.get('/validate-invitation/:token', validateInvitation);
router.post('/accept-invitation', acceptInvitationAndRegister);

// Protected SUPER_ADMIN routes
router.post('/admin/invite-college-admin', authMiddleware, requireRole(ROLES.SUPER_ADMIN), inviteCollegeAdmin);
router.get('/admin/invitations/pending', authMiddleware, requireRole(ROLES.SUPER_ADMIN), getPendingCollegeAdminInvitations);
router.post('/admin/invitations/:invitationId/resend', authMiddleware, requireRole(ROLES.SUPER_ADMIN), resendInvitationEmail);
router.post('/admin/invitations/:invitationId/cancel', authMiddleware, requireRole(ROLES.SUPER_ADMIN), cancelInvitationEndpoint);

export default router;
