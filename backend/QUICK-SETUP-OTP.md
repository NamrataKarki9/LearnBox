# Quick Setup Guide - Email OTP Verification

## 🚀 Installation Steps

### 1. Install Nodemailer
```bash
cd backend
npm install nodemailer
```

### 2. Update Database Schema
```bash
npx prisma db push
```
⚠️ This will add:
- `is_verified` column to User table
- New `EmailOTP` table

### 3. Configure Email (SMTP)

Edit `backend/.env` and add these lines:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=LearnBox
```

#### Gmail Setup (Recommended):
1. Go to your Google Account
2. Enable 2-Factor Authentication
3. Generate App Password:
   - Security > App Passwords
   - Select "Mail" and "Other"
   - Copy the 16-character password
4. Paste it as `SMTP_PASS` in .env

### 4. Reseed Database (Important!)
The existing seeded users need to be updated with `is_verified = true`:

```bash
node seed-rbac.js
```

### 5. Restart Backend
```bash
npm run dev
```

## ✅ What Changed

### Registration Flow (Modified)
- Users register → Receive OTP via email → Verify OTP → Account activated
- Cannot login until email is verified

### New Endpoints
- `POST /api/auth/verify-registration-otp` - Verify registration OTP
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP
- `POST /api/auth/resend-otp` - Resend OTP if not received

### Security
- OTP expires in 10 minutes
- One-time use only
- Cannot login without verification
- Admin accounts are pre-verified

## 🧪 Test It

### Test Registration with OTP
```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "yourtest@email.com",
    "password": "password123",
    "collegeId": 1
  }'

# Response includes: "Please check your email for verification code"

# 2. Check email for OTP

# 3. Verify OTP (this also logs you in)
curl -X POST http://localhost:5000/api/auth/verify-registration-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "yourtest@email.com",
    "otp": "123456"
  }'
```

## 📋 Test Accounts (Pre-Verified)

These accounts work immediately (no OTP needed):

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@learnbox.com | SuperAdmin@123 |
| Islington Admin | admin@islington.edu.np | Admin@123 |
| Herald Admin | admin@herald.edu.np | Admin@123 |
| Islington Student | john@islington.edu.np | Student@123 |
| Herald Student | jane@herald.edu.np | Student@123 |

## ⚠️ Troubleshooting

### "Failed to send OTP"
- Check SMTP credentials in `.env`
- Ensure Gmail App Password is correct
- Check if email service allows SMTP

### "OTP has expired"
- OTPs expire after 10 minutes
- Use resend OTP endpoint to get a new one

### Cannot login after registration
- Must verify OTP first
- Check spam folder for OTP email

## 📖 Full Documentation

See `EMAIL-OTP-IMPLEMENTATION.md` for complete details.
