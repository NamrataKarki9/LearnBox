# Profile Update Testing Guide

## Quick Test Steps

### 1. START BACKEND WITH LOGGING ENABLED
```bash
cd backend
npm start
```

Watch the console for output starting with "=== UPDATE PROFILE REQUEST ===".

### 2. OPEN BROWSER DEVELOPER TOOLS
- Open StudentSettingsPage
- Go to DevTools → Console tab
- Look for console.log messages with "Sending profile update:"

### 3. MAKE A SIMPLE PROFILE UPDATE
- Change **First Name** only (e.g., to "TestName")
- Click "Save Changes" button
- **Watch the backend console** for the full error log

### 4. COLLECT DEBUG INFO

If **success** toast appears:
- ✅ Profile update is working!
- Proceed to test other fields

If **error** toast appears:
- 📋 In backend console, find this section:
  ```
  === UPDATE PROFILE FINAL ERROR ===
  Error: 
  Error message: 
  Error stack: 
  ```
- 📋 Share these exact error details
- 📋 Also note: What field did you try to change?

## Expected Successful Logs

### Backend Console Should Show:
```
=== UPDATE PROFILE REQUEST ===
userId: 3
Body received: { username: 'student_1', email: 'student1@example.com', first_name: 'TestName' }

Update data prepared: { 
  first_name: 'TestName'
}

Attempting Prisma update for userId: 3
Update data being sent: { first_name: 'TestName' }
Prisma update successful, returning user: 3
```

### Frontend Console Should Show:
```
Sending profile update: { first_name: 'TestName' }
```

### Response Should Be:
```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "user": {
    "id": 3,
    "username": "student_1",
    "email": "student1@example.com",
    "first_name": "TestName",
    ...
  }
}
```

## Troubleshooting

### Issue: Still Getting 500 Error
**Check these in order:**
1. ❓ Is backend running? (should see "Server running on port 5000")
2. ❓ Is token valid? (if you see "[Error] Unauthorized" → need to login again)
3. ❓ Database connected? (Backend should connect to PostgreSQL on startup)
4. ❓ Share the backend error logs from console

### Issue: Error on Specific Field
If one field fails but others work:
1. Try updating a different field first
2. This helps identify if it's a field-specific issue
3. Share which field fails and which work

### Issue: Avatar Still Being Sent
Check browser DevTools → Network tab:
- Click on the failed request
- Go to "Request" tab
- Should NOT see "avatar" field in payload
- Should see: `{"username":"...", "email":"...", "first_name":"..."}` etc.

## Fields to Test (in order)

1. ✅ first_name: "TestStudent" 
2. ✅ last_name: "Updated"
3. ✅ phone: "+977-1234567890"
4. ✅ bio: "Test bio update"
5. ❌ username: (don't change - would need unique value)
6. ❌ email: (don't change - would need unique value)

## If All Tests Pass
- Validation system is working ✅
- Profile update API is working ✅
- Settings page is fully functional ✅

**Next:** Test password change functionality with new backend logging.
