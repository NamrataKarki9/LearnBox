import prisma from '../prisma.js';
import bcrypt from 'bcryptjs';
import { HTTP_STATUS } from '../constants/errors.js';

/**
 * Get all users
 * @route GET /api/users
 * @access SUPER_ADMIN only
 */
export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                first_name: true,
                last_name: true,
                role: true,
                isActive: true,
                collegeId: true,
                college: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    }
                },
                createdAt: true,
                updatedAt: true,
            },
        });
        
        if (!users || users.length === 0) {
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                data: [],
                message: 'No users found.'
            });
        }

        // Convert role to roles array for frontend compatibility
        const usersWithRoles = users.map(user => ({
            ...user,
            roles: [user.role]
        }));
        
        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: usersWithRoles,
            count: usersWithRoles.length
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to fetch users. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update user (roles, details)
 * @route PUT /api/users/:id
 * @access SUPER_ADMIN only
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { roles, first_name, last_name, email, username, collegeId, isActive } = req.body;

        // === Input Validation ===
        if (!id || isNaN(parseInt(id))) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Valid user ID is required.',
                field: 'id'
            });
        }

        const userId = parseInt(id);

        // Prevent super admin from deactivating themselves
        if (req.user?.id === userId && isActive === false) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'You cannot deactivate your own account. Contact another admin for this action.'
            });
        }

        // Validate email format if provided
        if (email && email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.toLowerCase())) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'Please enter a valid email address.',
                    field: 'email'
                });
            }
        }

        try {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!existingUser) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    error: 'User not found. Please verify the user ID.'
                });
            }

            // Check for duplicate email or username
            if (email || username) {
                const duplicateCheck = await prisma.user.findFirst({
                    where: {
                        AND: [
                            { id: { not: userId } },
                            {
                                OR: [
                                    email ? { email: email.toLowerCase() } : {},
                                    username ? { username } : {}
                                ]
                            }
                        ]
                    }
                });

                if (duplicateCheck) {
                    if (duplicateCheck.email === email?.toLowerCase()) {
                        return res.status(HTTP_STATUS.CONFLICT).json({
                            success: false,
                            error: 'This email is already in use by another user.',
                            field: 'email'
                        });
                    } else {
                        return res.status(HTTP_STATUS.CONFLICT).json({
                            success: false,
                            error: 'This username is already taken by another user.',
                            field: 'username'
                        });
                    }
                }
            }

            // Check if college exists if collegeId is provided
            if (collegeId) {
                const college = await prisma.college.findUnique({
                    where: { id: parseInt(collegeId) }
                });

                if (!college) {
                    return res.status(HTTP_STATUS.NOT_FOUND).json({
                        success: false,
                        error: 'Selected college not found.',
                        field: 'collegeId'
                    });
                }
            }

            // Convert roles array to single role (take first role)
            const role = roles && roles.length > 0 ? roles[0] : undefined;

            const updateData = {};
            if (role !== undefined) updateData.role = role;
            if (first_name !== undefined) updateData.first_name = first_name?.trim() || '';
            if (last_name !== undefined) updateData.last_name = last_name?.trim() || '';
            if (email !== undefined) updateData.email = email?.toLowerCase().trim();
            if (username !== undefined) updateData.username = username?.trim();
            if (collegeId !== undefined) updateData.collegeId = collegeId ? parseInt(collegeId) : null;
            if (isActive !== undefined) updateData.isActive = isActive;
            
            if (Object.keys(updateData).length === 0) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'No user fields to update.'
                });
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    role: true,
                    isActive: true,
                    collegeId: true,
                    college: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        }
                    },
                    createdAt: true,
                    updatedAt: true,
                },
            });
            
            // Convert role to roles array for frontend compatibility
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'User updated successfully.',
                data: {
                    ...updatedUser,
                    roles: [updatedUser.role]
                }
            });
        } catch (dbError) {
            console.error('Update user database error:', dbError);
            if (dbError.code === 'P2025') {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    error: 'User not found.'
                });
            }
            if (dbError.code === 'P2002') {
                const field = dbError.meta?.target?.[0] || 'unknown';
                return res.status(HTTP_STATUS.CONFLICT).json({
                    success: false,
                    error: `This ${field} is already in use.`,
                    field: field
                });
            }
            throw dbError;
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to update user. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Delete user
 * @route DELETE /api/users/:id
 * @access SUPER_ADMIN only
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // === Input Validation ===
        if (!id || isNaN(parseInt(id))) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Valid user ID is required.',
                field: 'id'
            });
        }

        const userId = parseInt(id);

        // Prevent super admin from deleting themselves
        if (req.user?.id === userId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'You cannot delete your own account. Contact another admin for this action.'
            });
        }

        try {
            // Check if user exists
            const userToDelete = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!userToDelete) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    error: 'User not found. Please verify the user ID.'
                });
            }

            // Delete user
            await prisma.user.delete({
                where: { id: userId },
            });

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'User deleted successfully.',
                data: {
                    id: userId,
                    username: userToDelete.username
                }
            });
        } catch (dbError) {
            console.error('Delete user database error:', dbError);
            if (dbError.code === 'P2025') {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    error: 'User not found.'
                });
            }
            throw dbError;
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to delete user. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
