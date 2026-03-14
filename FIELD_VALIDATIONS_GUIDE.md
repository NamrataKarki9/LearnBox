# Frontend Field Validations Guide

## Overview

All form fields now include **real-time validation** with immediate user feedback. Fields are validated as users type and show specific error messages for each validation rule.

---

## Validation Rules by Field

### 1. **Username** ❌📝

**Allowed Characters:** Letters (a-z, A-Z) and underscores (_) ONLY  
**Not Allowed:** Numbers, special characters, spaces

```
✅ Valid Examples:
  - john_doe
  - alice_smith  
  - user_name

❌ Invalid Examples:
  - john123        (contains numbers)
  - john-doe       (contains hyphen)
  - john doe       (contains space)
  - john!          (contains special character)
  - 123john        (starts with number)
```

**Length Requirement:** 3-20 characters

**Error Messages:**
- "Username is required." → Leave no input
- "Username must be at least 3 characters long." → Less than 3 characters
- "Username must not exceed 20 characters." → More than 20 characters
- "Username can only contain letters (a-z, A-Z) and underscores..." → Invalid characters (auto-sanitized)

**Frontend Behavior:**
- ❌ Numbers typed in username field are automatically removed
- ❌ Special characters are automatically removed  
- ❌ Spaces are automatically removed
- ✅ Only letters and underscores are kept

---

### 2. **Full Name** 👤

**Allowed Characters:** Letters (a-z, A-Z), spaces, hyphens (-), and apostrophes (')  
**Not Allowed:** Numbers, special characters except hyphens and apostrophes

```
✅ Valid Examples:
  - John Doe
  - Mary-Jane Smith
  - O'Connor
  - Jean-Paul Martin

❌ Invalid Examples:
  - John123        (contains numbers)
  - John@Doe       (contains special character)
  - John_Doe       (contains underscore)
```

**Length Requirement:** 2-100 characters

**Error Messages:**
- "Full name is required." → Leave no input
- "Full name must be at least 2 characters long." → Less than 2 characters
- "Full name must not exceed 100 characters." → More than 100 characters
- "Full name can only contain letters, spaces, hyphens, and apostrophes." → Invalid characters

**Frontend Behavior:**
- ❌ Numbers are automatically removed
- ❌ Most special characters (except - and ') are automatically removed
- ✅ Letters, spaces, hyphens, and apostrophes are kept

---

### 3. **Email** 📧

**Format:** Must match standard email pattern

```
✅ Valid Examples:
  - john@example.com
  - john.doe@company.co.uk
  - user+tag@domain.com
  - firstname.lastname@example.com

❌ Invalid Examples:
  - johnexample.com        (missing @)
  - john@                  (missing domain)
  - @example.com           (missing username)
  - john @example.com      (space before @)
```

**Error Messages:**
- "Email is required." → Leave no input
- "Please enter a valid email address." → Invalid format

**Frontend Behavior:**
- ✅ Any characters allowed (email validation is done at submission)
- 🔍 Real-time format checking on blur (after user leaves field)

---

### 4. **Password** 🔐

**Minimum Length:** 8 characters  
**Required Components:**
- ✅ At least ONE number (0-9)
- ✅ At least ONE special character (!@#$%^&*()_+...)
- ✅ At least ONE uppercase letter (A-Z)
- ✅ At least ONE lowercase letter (a-z)

```
✅ Valid Examples:
  - Password123!
  - MyPass@2024
  - SecureP@ss1
  - Test@1234

❌ Invalid Examples:
  - password123!   (no uppercase)
  - PASSWORD123!   (no lowercase)
  - Password123    (no special character)
  - Pass!@1        (too short - only 7 chars)
  - abcdefgh       (no numbers, special chars, uppercase)
```

**Error Messages (shown as user types):**
- "Password is required." → Leave no input
- "Password must be at least 8 characters long." → Too short
- "Password must contain at least one number (0-9)." → Missing number
- "Password must contain at least one special character (!@#$%^&*)." → Missing special char
- "Password must contain at least one uppercase letter (A-Z)." → Missing uppercase
- "Password must contain at least one lowercase letter (a-z)." → Missing lowercase

**Frontend Behavior:**
- 🎨 **Real-time password strength indicator:**
  - Weak (red) - Meets 0-1 requirements
  - Fair (yellow) - Meets 2 requirements
  - Good (blue) - Meets 3 requirements
  - Strong (green) - Meets 4+ requirements
  
- 📋 **Visual checklist** showing which requirements are met:
  - ○ At least one number (0-9) → ✓ Ones met
  - ○ At least one special character (!@#$%^&*) → ✓ Once met
  - ○ At least one uppercase letter (A-Z) → ✓ Once met
  - ○ At least one lowercase letter (a-z) → ✓ Once met
  - ○ At least 8 characters → ✓ Once met

---

### 5. **Confirm Password** ✅🔐

**Must match:** Exactly matches the password field above

```
✅ Valid:
  - Password: "MyPass@2024"
  - Confirm: "MyPass@2024"

❌ Invalid:
  - Password: "MyPass@2024"
  - Confirm: "MyPass@202"   (missing last digit)
```

**Error Messages:**
- "Please confirm your password." → Leave no input
- "Passwords do not match." → Doesn't match password field

**Frontend Behavior:**
- ❌ Shows error when password doesn't match (on blur)
- ✅ Shows success checkmark when passwords match

---

### 6. **College Selection** 🎓

**Requirement:** Must select a college from dropdown

```
✅ Valid:
  - Select "Indian Institute of Technology, Delhi"
  - Select any college from the list

❌ Invalid:
  - Leave "Choose your academic institution..." selected
  - Don't select any college
```

**Error Messages:**
- "Please select your college." → No college selected
- "Selected college not found. Please choose a valid college." → (Backend error)

**Frontend Behavior:**
- 🎨 Invalid field highlighted with red border
- ✅ Error clears when valid college is selected

---

## Real-Time Validation Features

### Field Highlighting

**Normal state:**
```
Input field with gray background
```

**Valid state:**
```
Input field with green checkmark
Field hint or success message shown
```

**Invalid state (after user interaction):**
```
Input field with RED BORDER
Error message in red text below field
```

### When Validation Triggers

| Event | Validation | Error Display |
|-------|-----------|---------------|
| **First interaction (typing)** | Optional | Hidden |
| **User leaves field (blur)** | Yes | Shown if invalid |
| **Form submission** | Yes | Shown for all errors |

### Sanitization (Auto-fix on Type)

Some fields automatically remove invalid characters as you type:

1. **Username**: Numbers and special characters removed automatically
   - Type `john123` → Stored as `john`
   - Type `john-doe` → Stored as `johndoe`

2. **Full Name**: Numbers and most special characters removed automatically
   - Type `John123 Doe` → Stored as `John Doe`
   - Type `O'Brien` → Kept as `O'Brien` (apostrophe allowed)

3. **OTP**: Only digits kept, max 6 characters
   - Type `abc123def` → Stored as `123`

---

## User Experience Flow

### Registration Form Walkthrough

```
1. User opens Registration Form
   ↓
2. User types Username: "john123"
   ↓
3. Backend auto-removes "123" → "john" (shown in field)
   ↓
4. User leaves username field
   ↓
5. Validation checks: "john" is valid
   ↓
6. User types email: "invalidemail"
   ↓
7. User leaves email field
   ↓
8. Error appears: "Please enter a valid email address."
   ↓
9. User corrects to: "john@example.com"
   ↓
10. Error disappears automatically
    ↓
11. User types password: "pass"
    ↓
12. Password strength shows: Weak (need number, special char, uppercase)
    ↓
13. User types: "MyPassword123!"
    ↓
14. Password strength shows: Strong ✓
    ↓
15. User confirms password
    ↓
16. All fields valid, Submit button enabled ✓
    ↓
17. User clicks Create Account
    ↓
18. Form validates all fields again
    ↓
19. Success! All validations pass → Account created
```

---

## Backend Validation (Additional Security)

While frontend provides immediate feedback, **backend validates everything again** for security:

- Username: Letters and underscores only, 3-20 chars, must be unique
- Email: Valid format, must be unique
- Password: 8+ chars, numbers, special chars, uppercase, lowercase
- College: Must exist and be active
- OTP: Must be valid 6-digit code

**Why?** Frontend validation can be bypassed, backend cannot.

---

## Code Implementation

### Validators File Location
```
frontend/src/utils/validators.ts
```

### Components Using Validations
```
frontend/src/app/pages/RegisterPage.tsx
frontend/src/app/pages/LoginPage.tsx
frontend/src/app/components/PasswordStrengthIndicator.tsx
frontend/src/app/components/FieldValidation.tsx
```

### Form Error Display Component
```typescript
<FieldError error={fieldErrors.username} />
// Shows: ❌ Error message in red
```

---

## Testing the Validations

### Test Case 1: Username with Numbers
```
1. Go to Registration page
2. Type "john123" in username field
3. Expected: Numbers automatically removed, shows "john"
4. Tab to next field
5. Expected: No error (valid username)
```

### Test Case 2: Weak Password
```
1. Go to Registration page
2. Type "Password" in password field
3. Expected: Shows "Weak" strength indicator
4. Expected: Shows checklist with missing items:
   - ○ At least one number (0-9)
   - ○ At least one special character
5. Type "Password1!" 
6. Expected: Shows "Strong" strength indicator
```

### Test Case 3: Invalid Email
```
1. Go to Registration page
2. Type "invalidemail" in email field
3. Tab away from field
4. Expected: Error "Please enter a valid email address."
5. Type ".com"
6. Expected: Error disappears (assuming valid format)
```

### Test Case 4: Mismatched Passwords
```
1. Type "MyPass@2024" in password field
2. Type "MyPass@202" in confirm field
3. Tab away from confirm field
4. Expected: Error "Passwords do not match."
5. Type "4" to complete
6. Expected: Shows ✓ Passwords match!
```

---

## Troubleshooting

### Issue: Username field keeps removing my input
**Reason:** Only letters and underscores are allowed  
**Solution:** Use only a-z, A-Z, and _ characters

### Issue: Password strength won't go to "Strong"
**Reason:** Missing one of the five requirements  
**Check list:**
- [ ] At least 8 characters?
- [ ] Contains a number (0-9)?
- [ ] Contains a special character (!@#$%^&*)?
- [ ] Contains uppercase letter (A-Z)?
- [ ] Contains lowercase letter (a-z)?

### Issue: Email error won't go away
**Reason:** Email format is still invalid  
**Valid format:** something@domain.com  
**Check:**
- Does it have @ symbol?
- Does it have a domain after @?
- Does it have domain extension (.com, .co.in, etc.)?

### Issue: Form won't submit
**Reason:** One or more fields have errors  
**Solution:**
- Fix all highlighted fields (you'll see specific errors)
- All errors must show no error messages
- All required fields must be filled

---

## Keyboard Shortcuts & Tips

| Action | Result |
|--------|--------|
| Tab key | Move to next field & trigger validation |
| Shift+Tab | Move to previous field |
| Enter (on form) | Submit form if all valid |

---

## Browser Compatibility

All validations work on:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

---

## Summary of Validation Rules

```
┌─────────────────┬────────────────────┬──────────────────────────┐
│ Field          │ Allowed Characters  │ Length / Requirements    │
├─────────────────┼──────────────────────┼──────────────────────────┤
│ Username        │ a-z, A-Z, _         │ 3-20 characters         │
│ Full Name       │ a-z, A-Z, space, *  │ 2-100 characters        │
│ Email           │ Any (format check)  │ Valid @ domain.ext      │
│ Password        │ Any                 │ 8+, numbers, special    │
│ Confirm Pass    │ Any                 │ Must match password     │
│ College         │ Dropdown only       │ Must select one         │
└─────────────────┴──────────────────────┴──────────────────────────┘
* = Letters, spaces, hyphens, apostrophes
```

---

## Performance Impact

- ✅ **No lag** - Validations run instantly
- ✅ **Smooth UX** - Errors appear immediately on blur
- ✅ **Responsive** - Full UI responsiveness maintained
- ✅ **Mobile friendly** - Touch events supported

---

**Your form is now enterprise-grade with comprehensive field validation! 🎉**

