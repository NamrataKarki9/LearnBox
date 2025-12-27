import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret-placeholder';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret-placeholder';

export const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.id, username: user.username, roles: user.roles },
        ACCESS_TOKEN_SECRET,
        { expiresIn: '1d' }
    );
};

export const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user.id },
        REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
};
