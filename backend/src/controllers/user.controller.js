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
                roles: true,
                createdAt: true,
            },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Update user (roles, details)
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { roles, first_name, last_name, email, username } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                roles: roles || undefined,
                first_name: first_name || undefined,
                last_name: last_name || undefined,
                email: email || undefined,
                username: username || undefined,
            },
            select: {
                id: true,
                username: true,
                email: true,
                roles: true,
            },
        });
        res.json(updatedUser);
    } catch (error) {
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
