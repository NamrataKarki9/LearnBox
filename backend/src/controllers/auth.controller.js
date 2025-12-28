import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.utils.js';
import { ROLES } from '../constants/roles.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/errors.js';
import { createOTP, verifyOTP, deleteOTP } from '../services/otp.service.js';
import { sendRegistrationOTP, sendPasswordResetOTP } from '../services/email.service.js';

/**
 * Public registration - STUDENT role only (Modified: Now sends OTP instead of creating user immediately)
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req, res) => {
    const { username, email, password, first_name, last_name, collegeId } = req.body;

    // Validate required fields
    if (!username || !email || !password || !collegeId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
            error: 'Username, email, password, and college are required' 
        });
    }

    // Security: Ignore any role input from frontend - always STUDENT
    const userRole = ROLES.STUDENT;

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ username }, { email: email.toLowerCase() }],
            },
        });

        if (existingUser) {
            return res.status(HTTP_STATUS.CONFLICT).json({ 
                error: ERROR_MESSAGES.USER_ALREADY_EXISTS 
            });
        }

        // Verify college exists and is active
        const college = await prisma.college.findUnique({
            where: { id: parseInt(collegeId) }
        });

        if (!college || !college.isActive) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: ERROR_MESSAGES.INVALID_COLLEGE
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with STUDENT role and is_verified = false
        const user = await prisma.user.create({
            data: {
                username,
                email: email.toLowerCase(),
                password: hashedPassword,
                first_name: first_name || '',
                last_name: last_name || '',
                role: userRole,
                is_verified: false, // NEW: User not verified yet
                collegeId: parseInt(collegeId),
            },
            select: {
                id: true,
                username: true,
                email: true,
                first_name: true,
                last_name: true,
                role: true,
                is_verified: true,
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

        // Generate and send OTP
        const otp = await createOTP(user.email, 'REGISTER');
        const emailResult = await sendRegistrationOTP(user.email, otp, user.username);

        if (!emailResult.success) {
            // If email fails, still return success but warn
            console.warn('Registration successful but email failed:', emailResult.error);
        }

        res.status(HTTP_STATUS.CREATED).json({
            message: 'Registration successful. Please check your email for verification code.',
            requiresVerification: true,
            email: user.email,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_verified: user.is_verified
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message,
        });
    }
};

/**
 * Verify registration OTP
 * @route POST /api/auth/verify-registration-otp
 * @access Public
 */
export const verifyRegistrationOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Email and OTP are required'
        });
    }

    try {
        // Verify OTP
        const otpResult = await verifyOTP(email.toLowerCase(), otp, 'REGISTER');

        if (!otpResult.valid) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: otpResult.message
            });
        }

        // Update user as verified
        const user = await prisma.user.update({
            where: { email: email.toLowerCase() },
            data: { is_verified: true },
            select: {
                id: true,
                username: true,
                email: true,
                first_name: true,
                last_name: true,
                role: true,
                is_verified: true,
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

        // Generate tokens for auto-login
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.status(HTTP_STATUS.OK).json({
            message: 'Email verified successfully',
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
                role: user.role,
                is_verified: user.is_verified,
                collegeId: user.collegeId,
                college: user.college
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};

/**
 * Create COLLEGE_ADMIN - SUPER_ADMIN only
 * @route POST /api/auth/admin/create-college-admin
 * @access SUPER_ADMIN only
 */
export const createCollegeAdmin = async (req, res) => {
    const { username, email, password, first_name, last_name, collegeId } = req.body;

    // Validate required fields
    if (!username || !email || !password || !collegeId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
            error: 'Username, email, password, and collegeId are required' 
        });
    }

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }],
            },
        });

        if (existingUser) {
            return res.status(HTTP_STATUS.CONFLICT).json({ 
                error: ERROR_MESSAGES.USER_ALREADY_EXISTS 
            });
        }

        // Verify college exists and is active
        const college = await prisma.college.findUnique({
            where: { id: parseInt(collegeId) }
        });

        if (!college || !college.isActive) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: ERROR_MESSAGES.INVALID_COLLEGE
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create COLLEGE_ADMIN user (admins are pre-verified)
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                first_name: first_name || '',
                last_name: last_name || '',
                role: ROLES.COLLEGE_ADMIN,
                is_verified: true, // Admins are pre-verified
                collegeId: parseInt(collegeId),
            },
            select: {
                id: true,
                username: true,
                email: true,
                first_name: true,
                last_name: true,
                role: true,
                is_verified: true,
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

        return res.status(HTTP_STATUS.CREATED).json({
            message: 'College admin created successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                collegeId: user.collegeId,
                college: user.college
            },
        });
    } catch (error) {
        console.error('Create college admin error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
            error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR 
        });
    }
};

/**
 * Login
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
            error: 'Email and password are required' 
        });
    }

    try {
        const user = await prisma.user.findUnique({ 
            where: { email },
            include: {
                college: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        isActive: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
                error: ERROR_MESSAGES.INVALID_CREDENTIALS 
            });
        }

        // NEW: Check if email is verified
        if (!user.is_verified) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                error: 'Please verify your email before logging in',
                requiresVerification: true,
                email: user.email
            });
        }

        // Check if user's college is active (if they have one)
        if (user.collegeId && (!user.college || !user.college.isActive)) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                error: 'Your college is currently inactive. Please contact support.'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
                error: ERROR_MESSAGES.INVALID_CREDENTIALS 
            });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        return res.status(HTTP_STATUS.OK).json({
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
                role: user.role,
                collegeId: user.collegeId,
                college: user.college
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
            error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR 
        });
    }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh
 * @access Public (with valid refresh token)
 */
export const refresh = async (req, res) => {
    const { refresh: token } = req.body;

    if (!token) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
            error: 'Refresh token required' 
        });
    }

    try {
        const decoded = verifyRefreshToken(token);
        const user = await prisma.user.findUnique({ 
            where: { id: decoded.userId },
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

        if (!user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
                error: ERROR_MESSAGES.INVALID_TOKEN 
            });
        }

        const accessToken = generateAccessToken(user);

        return res.status(HTTP_STATUS.OK).json({
            access: accessToken,
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
            error: ERROR_MESSAGES.TOKEN_EXPIRED 
        });
    }
};

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
export const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
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
                },
                createdAt: true
            }
        });

        return res.status(HTTP_STATUS.OK).json(user);
    } catch (error) {
        console.error('Get me error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
            error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR 
        });
    }
};

/**
 * Forgot password - Send OTP
 * @route POST /api/auth/forgot-password
 * @access Public
 */
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Email is required'
        });
    }

    try {
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        // For security, don't reveal if email exists or not
        // Always return success message
        if (!user) {
            return res.status(HTTP_STATUS.OK).json({
                message: 'If an account with that email exists, a password reset code has been sent.'
            });
        }

        // Generate and send OTP
        const otp = await createOTP(user.email, 'FORGOT_PASSWORD');
        const emailResult = await sendPasswordResetOTP(user.email, otp, user.username);

        if (!emailResult.success) {
            console.error('Failed to send password reset email:', emailResult.error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to send password reset email. Please try again.'
            });
        }

        res.status(HTTP_STATUS.OK).json({
            message: 'If an account with that email exists, a password reset code has been sent.',
            email: user.email
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
        });
    }
};

/**
 * Reset password using OTP
 * @route POST /api/auth/reset-password
 * @access Public
 */
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Email, OTP, and new password are required'
        });
    }

    // Validate password strength
    if (newPassword.length < 6) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Password must be at least 6 characters long'
        });
    }

    try {
        // Verify OTP
        const otpResult = await verifyOTP(email.toLowerCase(), otp, 'FORGOT_PASSWORD');

        if (!otpResult.valid) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: otpResult.message
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { email: email.toLowerCase() },
            data: { password: hashedPassword }
        });

        res.status(HTTP_STATUS.OK).json({
            message: 'Password reset successful. You can now login with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
        });
    }
};

/**
 * Resend OTP
 * @route POST /api/auth/resend-otp
 * @access Public
 */
export const resendOTP = async (req, res) => {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Email and purpose are required'
        });
    }

    if (!['REGISTER', 'FORGOT_PASSWORD'].includes(purpose)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Invalid OTP purpose'
        });
    }

    try {
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'User not found'
            });
        }

        // For registration, check if already verified
        if (purpose === 'REGISTER' && user.is_verified) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Email is already verified'
            });
        }

        // Generate and send new OTP
        const otp = await createOTP(user.email, purpose);
        
        let emailResult;
        if (purpose === 'REGISTER') {
            emailResult = await sendRegistrationOTP(user.email, otp, user.username);
        } else {
            emailResult = await sendPasswordResetOTP(user.email, otp, user.username);
        }

        if (!emailResult.success) {
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to send OTP. Please try again.'
            });
        }

        res.status(HTTP_STATUS.OK).json({
            message: 'OTP has been resent to your email',
            email: user.email
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
        });
    }
};
