/**
 * Invitation Controller
 * Handles College Admin invitation endpoints
 */

import prisma from '../prisma.js';
import { HTTP_STATUS } from '../constants/errors.js';
import {
    createInvitation,
    validateInvitationToken,
    acceptInvitation,
    resendInvitation,
    cancelInvitation,
    getPendingInvitations
} from '../services/invitation.service.js';
import { sendCollegeAdminInvitation } from '../services/email.service.js';

/**
 * Create and send College Admin invitation
 * @route POST /api/auth/admin/invite-college-admin
 * @access SUPER_ADMIN only
 */
export const inviteCollegeAdmin = async (req, res) => {
    try {
        console.log('📨 Invitation endpoint called');
        console.log('📨 User:', req.user);
        console.log('📨 Request body:', req.body);
        
        const { email, name, collegeId } = req.body;

        // === Input Validation ===
        if (!email || !email.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Email address is required.',
                field: 'email'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.toLowerCase())) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Please enter a valid email address.',
                field: 'email'
            });
        }

        if (!name || !name.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Name is required.',
                field: 'name'
            });
        }

        if (!collegeId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'College ID is required.',
                field: 'collegeId'
            });
        }

        // Create invitation
        const invitationResult = await createInvitation(
            email,
            name,
            parseInt(collegeId),
            req.user.id
        );

        if (!invitationResult.success) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                error: invitationResult.error
            });
        }

        // Send invitation email
        console.log('📧 Preparing to send invitation email');
        console.log('📧 Invitation result:', {
            invitationId: invitationResult.invitation?.id,
            inviteeEmail: invitationResult.invitation?.inviteeEmail,
            hasToken: !!invitationResult.invitation?.inviteToken,
            tokenPreview: invitationResult.invitation?.inviteToken?.substring(0, 16) + '...'
        });
        
        const superAdmin = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { first_name: true, last_name: true }
        });

        const superAdminName = `${superAdmin?.first_name || ''} ${superAdmin?.last_name || ''}`.trim() || 'Super Admin';
        console.log('📧 Super admin name:', superAdminName);
        console.log('📧 Calling sendCollegeAdminInvitation with token:', invitationResult.invitation?.inviteToken?.substring(0, 16) + '...');

        const emailResult = await sendCollegeAdminInvitation(
            email,
            name,
            invitationResult.invitation.college.name,
            invitationResult.invitation.inviteToken,
            superAdminName
        );

        console.log('📧 Email result:', emailResult);

        if (!emailResult.success) {
            console.error('Email sending failed:', emailResult.error);
            // Still return success for invitation creation, but note email issue
            return res.status(HTTP_STATUS.CREATED).json({
                success: true,
                invitation: invitationResult.invitation,
                warning: 'Invitation created but email could not be sent. Please resend manually.'
            });
        }

        return res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Invitation created and email sent successfully.',
            invitation: invitationResult.invitation
        });
    } catch (error) {
        console.error('Error creating invitation:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to create invitation. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Validate invitation token
 * @route GET /api/auth/validate-invitation/:token
 * @access Public
 */
export const validateInvitation = async (req, res) => {
    try {
        const { token } = req.params;
        console.log('🔗 Validating invitation token:', token?.substring(0, 8) + '...');

        if (!token) {
            console.log('❌ No token provided');
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Invitation token is required.'
            });
        }

        const validation = await validateInvitationToken(token);
        console.log('📋 Validation result:', validation);

        if (!validation.valid) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: validation.error
            });
        }

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            invitation: validation.invitation
        });
    } catch (error) {
        console.error('Error validating invitation:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to validate invitation. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Accept invitation and complete registration
 * @route POST /api/auth/accept-invitation
 * @access Public
 */
export const acceptInvitationAndRegister = async (req, res) => {
    try {
        const { token, username, password, firstName, lastName } = req.body;

        // === Input Validation ===
        if (!token) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Invitation token is required.',
                field: 'token'
            });
        }

        const acceptResult = await acceptInvitation(
            token,
            username,
            password,
            firstName,
            lastName
        );

        if (!acceptResult.success) {
            let statusCode = HTTP_STATUS.BAD_REQUEST;

            if (acceptResult.field === 'username' || acceptResult.field === 'email') {
                statusCode = HTTP_STATUS.CONFLICT;
            } else if (acceptResult.field === 'server') {
                statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
            }

            return res.status(statusCode).json({
                success: false,
                error: acceptResult.error,
                field: acceptResult.field
            });
        }

        return res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Registration completed successfully! You can now login.',
            user: acceptResult.user
        });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to complete registration. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get pending invitations
 * @route GET /api/auth/admin/invitations/pending
 * @access SUPER_ADMIN only
 */
export const getPendingCollegeAdminInvitations = async (req, res) => {
    try {
        const invitations = await getPendingInvitations(req.user.id);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: invitations,
            count: invitations.length
        });
    } catch (error) {
        console.error('Error fetching pending invitations:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to fetch invitations.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Resend invitation email
 * @route POST /api/auth/admin/invitations/:invitationId/resend
 * @access SUPER_ADMIN only
 */
export const resendInvitationEmail = async (req, res) => {
    try {
        const { invitationId } = req.params;

        if (!invitationId || isNaN(parseInt(invitationId))) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Valid invitation ID is required.'
            });
        }

        // Verify invitation belongs to this superadmin
        const invitation = await prisma.collegeAdminInvitation.findUnique({
            where: { id: parseInt(invitationId) }
        });

        if (!invitation) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                error: 'Invitation not found.'
            });
        }

        if (invitation.createdBy !== req.user.id) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                error: 'You do not have permission to resend this invitation.'
            });
        }

        const resendResult = await resendInvitation(parseInt(invitationId));

        if (!resendResult.success) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: resendResult.error
            });
        }

        // Send email with new/existing token
        const invitationData = await prisma.collegeAdminInvitation.findUnique({
            where: { id: parseInt(invitationId) },
            include: {
                college: { select: { name: true } }
            }
        });

        const superAdmin = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { first_name: true, last_name: true }
        });

        const superAdminName = `${superAdmin?.first_name || ''} ${superAdmin?.last_name || ''}`.trim() || 'Super Admin';

        await sendCollegeAdminInvitation(
            invitationData.inviteeEmail,
            invitationData.inviteeName,
            invitationData.college.name,
            resendResult.invitation.inviteToken,
            superAdminName
        );

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Invitation email resent successfully.',
            invitation: resendResult.invitation
        });
    } catch (error) {
        console.error('Error resending invitation:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to resend invitation.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Cancel invitation
 * @route POST /api/auth/admin/invitations/:invitationId/cancel
 * @access SUPER_ADMIN only
 */
export const cancelInvitationEndpoint = async (req, res) => {
    try {
        const { invitationId } = req.params;

        if (!invitationId || isNaN(parseInt(invitationId))) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Valid invitation ID is required.'
            });
        }

        // Verify invitation belongs to this superadmin
        const invitation = await prisma.collegeAdminInvitation.findUnique({
            where: { id: parseInt(invitationId) }
        });

        if (!invitation) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                error: 'Invitation not found.'
            });
        }

        if (invitation.createdBy !== req.user.id) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                error: 'You do not have permission to cancel this invitation.'
            });
        }

        const cancelResult = await cancelInvitation(parseInt(invitationId));

        if (!cancelResult.success) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: cancelResult.error
            });
        }

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Invitation cancelled successfully.'
        });
    } catch (error) {
        console.error('Error cancelling invitation:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to cancel invitation.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
