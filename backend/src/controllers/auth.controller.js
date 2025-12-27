import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.utils.js';

export const register = async (req, res) => {
    const { username, email, password, first_name, last_name, roles } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Validate roles if provided
    const validRoles = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'STUDENT'];
    let userRoles = ['STUDENT']; // Default role

    if (roles && Array.isArray(roles) && roles.length > 0) {
        const invalidRoles = roles.filter(role => !validRoles.includes(role));
        if (invalidRoles.length > 0) {
            return res.status(400).json({ error: `Invalid roles: ${invalidRoles.join(', ')}` });
        }
        userRoles = roles;
    }

    try {
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }],
            },
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User with this username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                first_name: first_name || '',
                last_name: last_name || '',
                roles: userRoles,
            },
        });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        return res.status(201).json({
            message: 'Registration successful!',
            tokens: {
                refresh: refreshToken,
                access: accessToken,
            },
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                roles: user.roles,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        return res.status(200).json({
            message: 'Login successful!',
            tokens: {
                refresh: refreshToken,
                access: accessToken,
            },
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                roles: user.roles,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const refresh = async (req, res) => {
    const { refresh: token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Refresh token required' });
    }

    try {
        const decoded = verifyRefreshToken(token);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const accessToken = generateAccessToken(user);

        return res.status(200).json({
            access: accessToken,
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
};

export const getMe = async (req, res) => {
    return res.status(200).json(req.user);
};
