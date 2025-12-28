/**
 * Email Service
 * Handles sending emails using Nodemailer
 */

import nodemailer from 'nodemailer';

// Create transporter using SMTP credentials from environment
const createTransporter = () => {
    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️  SMTP not configured. Emails will not be sent. Check EMAIL-SETUP-REQUIRED.md');
        return null;
    }
    
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

/**
 * Send registration OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} username - User's username
 */
export const sendRegistrationOTP = async (email, otp, username) => {
    try {
        const transporter = createTransporter();
        
        // If SMTP not configured, return success but log warning
        if (!transporter) {
            console.warn(`⚠️  Email not sent to ${email}. SMTP not configured.`);
            console.log(`🔑 Use this OTP for ${email}: ${otp}`);
            return { success: true, warning: 'SMTP not configured' };
        }

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'LearnBox'}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Verify Your LearnBox Registration',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                        .otp-box { background-color: white; border: 2px solid #4F46E5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; }
                        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to LearnBox</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${username},</h2>
                            <p>Thank you for registering with LearnBox! To complete your registration, please verify your email address using the OTP below:</p>
                            
                            <div class="otp-box">
                                <p style="margin: 0; color: #6b7280;">Your verification code:</p>
                                <div class="otp-code">${otp}</div>
                            </div>
                            
                            <p><strong>This OTP will expire in 10 minutes.</strong></p>
                            
                            <p>If you didn't request this registration, please ignore this email.</p>
                            
                            <p>Best regards,<br>The LearnBox Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 LearnBox. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Registration OTP email sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error('Error sending registration OTP email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send forgot password OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} username - User's username
 */
export const sendPasswordResetOTP = async (email, otp, username) => {
    try {
        const transporter = createTransporter();
        
        // If SMTP not configured, return success but log warning
        if (!transporter) {
            console.warn(`⚠️  Email not sent to ${email}. SMTP not configured.`);
            console.log(`🔑 Use this OTP for ${email}: ${otp}`);
            return { success: true, warning: 'SMTP not configured' };
        }

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'LearnBox'}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Reset Your LearnBox Password',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                        .otp-box { background-color: white; border: 2px solid #DC2626; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #DC2626; letter-spacing: 5px; }
                        .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 15px 0; }
                        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Password Reset Request</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${username},</h2>
                            <p>We received a request to reset your LearnBox password. Use the OTP below to proceed with resetting your password:</p>
                            
                            <div class="otp-box">
                                <p style="margin: 0; color: #6b7280;">Your password reset code:</p>
                                <div class="otp-code">${otp}</div>
                            </div>
                            
                            <p><strong>This OTP will expire in 10 minutes.</strong></p>
                            
                            <div class="warning">
                                <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
                            </div>
                            
                            <p>Best regards,<br>The LearnBox Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 LearnBox. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset OTP email sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error('Error sending password reset OTP email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Test email configuration
 * @returns {Promise<boolean>} True if configuration is valid
 */
export const testEmailConfig = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ Email server is ready to send messages');
        return true;
    } catch (error) {
        console.error('❌ Email configuration error:', error.message);
        return false;
    }
};
