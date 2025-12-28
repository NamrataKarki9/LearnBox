# Email OTP Verification Implementation

## Overview
This implementation adds email OTP verification for user registration and password reset functionality to the LearnBox platform. The feature preserves all existing RBAC and college-scoped architecture.

## Features Implemented

### 1. Database Changes
- **User Model**: Added `is_verified` boolean field (default: false)
- **EmailOTP Model**: New table for storing temporary OTPs
  - 6-digit numeric OTP
  - Purpose: REGISTER or FORGOT_PASSWORD
  - 10-minute expiry
  - Automatic cleanup after verification

### 2. Registration Flow (Modified)
**Endpoint**: `POST /api/auth/register`
- User registers with college selection (STUDENT role only)
- Account created with `is_verified = false`
- OTP generated and sent to email
- Returns success message asking user to check email

**New Endpoint**: `POST /api/auth/verify-registration-otp`
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```
- Verifies OTP and marks user as verified
- Auto-logs user in by returning JWT tokens
- Deletes OTP after successful verification

### 3. Login Flow (Modified)
**Endpoint**: `POST /api/auth/login`
- Added verification check before allowing login
- Returns 403 error if `is_verified = false`
- Error response includes email for resending OTP

### 4. Forgot Password Flow (New)
**Endpoint**: `POST /api/auth/forgot-password`
```json
{
  "email": "user@example.com"
}
```
- Generates and sends password reset OTP
- Security: Doesn't reveal if email exists

**Endpoint**: `POST /api/auth/reset-password`
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```
- Verifies OTP and updates password
- Validates password strength (min 6 characters)
- Deletes OTP after successful reset

### 5. Resend OTP (New)
**Endpoint**: `POST /api/auth/resend-otp`
```json
{
  "email": "user@example.com",
  "purpose": "REGISTER" // or "FORGOT_PASSWORD"
}
```
- Generates new OTP and sends email
- Replaces previous OTP for same purpose

## Email Configuration

### Required Environment Variables
Add these to `.env`:
```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=LearnBox
```

### Gmail Setup (Recommended)
1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Generate App Password:
   - Go to Security > App Passwords
   - Select "Mail" and "Other" device
   - Copy the 16-character password
4. Use this password in `SMTP_PASS`

### Alternative SMTP Providers
- **SendGrid**: smtp.sendgrid.net:587
- **Mailgun**: smtp.mailgun.org:587
- **AWS SES**: email-smtp.[region].amazonaws.com:587
- **Outlook**: smtp-mail.outlook.com:587

## Installation Steps

### 1. Install Dependencies
```bash
cd backend
npm install nodemailer
```

### 2. Update Database Schema
```bash
npx prisma db push
```
This adds:
- `is_verified` column to User table
- EmailOTP table

### 3. Update Environment Variables
Edit `.env` and add SMTP configuration (see above)

### 4. Reseed Database (Optional)
```bash
node seed-rbac.js
```
Seeded users are pre-verified for testing.

### 5. Restart Backend
```bash
npm run dev
```

## API Endpoints Summary

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register user (sends OTP) |
| POST | `/api/auth/verify-registration-otp` | Public | Verify registration OTP |
| POST | `/api/auth/login` | Public | Login (checks verification) |
| POST | `/api/auth/forgot-password` | Public | Request password reset OTP |
| POST | `/api/auth/reset-password` | Public | Reset password with OTP |
| POST | `/api/auth/resend-otp` | Public | Resend OTP |

## Security Features

1. **OTP Expiry**: All OTPs expire after 10 minutes
2. **One-Time Use**: OTPs are deleted after successful verification
3. **Single Active OTP**: Only one OTP per email per purpose
4. **Password Hashing**: Passwords hashed with bcrypt (10 rounds)
5. **Email Obfuscation**: Forgot password doesn't reveal if email exists
6. **Role Enforcement**: Only STUDENT role can register publicly
7. **Verification Required**: Cannot login without email verification

## Files Modified

### New Files
- `src/services/otp.service.js` - OTP generation and validation
- `src/services/email.service.js` - Email sending with Nodemailer
- `EMAIL-OTP-IMPLEMENTATION.md` - This documentation

### Modified Files
- `prisma/schema.prisma` - Added is_verified and EmailOTP model
- `src/controllers/auth.controller.js` - Updated registration, login, added OTP endpoints
- `src/routes/auth.routes.js` - Added new OTP routes
- `seed-rbac.js` - Set is_verified=true for seeded users
- `package.json` - Added nodemailer dependency
- `.env` - Added SMTP configuration

## Testing

### Test Registration Flow
```bash
# 1. Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "collegeId": 1
  }'

# 2. Check email for OTP

# 3. Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-registration-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

### Test Forgot Password Flow
```bash
# 1. Request password reset
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'

# 2. Check email for OTP

# 3. Reset password
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456",
    "newPassword": "newpassword123"
  }'
```

## Email Templates

### Registration Email
- Professional design with LearnBox branding
- Clear OTP display
- 10-minute expiry warning
- Security notice

### Password Reset Email
- Warning design (red theme)
- Clear OTP display
- Security alert if not requested
- 10-minute expiry warning

## Error Handling

| Error | Status | Message |
|-------|--------|---------|
| Missing fields | 400 | "Email and OTP are required" |
| Invalid OTP | 400 | "Invalid OTP" |
| Expired OTP | 400 | "OTP has expired" |
| Not verified | 403 | "Please verify your email before logging in" |
| Email failed | 500 | "Failed to send OTP. Please try again." |

## Admin Users (Pre-Verified)

Admin accounts created via:
- Seed script
- Super admin creating college admins

These accounts have `is_verified = true` automatically and don't require OTP verification.

## Maintenance

### Cleanup Expired OTPs
OTPs are automatically deleted after:
- Successful verification
- Password reset
- Expiry (10 minutes)

You can manually run cleanup:
```javascript
import { cleanupExpiredOTPs } from './src/services/otp.service.js';
const deleted = await cleanupExpiredOTPs();
console.log(`Deleted ${deleted} expired OTPs`);
```

## Troubleshooting

### Emails Not Sending
1. Check SMTP credentials in `.env`
2. Verify SMTP server allows connections
3. Check firewall/antivirus settings
4. Review backend console for error messages
5. Test email config:
   ```javascript
   import { testEmailConfig } from './src/services/email.service.js';
   await testEmailConfig();
   ```

### OTP Not Received
1. Check spam/junk folder
2. Verify email address is correct
3. Use resend OTP endpoint
4. Check backend logs for email sending errors

### Login Fails After Registration
1. Ensure OTP was verified successfully
2. Check `is_verified` field in database
3. Verify user received tokens after OTP verification

## Integration with Existing Features

This implementation fully preserves:
- ✅ RBAC (Role-Based Access Control)
- ✅ College-scoped data access
- ✅ JWT token authentication
- ✅ All existing middleware
- ✅ Super admin and college admin creation
- ✅ Student-only public registration

## Future Enhancements

Potential improvements:
1. Rate limiting for OTP requests
2. Email template customization
3. SMS OTP alternative
4. OAuth integration (Google, GitHub)
5. Remember device/trusted device feature
6. Periodic cleanup job for expired OTPs
