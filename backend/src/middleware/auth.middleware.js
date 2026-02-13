import { verifyAccessToken } from '../utils/token.utils.js';
import prisma from '../prisma.js';
import { ERROR_MESSAGES, HTTP_STATUS } from '../constants/errors.js';

/**
 * Authentication middleware - Verifies JWT token and attaches user to request
 */
export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
            error: ERROR_MESSAGES.UNAUTHORIZED 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyAccessToken(token);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                email: true,
                first_name: true,
                last_name: true,
                role: true,
                collegeId: true,
            },
        });

        if (!user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
                error: ERROR_MESSAGES.USER_NOT_FOUND 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        // Fallback if constants are undefined
        const status = (HTTP_STATUS && HTTP_STATUS.UNAUTHORIZED) || 401;
        const msg = (ERROR_MESSAGES && ERROR_MESSAGES.INVALID_TOKEN) || 'Invalid token';
        
        return res.status(status).json({ 
            error: msg
        });
    }
};

/**
 * Optional authentication middleware - Attaches user if token exists, but doesn't fail
 */
export const optionalAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyAccessToken(token);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                email: true,
                first_name: true,
                last_name: true,
                role: true,
                collegeId: true,
            },
        });

        if (user) {
            req.user = user;
        }
    } catch (error) {
        // Silently fail for optional auth
        console.debug('Optional auth failed:', error.message);
    }
    
    next();
};
