# LearnBox API Test Cases - Quick Reference

## Using These Tests

These tests can be run with:
- **curl** (command line)
- **Postman** (GUI)
- **Thunder Client** (VS Code extension)
- **API Client** (VS Code extension)

### Base URL
```
http://localhost:5000
```

---

## Auth Endpoints

### 1. POST /api/auth/register

**Valid Request:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "testuser@example.com",
    "password": "TestPass123!",
    "first_name": "Test",
    "last_name": "User",
    "collegeId": 1
  }'
```

**Test Case: Missing Validation**
```bash
# Missing username field
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!",
    "collegeId": 1
  }'
# Expected: 400 - "Username is required.", field: "username"
```

```bash
# Invalid email format
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "not-an-email",
    "password": "TestPass123!",
    "collegeId": 1
  }'
# Expected: 400 - "Please enter a valid email address.", field: "email"
```

```bash
# Weak password (less than 8 chars)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "testuser@example.com",
    "password": "Test123!",
    "collegeId": 1
  }'
# Expected: 400 - "Password must be at least 8 characters long.", field: "password"
```

```bash
# Password missing special character
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "testuser@example.com",
    "password": "TestPass123",
    "collegeId": 1
  }'
# Expected: 400 - "Password must contain at least one special character (!@#$%^&*).", field: "password"
```

```bash
# Password missing number
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "testuser@example.com",
    "password": "TestPass!",
    "collegeId": 1
  }'
# Expected: 400 - "Password must contain at least one number.", field: "password"
```

```bash
# Email already exists
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "existing@example.com",
    "password": "TestPass123!",
    "collegeId": 1
  }'
# Expected: 409 - "This email address is already registered. Please login or use a different email.", field: "email"
```

```bash
# Username already exists
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "existinguser",
    "email": "newuser@example.com",
    "password": "TestPass123!",
    "collegeId": 1
  }'
# Expected: 409 - "This username is already taken. Please choose another username.", field: "username"
```

```bash
# College doesn't exist
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "testuser@example.com",
    "password": "TestPass123!",
    "collegeId": 99999
  }'
# Expected: 404 - "Selected college not found. Please choose a valid college.", field: "collegeId"
```

---

### 2. POST /api/auth/login

**Valid Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }'
# Expected: 200 - success: true with tokens
```

**Test Cases:**
```bash
# Missing email
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password": "TestPass123!"}'
# Expected: 400 - "Email address is required.", field: "email"
```

```bash
# Missing password
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@example.com"}'
# Expected: 400 - "Password is required.", field: "password"
```

```bash
# Wrong password
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "WrongPassword123!"
  }'
# Expected: 401 - "Incorrect password or email. Please try again."
```

```bash
# User not verified
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "unverified@example.com",
    "password": "TestPass123!"
  }'
# Expected: 403 - "Please verify your email before logging in.", requiresVerification: true
```

```bash
# Account deactivated
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "deactivated@example.com",
    "password": "TestPass123!"
  }'
# Expected: 403 - "Your account has been deactivated. Please contact support for assistance."
```

```bash
# College deactivated
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }'
# Expected: 403 - "Your college has been deactivated. Please contact support."
```

---

### 3. POST /api/auth/verify-registration-otp

**Valid Request:**
```bash
curl -X POST http://localhost:5000/api/auth/verify-registration-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "otp": "123456"
  }'
# Expected: 200 - success with tokens
```

**Test Cases:**
```bash
# Missing email
curl -X POST http://localhost:5000/api/auth/verify-registration-otp \
  -H "Content-Type: application/json" \
  -d '{"otp": "123456"}'
# Expected: 400 - "Email is required.", field: "email"
```

```bash
# Invalid email format
curl -X POST http://localhost:5000/api/auth/verify-registration-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "otp": "123456"
  }'
# Expected: 400 - "Please enter a valid email address.", field: "email"
```

```bash
# Missing OTP
curl -X POST http://localhost:5000/api/auth/verify-registration-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@example.com"}'
# Expected: 400 - "Verification code is required.", field: "otp"
```

```bash
# OTP not 6 digits
curl -X POST http://localhost:5000/api/auth/verify-registration-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "otp": "12345"
  }'
# Expected: 400 - "Verification code must be 6 digits.", field: "otp"
```

```bash
# Invalid OTP
curl -X POST http://localhost:5000/api/auth/verify-registration-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "otp": "000000"
  }'
# Expected: 400 - "Invalid or expired verification code. Please try again or request a new code."
```

---

### 4. POST /api/auth/forgot-password

**Valid Request:**
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@example.com"}'
# Expected: 200 - "If an account with that email exists..."
```

**Test Cases:**
```bash
# Missing email
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 400 - "Email is required.", field: "email"
```

```bash
# Invalid email format
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email"}'
# Expected: 400 - "Please enter a valid email address.", field: "email"
```

```bash
# Non-existent email (should return same message as success)
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "nonexistent@example.com"}'
# Expected: 200 - "If an account with that email exists..." (No user enumeration)
```

---

### 5. POST /api/auth/reset-password

**Valid Request:**
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "otp": "123456",
    "newPassword": "NewPass456@"
  }'
# Expected: 200 - "Password reset successful."
```

**Test Cases:**
```bash
# Missing new password
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "otp": "123456"
  }'
# Expected: 400 - "New password is required.", field: "newPassword"
```

```bash
# Weak password
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "otp": "123456",
    "newPassword": "weak"
  }'
# Expected: 400 - "Password must contain at least one number and one special character.", field: "newPassword"
```

```bash
# Expired OTP
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "otp": "000000",
    "newPassword": "NewPass456@"
  }'
# Expected: 400 - "Invalid or expired verification code. Please try again."
```

---

### 6. PUT /api/auth/change-password

**Valid Request:**
```bash
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "currentPassword": "TestPass123!",
    "newPassword": "NewPass456@"
  }'
# Expected: 200 - "Password changed successfully."
```

**Test Cases:**
```bash
# Missing current password
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"newPassword": "NewPass456@"}'
# Expected: 400 - "Current password is required.", field: "currentPassword"
```

```bash
# Wrong current password
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "currentPassword": "WrongPass123!",
    "newPassword": "NewPass456@"
  }'
# Expected: 401 - "Current password is incorrect. Please try again."
```

```bash
# New password same as current
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "currentPassword": "TestPass123!",
    "newPassword": "TestPass123!"
  }'
# Expected: 400 - "New password must be different from your current password.", field: "newPassword"
```

```bash
# No authentication
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "TestPass123!",
    "newPassword": "NewPass456@"
  }'
# Expected: 401 - "Authentication required" or "Invalid token"
```

---

### 7. PUT /api/auth/profile

**Valid Request:**
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
  }'
# Expected: 200 - "Profile updated successfully."
```

**Test Cases:**
```bash
# Invalid email format
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"email": "invalid-email"}'
# Expected: 400 - "Please enter a valid email address.", field: "email"
```

```bash
# Email already in use
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"email": "taken@example.com"}'
# Expected: 409 - "This email is already in use. Please use another email address.", field: "email"
```

```bash
# Username already taken
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"username": "takenusername"}'
# Expected: 409 - "This username is already taken. Please choose another username.", field: "username"
```

---

### 8. GET /api/auth/me

**Valid Request:**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
# Expected: 200 - User data
```

**Test Cases:**
```bash
# No authentication
curl -X GET http://localhost:5000/api/auth/me
# Expected: 401 - "Authentication required"
```

```bash
# Invalid token
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer INVALID_TOKEN"
# Expected: 401 - "Invalid or expired token"
```

---

## User Management Endpoints (Admin)

### 9. GET /api/users

```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
# Expected: 200 - List of all users with count
```

---

### 10. PUT /api/users/:ID

**Valid Request:**
```bash
curl -X PUT http://localhost:5000/api/users/5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -d '{
    "first_name": "Jane",
    "role": "COLLEGE_ADMIN"
  }'
# Expected: 200 - "User updated successfully."
```

**Test Cases:**
```bash
# User not found
curl -X PUT http://localhost:5000/api/users/99999 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -d '{"first_name": "Jane"}'
# Expected: 404 - "User not found."
```

```bash
# Cannot deactivate yourself
curl -X PUT http://localhost:5000/api/users/YOUR_USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -d '{"isActive": false}'
# Expected: 400 - "You cannot deactivate your own account."
```

```bash
# Invalid email format
curl -X PUT http://localhost:5000/api/users/5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -d '{"email": "invalid-email"}'
# Expected: 400 - "Please enter a valid email address.", field: "email"
```

---

### 11. DELETE /api/users/:ID

**Valid Request:**
```bash
curl -X DELETE http://localhost:5000/api/users/5 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
# Expected: 200 - "User deleted successfully."
```

**Test Cases:**
```bash
# Cannot delete yourself
curl -X DELETE http://localhost:5000/api/users/YOUR_USER_ID \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
# Expected: 400 - "You cannot delete your own account."
```

```bash
# User not found
curl -X DELETE http://localhost:5000/api/users/99999 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
# Expected: 404 - "User not found."
```

---

## Testing Checklist

### Authentication Flow
- [ ] Register with valid data
- [ ] Register with existing email
- [ ] Register with weak password
- [ ] Get verification OTP via email
- [ ] Verify OTP (success)
- [ ] Verify OTP with wrong code
- [ ] Login with verified account
- [ ] Login with wrong password
- [ ] Forgot password flow
- [ ] Reset password with OTP
- [ ] Change password (authenticated)
- [ ] Update profile
- [ ] Get user profile

### Error Handling
- [ ] All missing field validations
- [ ] All format validations
- [ ] All duplicate checks
- [ ] All authorization checks
- [ ] All database errors gracefully handled

### Response Format
- [ ] All success responses have `success: true`
- [ ] All error responses have `success: false`
- [ ] Field-level errors have `field` property
- [ ] HTTP status codes are correct
- [ ] Error messages are user-friendly

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Invalid token" on GET /me | Token may have expired, refresh using refresh token |
| "User not found" after registration | Email might not be verified, check email for OTP |
| "This email is already registered" | Email is taken, try login instead or use different email |
| "Password must contain..." | Check password requirements (8+ chars, number, special char) |
| 500 error | Check server logs, may be database connection issue |
| CORS error | Check frontend is using correct base URL |

