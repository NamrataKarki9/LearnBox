/**
 * Invitation Service
 * Handles College Admin invitation creation, validation, and acceptance
 */

import prisma from '../prisma.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ROLES } from '../constants/roles.js';

const INVITATION_EXPIRY_HOURS = 24;

/**
 * Generate a secure invitation token
 * @returns {string} Secure random token
 */
export const generateInvitationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Create a college admin invitation
 * @param {string} inviteeEmail - Email of person to invite
 * @param {string} inviteeName - Name of invited person
 * @param {number} collegeId - College ID
 * @param {number} createdBy - SuperAdmin user ID who created invitation
 * @returns {Promise<{success: boolean, invitation?: object, error?: string}>}
 */
export const createInvitation = async (inviteeEmail, inviteeName, collegeId, createdBy) => {
    try {
        // Normalize email
        const normalizedEmail = inviteeEmail.toLowerCase().trim();

        // === Validation ===
        // Check if user already exists with this email
        const existingUser = await prisma.user.findFirst({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            return {
                success: false,
                error: 'A user with this email address already exists in the system.'
            };
        }

        // Check if college exists
        const college = await prisma.college.findUnique({
            where: { id: collegeId }
        });

        if (!college) {
            return {
                success: false,
                error: 'College not found.'
            };
        }

        if (!college.isActive) {
            return {
                success: false,
                error: 'The selected college is currently inactive.'
            };
        }

        // Check if there's already a pending invitation for this email
        const existingInvitation = await prisma.collegeAdminInvitation.findFirst({
            where: {
                inviteeEmail: normalizedEmail,
                status: 'PENDING',
                expiresAt: {
                    gt: new Date() // Not yet expired
                }
            }
        });

        if (existingInvitation) {
            return {
                success: false,
                error: 'An active invitation already exists for this email address. Please wait for the recipient to accept or contact the super admin.',
                existingInvitation: {
                    id: existingInvitation.id,
                    createdAt: existingInvitation.createdAt,
                    expiresAt: existingInvitation.expiresAt
                }
            };
        }

        // Generate secure token
        const inviteToken = generateInvitationToken();
        const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);

        // Create invitation record
        const invitation = await prisma.collegeAdminInvitation.create({
            data: {
                inviteToken,
                inviteeEmail: normalizedEmail,
                inviteeName: inviteeName.trim(),
                collegeId,
                createdBy,
                expiresAt,
                status: 'PENDING'
            },
            include: {
                college: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });

        console.log(`✅ Invitation created for ${normalizedEmail} (Token: ${inviteToken.substring(0, 8)}...)`);

        return {
            success: true,
            invitation: {
                id: invitation.id,
                inviteeEmail: invitation.inviteeEmail,
                inviteeName: invitation.inviteeName,
                college: invitation.college,
                status: invitation.status,
                expiresAt: invitation.expiresAt,
                createdAt: invitation.createdAt,
                inviteToken: inviteToken
            }
        };
    } catch (error) {
        console.error('Error creating invitation:', error);
        return {
            success: false,
            error: 'Failed to create invitation. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        };
    }
};

/**
 * Validate invitation token
 * @param {string} inviteToken - Token to validate
 * @returns {Promise<{valid: boolean, invitation?: object, error?: string}>}
 */
export const validateInvitationToken = async (inviteToken) => {
    try {
        console.log('🔍 Looking up invitation with token:', inviteToken?.substring(0, 8) + '...');
        const invitation = await prisma.collegeAdminInvitation.findUnique({
            where: { inviteToken },
            include: {
                college: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });

        if (!invitation) {
            console.log('❌ Invitation not found in database for token:', inviteToken?.substring(0, 8) + '...');
            return {
                valid: false,
                error: 'Invalid or expired invitation link.'
            };
        }
        console.log('✅ Invitation found:', invitation.id, '| Status:', invitation.status, '| Expires:', invitation.expiresAt);

        // Check if already accepted
        if (invitation.status === 'ACCEPTED') {
            return {
                valid: false,
                error: 'This invitation has already been accepted.'
            };
        }

        // Check if cancelled
        if (invitation.status === 'CANCELLED') {
            return {
                valid: false,
                error: 'This invitation has been cancelled.'
            };
        }

        // Check if expired
        if (invitation.expiresAt < new Date()) {
            // Update status to EXPIRED if not already
            if (invitation.status !== 'EXPIRED') {
                await prisma.collegeAdminInvitation.update({
                    where: { id: invitation.id },
                    data: { status: 'EXPIRED' }
                });
            }
            return {
                valid: false,
                error: 'This invitation has expired. Please ask the super admin to send a new invitation.'
            };
        }

        return {
            valid: true,
            invitation: {
                id: invitation.id,
                inviteeEmail: invitation.inviteeEmail,
                inviteeName: invitation.inviteeName,
                college: invitation.college,
                expiresAt: invitation.expiresAt
            }
        };
    } catch (error) {
        console.error('Error validating invitation token:', error);
        return {
            valid: false,
            error: 'Error validating invitation.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        };
    }
};

/**
 * Accept invitation and create college admin account
 * @param {string} inviteToken - Invitation token
 * @param {string} username - Desired username
 * @param {string} password - Desired password
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export const acceptInvitation = async (
    inviteToken,
    username,
    password,
    firstName = '',
    lastName = ''
) => {
    try {
        // Validate invitation
        const validation = await validateInvitationToken(inviteToken);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        const invitation = validation.invitation;

        // === Input Validation ===
        if (!username || !username.trim()) {
            return {
                success: false,
                error: 'Username is required.',
                field: 'username'
            };
        }

        if (!password || !password.trim()) {
            return {
                success: false,
                error: 'Password is required.',
                field: 'password'
            };
        }

        // Validate password strength
        if (password.length < 8) {
            return {
                success: false,
                error: 'Password must contain at least 8 characters.',
                field: 'password'
            };
        }

        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        if (!hasNumber || !hasSpecialChar) {
            return {
                success: false,
                error: 'Password must contain at least one number and one special character.',
                field: 'password'
            };
        }

        // Check username uniqueness
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username.trim() },
                    { email: invitation.inviteeEmail }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.email === invitation.inviteeEmail) {
                return {
                    success: false,
                    error: 'This email address is already registered.',
                    field: 'email'
                };
            } else {
                return {
                    success: false,
                    error: 'This username is already taken.',
                    field: 'username'
                };
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user within transaction to ensure consistency
        const user = await prisma.$transaction(async (prisma) => {
            // Create college admin user
            const newUser = await prisma.user.create({
                data: {
                    username: username.trim(),
                    email: invitation.inviteeEmail,
                    password: hashedPassword,
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    role: ROLES.COLLEGE_ADMIN,
                    is_verified: true, // Pre-verified since invited by superadmin
                    collegeId: invitation.collegeId
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    role: true,
                    collegeId: true,
                    college: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    }
                }
            });

            // Update invitation record to ACCEPTED
            await prisma.collegeAdminInvitation.update({
                where: { id: invitation.id },
                data: {
                    status: 'ACCEPTED',
                    acceptedAt: new Date(),
                    acceptedByUserId: newUser.id
                }
            });

            return newUser;
        });

        console.log(`✅ College Admin account created for ${user.email}`);

        return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                collegeId: user.collegeId,
                college: user.college
            }
        };
    } catch (error) {
        console.error('Error accepting invitation:', error);

        // Check for duplicate key error
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'unknown';
            return {
                success: false,
                error: `A user with this ${field} already exists.`,
                field: field
            };
        }

        return {
            success: false,
            error: 'Failed to complete registration. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        };
    }
};

/**
 * Resend invitation email
 * @param {number} invitationId - Invitation ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const resendInvitation = async (invitationId) => {
    try {
        const invitation = await prisma.collegeAdminInvitation.findUnique({
            where: { id: invitationId }
        });

        if (!invitation) {
            return {
                success: false,
                error: 'Invitation not found.'
            };
        }

        // Check if invitation can be resent
        if (invitation.status === 'ACCEPTED') {
            return {
                success: false,
                error: 'This invitation has already been accepted.'
            };
        }

        if (invitation.status === 'CANCELLED') {
            return {
                success: false,
                error: 'This invitation has been cancelled.'
            };
        }

        // If expired, generate new token and extend expiry
        if (invitation.status === 'EXPIRED' || invitation.expiresAt < new Date()) {
            const newToken = generateInvitationToken();
            const newExpiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);

            const updatedInvitation = await prisma.collegeAdminInvitation.update({
                where: { id: invitationId },
                data: {
                    inviteToken: newToken,
                    status: 'PENDING',
                    expiresAt: newExpiresAt
                }
            });

            return {
                success: true,
                invitation: {
                    id: updatedInvitation.id,
                    inviteToken: updatedInvitation.inviteToken,
                    inviteeEmail: updatedInvitation.inviteeEmail,
                    expiresAt: updatedInvitation.expiresAt
                }
            };
        }

        // For pending invitations, just return existing token
        return {
            success: true,
            invitation: {
                id: invitation.id,
                inviteToken: invitation.inviteToken,
                inviteeEmail: invitation.inviteeEmail,
                expiresAt: invitation.expiresAt
            }
        };
    } catch (error) {
        console.error('Error resending invitation:', error);
        return {
            success: false,
            error: 'Failed to resend invitation.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        };
    }
};

/**
 * Cancel invitation
 * @param {number} invitationId - Invitation ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const cancelInvitation = async (invitationId) => {
    try {
        const invitation = await prisma.collegeAdminInvitation.findUnique({
            where: { id: invitationId }
        });

        if (!invitation) {
            return {
                success: false,
                error: 'Invitation not found.'
            };
        }

        if (invitation.status === 'ACCEPTED') {
            return {
                success: false,
                error: 'Cannot cancel an accepted invitation.'
            };
        }

        await prisma.collegeAdminInvitation.update({
            where: { id: invitationId },
            data: { status: 'CANCELLED' }
        });

        return { success: true };
    } catch (error) {
        console.error('Error cancelling invitation:', error);
        return {
            success: false,
            error: 'Failed to cancel invitation.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        };
    }
};

/**
 * Get pending invitations for a superadmin
 * @param {number} createdBy - SuperAdmin user ID
 * @returns {Promise<Array>}
 */
export const getPendingInvitations = async (createdBy) => {
    try {
        const invitations = await prisma.collegeAdminInvitation.findMany({
            where: {
                createdBy,
                status: {
                    in: ['PENDING', 'EXPIRED']
                }
            },
            include: {
                college: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return invitations;
    } catch (error) {
        console.error('Error fetching pending invitations:', error);
        return [];
    }
};
