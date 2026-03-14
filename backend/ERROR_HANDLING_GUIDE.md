# LearnBox Error Handling Guide

## Overview

All student-related API endpoints now include comprehensive error handling with try-catch blocks, detailed validation, and user-friendly error messages. This document outlines the error handling improvements and provides test cases for both success and failure scenarios.

## Error Response Format

All endpoints now return consistent error responses with the following structure:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... },
  "tokens": { ... } // if authentication is involved
}
```

### Error Response
```json
{
  "success": false,
  "error": "User-friendly error message.",
  "field": "fieldName", // optional - which field caused the error
  "details": "Technical details" // only in development environment
}
```

## HTTP Status Codes

- **200 OK** - Successful request
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid input or validation error
- **401 Unauthorized** - Authentication failed
- **403 Forbidden** - Access denied
- **404 Not Found** - Resource not found
- **409 Conflict** - Duplicate or conflicting data
- **500 Internal Server Error** - Server error

---

## Authentication Endpoints

### 1. Register (`POST /api/auth/register`)

**Validation Checks:**
- Username is required and not empty
- Email is required and must be valid format
- Password must be 8+ characters with numbers and special characters
- College must be selected
- Email/username must be unique
- College must exist and be active

**Test Cases:**

#### ✅ Success Case
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "collegeId": 1
  }'

Expected Response (201 Created):
{
  "success": true,
  "message": "Registration successful. Please check your email for verification code.",
  "requiresVerification": true,
  "email": "john@example.com"
}
```

#### ❌ Missing Username
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "collegeId": 1
  }'

Expected Response (400):
{
  "success": false,
  "error": "Username is required.",
  "field": "username"
}
```

#### ❌ Invalid Email Format
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "invalid-email",
    "password": "SecurePass123!",
    "collegeId": 1
  }'

Expected Response (400):
{
  "success": false,
  "error": "Please enter a valid email address.",
  "field": "email"
}
```

#### ❌ Weak Password (Missing Special Character)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "Weak123",
    "collegeId": 1
  }'

Expected Response (400):
{
  "success": false,
  "error": "Password must contain at least one number and one special character.",
  "field": "password"
}
```

#### ❌ Email Already Exists
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "new_user",
    "email": "existing@example.com",
    "password": "SecurePass123!",
    "collegeId": 1
  }'

Expected Response (409):
{
  "success": false,
  "error": "This email address is already registered. Please login or use a different email.",
  "field": "email"
}
```

#### ❌ Invalid College
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "collegeId": 99999
  }'

Expected Response (404):
{
  "success": false,
  "error": "Selected college not found. Please choose a valid college.",
  "field": "collegeId"
}
```

---

### 2. Login (`POST /api/auth/login`)

**Validation Checks:**
- Email is required
- Password is required
- Account must be verified
- Account must be active
- College must be active

**Test Cases:**

#### ✅ Success Case
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

Expected Response (200):
{
  "success": true,
  "message": "Login successful!",
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "STUDENT"
  }
}
```

#### ❌ Missing Email
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "password": "SecurePass123!"
  }'

Expected Response (400):
{
  "success": false,
  "error": "Email address is required.",
  "field": "email"
}
```

#### ❌ Wrong Password
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "WrongPassword123!"
  }'

Expected Response (401):
{
  "success": false,
  "error": "Incorrect password or email. Please try again."
}
```

#### ❌ User Not Verified
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "unverified@example.com",
    "password": "SecurePass123!"
  }'

Expected Response (403):
{
  "success": false,
  "error": "Please verify your email before logging in.",
  "requiresVerification": true,
  "email": "unverified@example.com"
}
```

#### ❌ Account Deactivated
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "deactivated@example.com",
    "password": "SecurePass123!"
  }'

Expected Response (403):
{
  "success": false,
  "error": "Your account has been deactivated. Please contact support for assistance."
}
```

---

### 3. Verify OTP (`POST /api/auth/verify-registration-otp`)

**Validation Checks:**
- Email is required and must be valid
- OTP is required and must be 6 digits
- OTP must be valid and not expired
- User must exist

**Test Cases:**

#### ✅ Success Case
```bash
curl -X POST http://localhost:5000/api/auth/verify-registration-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456"
  }'

Expected Response (200):
{
  "success": true,
  "message": "Email verified successfully. You are now logged in.",
  "tokens": {
    "access": "...",
    "refresh": "..."
  }
}
```

#### ❌ Invalid OTP Format
```bash
curl -X POST http://localhost:5000/api/auth/verify-registration-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "abc123"
  }'

Expected Response (400):
{
  "success": false,
  "error": "Verification code must be 6 digits.",
  "field": "otp"
}
```

#### ❌ Wrong OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-registration-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "000000"
  }'

Expected Response (400):
{
  "success": false,
  "error": "Invalid or expired verification code. Please try again or request a new code."
}
```

---

### 4. Forgot Password (`POST /api/auth/forgot-password`)

**Validation Checks:**
- Email is required and must be valid format

**Test Cases:**

#### ✅ Success Case (User Exists)
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'

Expected Response (200):
{
  "success": true,
  "message": "If an account with that email exists, a password reset code has been sent to it.",
  "email": "john@example.com"
}
```

#### ✅ Success Case (User Doesn't Exist - Same Response)
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com"
  }'

Expected Response (200):
{
  "success": true,
  "message": "If an account with that email exists, a password reset code has been sent to it."
}
```

#### ❌ Invalid Email Format
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email"
  }'

Expected Response (400):
{
  "success": false,
  "error": "Please enter a valid email address.",
  "field": "email"
}
```

---

### 5. Reset Password (`POST /api/auth/reset-password`)

**Validation Checks:**
- Email is required
- OTP is required and must be 6 digits
- New password is required with strong requirements
- OTP must be valid

**Test Cases:**

#### ✅ Success Case
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456",
    "newPassword": "NewSecure123!"
  }'

Expected Response (200):
{
  "success": true,
  "message": "Password reset successful. You can now log in with your new password."
}
```

#### ❌ Weak New Password
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456",
    "newPassword": "weak"
  }'

Expected Response (400):
{
  "success": false,
  "error": "Password must contain at least 8 characters including numbers and special characters.",
  "field": "newPassword"
}
```

#### ❌ Expired/Invalid OTP
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "000000",
    "newPassword": "NewSecure123!"
  }'

Expected Response (400):
{
  "success": false,
  "error": "Invalid or expired verification code. Please try again."
}
```

---

### 6. Change Password (`PUT /api/auth/change-password`)

**Validation Checks:**
- Requires authentication
- Current password is required
- New password is required and must be strong
- New password must be different from current
- Current password must be correct

**Test Cases:**

#### ✅ Success Case
```bash
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecure456@"
  }'

Expected Response (200):
{
  "success": true,
  "message": "Password changed successfully. Please log in again with your new password."
}
```

#### ❌ Wrong Current Password
```bash
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "currentPassword": "WrongPassword123!",
    "newPassword": "NewSecure456@"
  }'

Expected Response (401):
{
  "success": false,
  "error": "Current password is incorrect. Please try again."
}
```

#### ❌ New Password Same as Current
```bash
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "SecurePass123!"
  }'

Expected Response (400):
{
  "success": false,
  "error": "New password must be different from your current password.",
  "field": "newPassword"
}
```

---

### 7. Update Profile (`PUT /api/auth/profile`)

**Validation Checks:**
- Requires authentication
- Email format must be valid if provided
- Username must not be taken if changed
- Email must not be taken if changed
- Only provided fields are updated

**Test Cases:**

#### ✅ Success Case
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "bio": "Software developer"
  }'

Expected Response (200):
{
  "success": true,
  "message": "Profile updated successfully.",
  "user": { ... }
}
```

#### ❌ Email Already in Use
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "email": "taken@example.com"
  }'

Expected Response (409):
{
  "success": false,
  "error": "This email is already in use. Please use another email address.",
  "field": "email"
}
```

#### ❌ Invalid Email Format
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "email": "invalid-email"
  }'

Expected Response (400):
{
  "success": false,
  "error": "Please enter a valid email address.",
  "field": "email"
}
```

---

## Settings Endpoints

### 8. Get Settings (`GET /api/auth/settings`)
**Status Codes:** 200, 404, 500
**Returns:** Current notification and preference settings

### 9. Update Notification Settings (`PUT /api/auth/settings/notifications`)
**Status Codes:** 200, 400, 500
**Returns:** Success message with updated settings

### 10. Update Preferences (`PUT /api/auth/settings/preferences`)
**Status Codes:** 200, 400, 500
**Returns:** Success message with updated settings

---

## User Management Endpoints (Admin Only)

### 11. Get All Users (`GET /api/users`)

#### ✅ Success Response
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

#### ❌ Server Error
```json
{
  "success": false,
  "error": "Failed to fetch users. Please try again later."
}
```

---

### 12. Update User (`PUT /api/users/:id`)

**Validation Checks:**
- User ID must be valid
- Cannot deactivate yourself
- Email format must be valid if changed
- Username/email must not be duplicated
- College must exist if provided

**Test Cases:**

#### ✅ Success Case
```bash
curl -X PUT http://localhost:5000/api/users/5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "COLLEGE_ADMIN",
    "isActive": true
  }'

Expected Response (200):
{
  "success": true,
  "message": "User updated successfully.",
  "data": { ... }
}
```

#### ❌ User Not Found
```bash
curl -X PUT http://localhost:5000/api/users/99999 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "first_name": "Jane"
  }'

Expected Response (404):
{
  "success": false,
  "error": "User not found. Please verify the user ID."
}
```

#### ❌ Cannot Deactivate Yourself
```bash
curl -X PUT http://localhost:5000/api/users/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_admin_token>" \
  -d '{
    "isActive": false
  }'

Expected Response (400):
{
  "success": false,
  "error": "You cannot deactivate your own account. Contact another admin for this action."
}
```

---

### 13. Delete User (`DELETE /api/users/:id`)

#### ✅ Success Case
```bash
curl -X DELETE http://localhost:5000/api/users/5 \
  -H "Authorization: Bearer <admin_token>"

Expected Response (200):
{
  "success": true,
  "message": "User deleted successfully.",
  "data": {
    "id": 5,
    "username": "john_doe"
  }
}
```

#### ❌ Cannot Delete Yourself
```bash
curl -X DELETE http://localhost:5000/api/users/1 \
  -H "Authorization: Bearer <your_admin_token>"

Expected Response (400):
{
  "success": false,
  "error": "You cannot delete your own account. Contact another admin for this action."
}
```

---

## Key Features Implemented

### 1. **Comprehensive Input Validation**
   - Required field checks
   - Format validation (email, passwords)
   - Length constraints
   - Special character requirements

### 2. **User-Friendly Error Messages**
   - Plain English error descriptions
   - Specific field identification
   - Actionable suggestions
   - No technical jargon

### 3. **Security Measures**
   - Password strength enforcement
   - Preventing user enumeration (forgot password)
   - Account deactivation support
   - Email verification requirement

### 4. **Consistent Response Format**
   - Success flag in all responses
   - Structured error information
   - HTTP status code compliance
   - Optional development details

### 5. **Database Error Handling**
   - Graceful handling of unique constraint violations
   - Record not found scenarios
   - Connection errors
   - Transaction failures

---

## Frontend Integration Notes

### Error Message Handling
```typescript
// Success
if (response.success) {
  toast.success(response.message);
  // Update UI
}

// Error with field
if (!response.success) {
  if (response.field) {
    // Show error on specific field
    setFieldError(response.field, response.error);
  } else {
    // Show generic error toast
    toast.error(response.error);
  }
}
```

### Token Refresh
```typescript
// When access token expires
const refreshResponse = await fetch('/api/auth/token/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh: refreshToken })
});

if (refreshResponse.status === 401) {
  // Redirect to login
  // Token is invalid or expired
}
```

---

## Password Requirements

All password-related endpoints enforce:
- **Minimum 8 characters**
- **At least one number** (0-9)
- **At least one special character** (!@#$%^&*()_+-=[]{}⌖:";'|,.<>?/)

---

## Files Modified

1. **Backend Controllers:**
   - `/backend/src/controllers/auth.controller.js` - All authentication endpoints
   - `/backend/src/controllers/user.controller.js` - User management endpoints

**Total Lines Modified:** 2000+
**Endpoints Enhanced:** 13
**Error Handling Patterns:** 5+

---

## Testing Recommendations

1. **Unit Tests:** Test each endpoint with valid and invalid inputs
2. **Integration Tests:** Test full authentication flows
3. **Load Tests:** Verify error handling under load
4. **Security Tests:** Test for SQL injection, XSS, and CSRF vulnerabilities

---

## Support and Debugging

For development environment:
- Error responses include `details` field with technical information
- Check browser console for debugging information
- Review server logs for database errors

For production environment:
- Error responses omit `details` field
- Generic error messages shown to users
- Server logs contain full error information

