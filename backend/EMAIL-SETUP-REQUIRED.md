# ⚠️ IMPORTANT: Email Configuration Required

The Email OTP feature requires SMTP configuration to send emails.

## Quick Setup for Gmail

1. **Go to your Google Account** (https://myaccount.google.com)

2. **Enable 2-Factor Authentication**
   - Security → 2-Step Verification → Turn On

3. **Generate App Password**
   - Security → App Passwords
   - Select "Mail" and "Other (Custom name)"
   - Enter "LearnBox" as the name
   - Click "Generate"
   - Copy the 16-character password (remove spaces)

4. **Update `.env` file**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-actual-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   EMAIL_FROM_NAME=LearnBox
   ```

5. **Restart Backend**
   ```bash
   npm run dev
   ```

## Alternative: Use a Test Email Service

For development/testing, you can use:

### Mailtrap (Free for testing)
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
EMAIL_FROM_NAME=LearnBox
```
Get credentials from: https://mailtrap.io

### Ethereal Email (Free temporary emails)
Visit: https://ethereal.email/create
Copy the SMTP credentials to `.env`

## Testing Without Email

For now, you can check the backend console logs to see the generated OTP codes during development.

The OTP will be printed in the backend console like:
```
✅ Registration OTP email sent to user@example.com
OTP: 123456
```

## Troubleshooting

- **"Failed to send OTP"**: Check SMTP credentials
- **"Invalid username or password"**: Use App Password, not regular password
- **"Connection timeout"**: Check firewall/antivirus settings
- OTP still appears in console even if email fails (for debugging)
