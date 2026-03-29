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
 * Send college admin invitation email
 * @param {string} email - Recipient email
 * @param {string} inviteeName - Name of invited person
 * @param {string} collegeName - Name of college
 * @param {string} inviteToken - Secure invitation token
 * @param {string} superAdminName - Name of super admin sending invite
 */
export const sendCollegeAdminInvitation = async (email, inviteeName, collegeName, inviteToken, superAdminName) => {
    try {
        const transporter = createTransporter();
        
        // If SMTP not configured, return success but log warning
        if (!transporter) {
            console.warn(`⚠️  Email not sent to ${email}. SMTP not configured.`);
            console.log(`🔗 Use this invite link for ${email}: http://localhost:5173/invitation/accept?token=${inviteToken}`);
            return { success: true, warning: 'SMTP not configured' };
        }

        // Build registration link - use environment or default
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const acceptLink = `${baseUrl}/invitation/accept?token=${inviteToken}`;
        console.log('📧 Generated registration link:', acceptLink);
        console.log('📧 Token in link:', inviteToken?.substring(0, 16) + '...');

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'LearnBox'}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `LearnBox College Admin Invitation - ${collegeName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #7C9E9E; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                        .invite-box { background-color: white; border: 2px solid #7C9E9E; border-radius: 8px; padding: 20px; margin: 20px 0; }
                        .cta-button { 
                            display: inline-block;
                            background-color: #7C9E9E;
                            color: white;
                            padding: 12px 30px;
                            text-decoration: none;
                            border-radius: 6px;
                            font-weight: bold;
                            margin: 20px 0;
                        }
                        .cta-button:hover { background-color: #6B8D8D; }
                        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
                        .info-item { background: white; padding: 10px; border-left: 3px solid #7C9E9E; }
                        .info-label { font-size: 12px; color: #6b7280; font-weight: bold; }
                        .info-value { font-size: 14px; color: #333; margin-top: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to LearnBox</h1>
                            <p>You're invited to become a College Admin</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${inviteeName},</h2>
                            <p>You have been invited by <strong>${superAdminName}</strong> to become a College Admin for <strong>${collegeName}</strong> on LearnBox.</p>
                            
                            <div class="invite-box">
                                <h3 style="color: #7C9E9E; margin-top: 0;">Complete Your Registration</h3>
                                <p>Click the button below to accept the invitation and set up your account:</p>
                                
                                <center>
                                    <a href="${acceptLink}" class="cta-button">Accept Invitation & Register</a>
                                </center>
                                
                                <p style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 15px;">
                                    Or copy and paste this link in your browser:<br>
                                    <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 4px; word-break: break-all;">
                                        ${acceptLink}
                                    </code>
                                </p>
                            </div>

                            <div class="info-grid">
                                <div class="info-item">
                                    <div class="info-label">College</div>
                                    <div class="info-value">${collegeName}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Role</div>
                                    <div class="info-value">College Admin</div>
                                </div>
                            </div>

                            <p><strong>⏱️ This invitation will expire in 24 hours.</strong> Make sure to complete your registration within this timeframe.</p>

                            <p style="background: #E0F2F1; padding: 15px; border-radius: 6px; margin: 15px 0;">
                                <strong>🔒 Security Note:</strong> When creating your password, make sure to use a strong password with at least 8 characters, including numbers and special characters.
                            </p>

                            <p>If you didn't expect this invitation or have any questions, please contact your platform administrator.</p>
                            
                            <p>Best regards,<br><strong>The LearnBox Team</strong></p>
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
        console.log(`✅ College admin invitation email sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error('Error sending college admin invitation email:', error);
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
