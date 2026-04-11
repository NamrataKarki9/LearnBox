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
    try {
        const { username, email, password, first_name, last_name, collegeId } = req.body;

        // === Input Validation ===
        // Check required fields
        if (!username || !username.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                error: 'Username is required.',
                field: 'username'
            });
        }

        if (!email || !email.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                error: 'Email address is required.',
                field: 'email'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.toLowerCase())) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Please enter a valid email address.',
                field: 'email'
            });
        }

        if (!password || !password.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Password is required.',
                field: 'password'
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Password must contain at least 8 characters.',
                field: 'password'
            });
        }

        // Check for numbers and special characters
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        if (!hasNumber || !hasSpecialChar) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Password must contain at least one number and one special character.',
                field: 'password'
            });
        }

        if (!collegeId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Please select your college.',
                field: 'collegeId'
            });
        }

        // Normalize inputs
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedUsername = username.trim();

        // === Database Checks ===
        try {
            // Check if user already exists
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: normalizedUsername },
                        { email: normalizedEmail }
                    ],
                },
            });

            if (existingUser) {
                if (existingUser.email === normalizedEmail) {
                    return res.status(HTTP_STATUS.CONFLICT).json({
                        error: 'This email address is already registered. Please login or use a different email.',
                        field: 'email'
                    });
                } else {
                    return res.status(HTTP_STATUS.CONFLICT).json({
                        error: 'This username is already taken. Please choose a different one.',
                        field: 'username'
                    });
                }
            }

            // Verify college exists and is active
            const collegeId_int = parseInt(collegeId);
            if (isNaN(collegeId_int)) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    error: 'Invalid college selection.',
                    field: 'collegeId'
                });
            }

            const college = await prisma.college.findUnique({
                where: { id: collegeId_int }
            });

            if (!college) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    error: 'Selected college not found. Please choose a valid college.',
                    field: 'collegeId'
                });
            }

            if (!college.isActive) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    error: 'The selected college is currently inactive. Contact support for assistance.',
                    field: 'collegeId'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user with STUDENT role and is_verified = false
            const user = await prisma.user.create({
                data: {
                    username: normalizedUsername,
                    email: normalizedEmail,
                    password: hashedPassword,
                    first_name: (first_name || '').trim(),
                    last_name: (last_name || '').trim(),
                    role: ROLES.STUDENT,
                    is_verified: false,
                    collegeId: collegeId_int,
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
                console.warn('Registration successful but OTP email failed:', emailResult.error);
            }

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Registration successful. Please check your email for verification code.',
                requiresVerification: true,
                email: user.email,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    collegeId: user.collegeId,
                    is_verified: user.is_verified
                }
            });
        } catch (dbError) {
            console.error('Registration database error:', dbError);
            // Check for specific Prisma errors
            if (dbError.code === 'P2002') {
                const field = dbError.meta?.target?.[0] || 'unknown';
                return res.status(HTTP_STATUS.CONFLICT).json({
                    error: `A user with this ${field} already exists.`,
                    field: field
                });
            }
            throw dbError;
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Registration failed. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Verify registration OTP
 * @route POST /api/auth/verify-registration-otp
 * @access Public
 */
export const verifyRegistrationOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // === Input Validation ===
        if (!email || !email.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Email address is required.',
                field: 'email'
            });
        }

        if (!otp || !otp.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Verification code is required.',
                field: 'otp'
            });
        }

        // Validate OTP format (should be 6 digits)
        if (!/^\d{6}$/.test(otp.trim())) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Verification code must be 6 digits.',
                field: 'otp'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        try {
            // Verify OTP
            const otpResult = await verifyOTP(normalizedEmail, otp.trim(), 'REGISTER');

            if (!otpResult.valid) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: otpResult.message || 'Invalid or expired verification code. Please try again or request a new code.'
                });
            }

            // Update user as verified
            const user = await prisma.user.update({
                where: { email: normalizedEmail },
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
                success: true,
                message: 'Email verified successfully. You are now logged in.',
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
        } catch (dbError) {
            console.error('OTP verification database error:', dbError);
            if (dbError.code === 'P2025') {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    error: 'User not found. Please register again.'
                });
            }
            throw dbError;
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Verification failed. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Create COLLEGE_ADMIN - SUPER_ADMIN only
 * @route POST /api/auth/admin/create-college-admin
 * @access SUPER_ADMIN only
 */
/**
 * Create COLLEGE_ADMIN - SUPER_ADMIN only
 * @route POST /api/auth/admin/create-college-admin
 * @access SUPER_ADMIN only
 */
export const createCollegeAdmin = async (req, res) => {
    try {
        const { username, email, password, first_name, last_name, collegeId } = req.body;

        // === Input Validation ===
        if (!username || !username.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Username is required.',
                field: 'username'
            });
        }

        if (!email || !email.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Email address is required.',
                field: 'email'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.toLowerCase())) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Please enter a valid email address.',
                field: 'email'
            });
        }

        if (!password || !password.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Password is required.',
                field: 'password'
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Password must contain at least 8 characters.',
                field: 'password'
            });
        }

        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        if (!hasNumber || !hasSpecialChar) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Password must contain at least one number and one special character.',
                field: 'password'
            });
        }

        if (!collegeId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'College ID is required.',
                field: 'collegeId'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        try {
            // Check if user already exists
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: username.trim() },
                        { email: normalizedEmail }
                    ],
                },
            });

            if (existingUser) {
                if (existingUser.email === normalizedEmail) {
                    return res.status(HTTP_STATUS.CONFLICT).json({
                        success: false,
                        error: 'This email address is already in use.',
                        field: 'email'
                    });
                } else {
                    return res.status(HTTP_STATUS.CONFLICT).json({
                        success: false,
                        error: 'This username is already taken.',
                        field: 'username'
                    });
                }
            }

            // Verify college exists and is active
            const collegeId_int = parseInt(collegeId);
            if (isNaN(collegeId_int)) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'Invalid college ID.',
                    field: 'collegeId'
                });
            }

            const college = await prisma.college.findUnique({
                where: { id: collegeId_int }
            });

            if (!college) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    error: 'Selected college not found.',
                    field: 'collegeId'
                });
            }

            if (!college.isActive) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'The selected college is currently inactive.',
                    field: 'collegeId'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create COLLEGE_ADMIN user (admins are pre-verified)
            const user = await prisma.user.create({
                data: {
                    username: username.trim(),
                    email: normalizedEmail,
                    password: hashedPassword,
                    first_name: (first_name || '').trim(),
                    last_name: (last_name || '').trim(),
                    role: ROLES.COLLEGE_ADMIN,
                    is_verified: true,
                    collegeId: collegeId_int,
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
                success: true,
                message: 'College admin created successfully.',
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
        } catch (dbError) {
            console.error('Create college admin database error:', dbError);
            if (dbError.code === 'P2002') {
                const field = dbError.meta?.target?.[0] || 'unknown';
                return res.status(HTTP_STATUS.CONFLICT).json({
                    success: false,
                    error: `A user with this ${field} already exists.`,
                    field: field
                });
            }
            throw dbError;
        }
    } catch (error) {
        console.error('Create college admin error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to create college admin. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Login
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // === Input Validation ===
        if (!email || !email.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                success: false,
                error: 'Email address is required.',
                field: 'email'
            });
        }

        if (!password) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Password is required.',
                field: 'password'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        try {
            const user = await prisma.user.findUnique({ 
                where: { email: normalizedEmail },
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
                    success: false,
                    error: 'No account found with this email. Please register to create a new account or check if you used a different email.',
                    needsRegistration: true
                });
            }

            // Check if account is deactivated
            if (user.isActive === false) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    error: 'Your account has been terminated by the system administrator. Please contact support if you believe this is an error.'
                });
            }

            // Check if email is verified
            if (!user.is_verified) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    error: 'Please verify your email before logging in.',
                    requiresVerification: true,
                    email: user.email
                });
            }

            // Check if user's college is active
            if (user.collegeId && (!user.college || !user.college.isActive)) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    error: 'Your college is currently inactive. Please contact your college administrator.'
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
                    success: false,
                    error: 'Incorrect password or email. Please try again.'
                });
            }

            // Generate tokens
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);

            return res.status(HTTP_STATUS.OK).json({
                success: true,
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
                    phone: user.phone,
                    avatar: user.avatar,
                    role: user.role,
                    collegeId: user.collegeId,
                    college: user.college
                },
            });
        } catch (dbError) {
            console.error('Login database error:', dbError);
            throw dbError;
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
            success: false,
            error: 'Login failed. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Refresh access token
 * @route POST /api/auth/token/refresh
 * @access Public (with valid refresh token)
 */
export const refresh = async (req, res) => {
    try {
        const { refresh: token } = req.body;

        if (!token || !token.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Refresh token is required.'
            });
        }

        try {
            const decoded = verifyRefreshToken(token.trim());
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
                    success: false,
                    error: 'User not found. Please log in again.'
                });
            }

            if (!user.isActive) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    error: 'Your account has been deactivated. Please contact support.'
                });
            }

            const accessToken = generateAccessToken(user);

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                access: accessToken,
            });
        } catch (tokenError) {
            console.error('Token verification error:', tokenError);
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                error: 'Refresh token is invalid or expired. Please log in again.'
            });
        }
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to refresh token. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
                phone: true,
                bio: true,
                avatar: true,
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

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                error: 'User not found. Please log in again.'
            });
        }

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get me error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to fetch user data. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Forgot password - Send OTP
 * @route POST /api/auth/forgot-password
 * @access Public
 */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // === Input Validation ===
        if (!email || !email.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Email address is required.',
                field: 'email'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.toLowerCase())) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Please enter a valid email address.',
                field: 'email'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        try {
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { email: normalizedEmail }
            });

            // For security, always return the same message whether account exists or not
            // This prevents user enumeration attacks
            if (!user) {
                return res.status(HTTP_STATUS.OK).json({
                    success: true,
                    message: 'If an account with that email exists, a password reset code has been sent to it.'
                });
            }

            // Generate and send OTP
            const otp = await createOTP(user.email, 'FORGOT_PASSWORD');
            const emailResult = await sendPasswordResetOTP(user.email, otp, user.username);

            if (!emailResult.success) {
                console.error('Failed to send password reset email:', emailResult.error);
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    error: 'Failed to send password reset email. Please try again.'
                });
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'If an account with that email exists, a password reset code has been sent to it.',
                email: user.email
            });
        } catch (dbError) {
            console.error('Forgot password database error:', dbError);
            throw dbError;
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to process password reset request. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Reset password using OTP
 * @route POST /api/auth/reset-password
 * @access Public
 */
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // === Input Validation ===
        if (!email || !email.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Email address is required.',
                field: 'email'
            });
        }

        if (!otp || !otp.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Verification code is required.',
                field: 'otp'
            });
        }

        if (!newPassword) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'New password is required.',
                field: 'newPassword'
            });
        }

        // Validate new password strength
        if (newPassword.length < 8) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Password must contain at least 8 characters.',
                field: 'newPassword'
            });
        }

        const hasNumber = /\d/.test(newPassword);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
        
        if (!hasNumber || !hasSpecialChar) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Password must contain at least one number and one special character.',
                field: 'newPassword'
            });
        }

        // Validate OTP format
        if (!/^\d{6}$/.test(otp.trim())) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Verification code must be 6 digits.',
                field: 'otp'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        try {
            // Verify OTP
            const otpResult = await verifyOTP(normalizedEmail, otp.trim(), 'FORGOT_PASSWORD');

            if (!otpResult.valid) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: otpResult.message || 'Invalid or expired verification code. Please try again.'
                });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            await prisma.user.update({
                where: { email: normalizedEmail },
                data: { password: hashedPassword }
            });

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Password reset successful. You can now log in with your new password.'
            });
        } catch (dbError) {
            console.error('Reset password database error:', dbError);
            if (dbError.code === 'P2025') {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    error: 'User not found. Please try registering instead.'
                });
            }
            throw dbError;
        }
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Password reset failed. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Resend OTP
 * @route POST /api/auth/resend-otp
 * @access Public
 */
export const resendOTP = async (req, res) => {
    try {
        const { email, purpose } = req.body;

        // === Input Validation ===
        if (!email || !email.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Email address is required.',
                field: 'email'
            });
        }

        if (!purpose || !purpose.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'OTP purpose is required.',
                field: 'purpose'
            });
        }

        if (!['REGISTER', 'FORGOT_PASSWORD'].includes(purpose.toUpperCase())) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Invalid OTP purpose. Must be REGISTER or FORGOT_PASSWORD.',
                field: 'purpose'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        try {
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { email: normalizedEmail }
            });

            if (!user) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    error: 'User not found. Please check your email and try again.'
                });
            }

            // For registration, check if already verified
            if (purpose.toUpperCase() === 'REGISTER' && user.is_verified) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'This email is already verified. You can log in directly.'
                });
            }

            // Generate and send new OTP
            const otp = await createOTP(user.email, purpose.toUpperCase());
            
            let emailResult;
            if (purpose.toUpperCase() === 'REGISTER') {
                emailResult = await sendRegistrationOTP(user.email, otp, user.username);
            } else {
                emailResult = await sendPasswordResetOTP(user.email, otp, user.username);
            }

            if (!emailResult.success) {
                console.error('Failed to send OTP:', emailResult.error);
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    error: 'Failed to send OTP. Please try again.'
                });
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Verification code has been sent to your email. Please check your inbox.',
                email: user.email
            });
        } catch (dbError) {
            console.error('Resend OTP database error:', dbError);
            throw dbError;
        }
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to resend verification code. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private (authenticated user)
 */
export const updateProfile = async (req, res) => {
    try {
        const { username, email, first_name, last_name, phone, bio, avatar } = req.body;
        const userId = req.user.id;

        // DEBUG LOG
        console.log('=== UPDATE PROFILE REQUEST ===');
        console.log('userId:', userId);
        console.log('Body received:', { username, email, first_name, last_name, phone, bio, avatar: avatar ? `[base64 string, length: ${avatar.length}]` : avatar });

        // === Input Validation ===
        // Validate email format if provided
        if (email && email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.toLowerCase())) {
                console.log('Email validation failed:', email);
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'Please enter a valid email address.',
                    field: 'email'
                });
            }
        }

        // Validate username if provided
        if (username && !username.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Username cannot be empty.',
                field: 'username'
            });
        }

        try {
            // Check if username or email is being changed to one that already exists
            if (username || email) {
                console.log('Checking for duplicate username/email...');
                const existingUser = await prisma.user.findFirst({
                    where: {
                        AND: [
                            {
                                id: { not: userId }
                            },
                            {
                                OR: [
                                    username ? { username } : {},
                                    email ? { email: email.toLowerCase() } : {}
                                ]
                            }
                        ]
                    }
                });

                if (existingUser) {
                    console.log('Existing user found:', existingUser.username);
                    if (existingUser.username === username) {
                        return res.status(HTTP_STATUS.CONFLICT).json({
                            success: false,
                            error: 'This username is already taken. Please choose another one.',
                            field: 'username'
                        });
                    } else {
                        return res.status(HTTP_STATUS.CONFLICT).json({
                            success: false,
                            error: 'This email is already in use. Please use another email address.',
                            field: 'email'
                        });
                    }
                }
                console.log('No duplicate found, proceeding...');
            }

            // Build update data object - only include provided fields
            const updateData = {};
            if (username !== undefined && username !== null && username.trim()) updateData.username = username.trim();
            if (email !== undefined && email !== null && email.trim()) updateData.email = email.toLowerCase().trim();
            
            // For optional string fields, handle them carefully
            if (first_name !== undefined && first_name !== null) {
              const trimmedFirstName = String(first_name).trim();
              updateData.first_name = trimmedFirstName || null;
            }
            if (last_name !== undefined && last_name !== null) {
              const trimmedLastName = String(last_name).trim();
              updateData.last_name = trimmedLastName || null;
            }
            if (phone !== undefined && phone !== null) {
              const trimmedPhone = String(phone).trim();
              updateData.phone = trimmedPhone || null;
            }
            if (bio !== undefined && bio !== null) {
              const trimmedBio = String(bio).trim();
              updateData.bio = trimmedBio || null;
            }
            
            // Handle avatar - either new base64 image or null to remove
            if (avatar !== undefined && avatar !== null) {
              const avatarStr = String(avatar).trim();
              // Check avatar size (max 5MB for base64 encoded image)
              // Base64 encodes at ~33% larger, so 5MB file = ~6.7MB base64
              if (avatarStr && avatarStr.length > 5 * 1024 * 1024) {
                console.log('Avatar too large:', avatarStr.length, 'bytes');
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                  success: false,
                  error: 'Avatar image is too large. Maximum size is 5MB.',
                  field: 'avatar'
                });
              }
              updateData.avatar = avatarStr || null;
            }

            console.log('Update data prepared:', { 
              ...updateData,
              avatar: updateData.avatar ? `[base64 image, size: ${updateData.avatar.length} bytes]` : updateData.avatar 
            });

            // If no fields to update, return early
            if (Object.keys(updateData).length === 0) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'No profile fields to update.'
                });
            }

            // Update user
            console.log('Attempting Prisma update for userId:', userId);
            console.log('Update data being sent:', updateData);
            
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    phone: true,
                    bio: true,
                    avatar: true,
                    role: true,
                    collegeId: true,
                    college: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    },
                    createdAt: true,
                    is_verified: true
                }
            });

            console.log('Prisma update successful, returning user:', updatedUser.id);
            
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Profile updated successfully.',
                user: updatedUser
            });
        } catch (dbError) {
            console.error('Update profile database error:', dbError);
            console.error('Error code:', dbError.code);
            console.error('Error meta:', dbError.meta);
            console.error('Error message:', dbError.message);
            
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
        console.error('=== UPDATE PROFILE FINAL ERROR ===');
        console.error('Error:', error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to update profile. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get user settings
 * @route GET /api/auth/settings
 * @access Private (authenticated user)
 */
export const getUserSettings = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                notificationSettings: true,
                preferences: true
            }
        });

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                error: 'User not found. Please log in again.'
            });
        }

        const defaultNotifications = {
            emailNotifications: true,
            collegeUpdates: true,
            userRegistrations: true,
            systemAnnouncements: true,
            weeklyReport: false
        };

        const defaultPreferences = {
            theme: 'system',
            language: 'en'
        };

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                notifications: {
                    ...defaultNotifications,
                    ...(user.notificationSettings || {})
                },
                preferences: {
                    ...defaultPreferences,
                    ...(user.preferences || {})
                }
            }
        });
    } catch (error) {
        console.error('Get user settings error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to fetch settings. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update notification settings
 * @route PUT /api/auth/settings/notifications
 * @access Private (authenticated user)
 */
export const updateNotificationSettings = async (req, res) => {
    try {
        const settings = req.body;

        if (!settings || Object.keys(settings).length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'No notification settings provided to update.'
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                notificationSettings: settings
            },
            select: {
                id: true
            }
        });

        if (!updatedUser) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                error: 'User not found. Please log in again.'
            });
        }

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Notification settings updated successfully.',
            data: settings
        });
    } catch (error) {
        console.error('Update notification settings error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to update notification settings. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update preferences settings
 * @route PUT /api/auth/settings/preferences
 * @access Private (authenticated user)
 */
export const updatePreferences = async (req, res) => {
    try {
        const settings = req.body;

        if (!settings || Object.keys(settings).length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'No preference settings provided to update.'
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                preferences: settings
            },
            select: {
                id: true
            }
        });

        if (!updatedUser) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                error: 'User not found. Please log in again.'
            });
        }

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Preferences updated successfully.',
            data: settings
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to update preferences. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Verify user's current password (without changing it)
 * @route POST /api/auth/verify-password
 * @access Private (authenticated user)
 */
export const verifyPassword = async (req, res) => {
    try {
        const { currentPassword } = req.body;
        const userId = req.user.id;

        // === Input Validation ===
        if (!currentPassword) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Current password is required.',
                field: 'currentPassword'
            });
        }

        try {
            // Get user with password
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    password: true
                }
            });

            if (!user) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    error: 'User not found.'
                });
            }

            // Verify current password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    error: 'Invalid current password.'
                });
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Password verified successfully.'
            });
        } catch (dbError) {
            console.error('Verify password database error:', dbError);
            throw dbError;
        }
    } catch (error) {
        console.error('Verify password error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Password verification failed. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Change user password
 * @route PUT /api/auth/change-password
 * @access Private (authenticated user)
 */
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // === Input Validation ===
        if (!currentPassword) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Current password is required.',
                field: 'currentPassword'
            });
        }

        if (!newPassword) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'New password is required.',
                field: 'newPassword'
            });
        }

        if (currentPassword === newPassword) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'New password must be different from your current password.',
                field: 'newPassword'
            });
        }

        // Validate new password strength
        if (newPassword.length < 8) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'New password must contain at least 8 characters.',
                field: 'newPassword'
            });
        }

        const hasNumber = /\d/.test(newPassword);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
        
        if (!hasNumber || !hasSpecialChar) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'New password must contain at least one number and one special character.',
                field: 'newPassword'
            });
        }

        try {
            // Get user with password
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    password: true
                }
            });

            if (!user) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    error: 'User not found.'
                });
            }

            // Verify current password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    error: 'Current password is incorrect. Please try again.'
                });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword }
            });

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Password changed successfully. Please log in again with your new password.'
            });
        } catch (dbError) {
            console.error('Change password database error:', dbError);
            throw dbError;
        }
    } catch (error) {
        console.error('Change password error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Password change failed. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
