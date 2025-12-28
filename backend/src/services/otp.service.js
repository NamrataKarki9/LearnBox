/**
 * OTP Service
 * Handles OTP generation, validation, and cleanup
 */

import prisma from '../prisma.js';
import crypto from 'crypto';

const OTP_EXPIRY_MINUTES = 10;

/**
 * Generate a secure 6-digit OTP
 * @returns {string} 6-digit numeric OTP
 */
export const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

/**
 * Create and store OTP for email verification
 * @param {string} email - User's email
 * @param {string} purpose - OTP purpose (REGISTER, FORGOT_PASSWORD)
 * @returns {Promise<string>} Generated OTP
 */
export const createOTP = async (email, purpose) => {
    try {
        // Delete any existing OTPs for this email and purpose
        await prisma.emailOTP.deleteMany({
            where: {
                email: email.toLowerCase(),
                purpose
            }
        });

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Store OTP in database
        await prisma.emailOTP.create({
            data: {
                email: email.toLowerCase(),
                otp,
                purpose,
                expiresAt
            }
        });

        // Log OTP for development (remove in production)
        console.log(`🔑 OTP for ${email} (${purpose}): ${otp}`);

        return otp;
    } catch (error) {
        console.error('Error creating OTP:', error);
        throw new Error('Failed to generate OTP');
    }
};

/**
 * Verify OTP for given email and purpose
 * @param {string} email - User's email
 * @param {string} otp - OTP to verify
 * @param {string} purpose - OTP purpose
 * @returns {Promise<{valid: boolean, message: string}>}
 */
export const verifyOTP = async (email, otp, purpose) => {
    try {
        const otpRecord = await prisma.emailOTP.findFirst({
            where: {
                email: email.toLowerCase(),
                otp,
                purpose
            }
        });

        if (!otpRecord) {
            return { valid: false, message: 'Invalid OTP' };
        }

        // Check if OTP has expired
        if (new Date() > otpRecord.expiresAt) {
            // Delete expired OTP
            await prisma.emailOTP.delete({
                where: { id: otpRecord.id }
            });
            return { valid: false, message: 'OTP has expired' };
        }

        // OTP is valid - delete it (one-time use)
        await prisma.emailOTP.delete({
            where: { id: otpRecord.id }
        });

        return { valid: true, message: 'OTP verified successfully' };
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return { valid: false, message: 'Error verifying OTP' };
    }
};

/**
 * Delete OTP for given email and purpose
 * @param {string} email - User's email
 * @param {string} purpose - OTP purpose
 */
export const deleteOTP = async (email, purpose) => {
    try {
        await prisma.emailOTP.deleteMany({
            where: {
                email: email.toLowerCase(),
                purpose
            }
        });
    } catch (error) {
        console.error('Error deleting OTP:', error);
    }
};

/**
 * Clean up expired OTPs (can be run periodically)
 * @returns {Promise<number>} Number of deleted records
 */
export const cleanupExpiredOTPs = async () => {
    try {
        const result = await prisma.emailOTP.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });
        return result.count;
    } catch (error) {
        console.error('Error cleaning up expired OTPs:', error);
        return 0;
    }
};
