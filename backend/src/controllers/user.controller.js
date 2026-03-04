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
                collegeId: true,
                college: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    }
                },
                createdAt: true,
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
    const { roles, first_name, last_name, email, username } = req.body;

    try {
        // Convert roles array to single role (take first role)
        const role = roles && roles.length > 0 ? roles[0] : undefined;
        
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                role: role || undefined,
                first_name: first_name || undefined,
                last_name: last_name || undefined,
                email: email || undefined,
                username: username || undefined,
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
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
