import prisma from '../prisma.js';
import bcrypt from 'bcryptjs';

// Get all users
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
        
        // Convert role to roles array for frontend compatibility
        const usersWithRoles = users.map(user => ({
            ...user,
            roles: [user.role]
        }));
        
        res.json(usersWithRoles);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Update user (roles, details)
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { roles, first_name, last_name, email, username, collegeId, isActive } = req.body;

    try {
        const userId = parseInt(id);

        // Prevent super admin from deactivating themselves.
        if (req.user?.id === userId && isActive === false) {
            return res.status(400).json({ error: 'You cannot deactivate your own account' });
        }

        // Convert roles array to single role (take first role)
        const role = roles && roles.length > 0 ? roles[0] : undefined;

        const updateData = {};
        if (role !== undefined) updateData.role = role;
        if (first_name !== undefined) updateData.first_name = first_name;
        if (last_name !== undefined) updateData.last_name = last_name;
        if (email !== undefined) updateData.email = email;
        if (username !== undefined) updateData.username = username;
        if (collegeId !== undefined) updateData.collegeId = collegeId;
        if (isActive !== undefined) updateData.isActive = isActive;
        
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
        res.json({
            ...updatedUser,
            roles: [updatedUser.role]
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.user.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
