/**
 * Email Service
 * Handles sending emails using Nodemailer
 */

import nodemailer from 'nodemailer';

// Create transporter using SMTP credentials from environment
const createTransporter = () => {
    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP not configured. Emails will not be sent. Check EMAIL-SETUP-REQUIRED.md');
        return null;
    }
    
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
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
        
        if (!transporter) {
            console.warn(`Email not sent to ${email}. SMTP not configured.`);
            console.log(`Use this OTP for ${email}: ${otp}`);
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
        console.log(`Registration OTP email sent to ${email}`);
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
        
        if (!transporter) {
            console.warn(`Email not sent to ${email}. SMTP not configured.`);
            console.log(`Use this OTP for ${email}: ${otp}`);
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
                                <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
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
        console.log(`Password reset OTP email sent to ${email}`);
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
        
        if (!transporter) {
            console.warn(`Email not sent to ${email}. SMTP not configured.`);
            console.log(`Use this invite link for ${email}: http://localhost:5173/invitation/accept?token=${inviteToken}`);
            return { success: true, warning: 'SMTP not configured' };
        }

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const acceptLink = `${baseUrl}/invitation/accept?token=${inviteToken}`;
        console.log('Generated registration link:', acceptLink);
        console.log('Token in link:', inviteToken?.substring(0, 16) + '...');

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'LearnBox'}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `LearnBox College Admin Invitation - ${collegeName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <style>
                        body { margin: 0; padding: 0; background: #f7f3ea; font-family: Arial, sans-serif; line-height: 1.6; color: #1c1208; }
                        .shell { width: 100%; padding: 32px 16px; box-sizing: border-box; }
                        .container { max-width: 640px; margin: 0 auto; background: #fffdf8; border: 1px solid #d8ccb8; }
                        .header { padding: 28px 32px 20px; border-bottom: 1px solid #e8dfd0; background: #fffaf1; text-align: center; }
                        .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #8b5e34; margin-bottom: 10px; }
                        .brand { font-family: Georgia, serif; font-size: 34px; font-weight: 700; color: #1c1208; margin: 0; }
                        .subtitle { margin: 10px 0 0; font-size: 15px; color: #5f5346; }
                        .content { padding: 32px; background: #fffdf8; }
                        .intro { margin: 0 0 18px; font-size: 16px; color: #1c1208; }
                        .body-copy { margin: 0 0 22px; font-size: 15px; color: #3f352b; }
                        .invite-box { background: #faf5eb; border: 1px solid #d8ccb8; padding: 24px; margin: 24px 0; }
                        .section-title { margin: 0 0 12px; font-family: Georgia, serif; font-size: 22px; color: #1c1208; }
                        .cta-button { display: inline-block; background-color: #1c1208; color: #fffdf8 !important; padding: 12px 24px; text-decoration: none; font-weight: bold; margin: 16px 0; }
                        .meta-table { width: 100%; border-collapse: collapse; margin: 18px 0 8px; }
                        .meta-table td { padding: 10px 0; border-bottom: 1px solid #e8dfd0; font-size: 14px; }
                        .meta-label { width: 120px; color: #7a6a52; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; font-size: 11px; }
                        .link-box { margin-top: 16px; padding: 12px 14px; background: #fffdf8; border: 1px solid #e8dfd0; color: #5f5346; font-size: 12px; word-break: break-all; }
                        .note { margin: 18px 0 0; padding: 14px 16px; background: #fffaf1; border-left: 3px solid #8b5e34; font-size: 14px; color: #3f352b; }
                        .footer { padding: 20px 32px 28px; border-top: 1px solid #e8dfd0; font-size: 12px; color: #7a6a52; text-align: center; background: #fffaf1; }
                    </style>
                </head>
                <body>
                    <div class="shell">
                        <div class="container">
                            <div class="header">
                                <div class="eyebrow">System Administration</div>
                                <h1 class="brand">LearnBox</h1>
                                <p class="subtitle">College Admin invitation</p>
                            </div>
                            <div class="content">
                                <p class="intro">Hello ${inviteeName},</p>
                                <p class="body-copy">You have been invited by <strong>${superAdminName}</strong> to join LearnBox as a <strong>College Admin</strong> for <strong>${collegeName}</strong>.</p>
                                
                                <div class="invite-box">
                                    <h3 class="section-title">Complete your registration</h3>
                                    <p class="body-copy" style="margin-bottom: 0;">Use the button below to accept this invitation and create your account.</p>
                                    
                                    <center>
                                        <a href="${acceptLink}" class="cta-button">Accept Invitation</a>
                                    </center>
                                    
                                    <table class="meta-table" role="presentation">
                                        <tr>
                                            <td class="meta-label">College</td>
                                            <td>${collegeName}</td>
                                        </tr>
                                        <tr>
                                            <td class="meta-label">Role</td>
                                            <td>College Admin</td>
                                        </tr>
                                        <tr>
                                            <td class="meta-label">Expires</td>
                                            <td>In 24 hours</td>
                                        </tr>
                                    </table>

                                    <div class="link-box">${acceptLink}</div>
                                </div>

                                <div class="note">
                                    This invitation expires in 24 hours. If you were not expecting it, you can safely ignore this email.
                                </div>
                                
                                <p class="body-copy" style="margin-top: 22px;">Best regards,<br><strong>The LearnBox Team</strong></p>
                            </div>
                            <div class="footer">
                                LearnBox system notification
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`College admin invitation email sent to ${email}`);
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
        console.log('Email server is ready to send messages');
        return true;
    } catch (error) {
        console.error('Email configuration error:', error.message);
        return false;
    }
};
