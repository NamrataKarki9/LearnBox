/**
 * Validation utilities for form fields
 * Provides consistent validation rules across the application
 */

// ============== Email Validation ==============
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  const email_trimmed = email.trim();
  
  if (!email_trimmed) {
    return { valid: false, error: 'Email is required.' };
  }
  
  if (!emailRegex.test(email_trimmed)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  
  return { valid: true };
};

// ============== Username Validation ==============
// Username: Only letters (a-z, A-Z) and underscores allowed, no numbers or special characters
const usernameRegex = /^[a-zA-Z_]+$/;
const usernameMinLength = 3;
const usernameMaxLength = 20;

export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  const username_trimmed = username.trim();
  
  if (!username_trimmed) {
    return { valid: false, error: 'Username is required.' };
  }
  
  if (username_trimmed.length < usernameMinLength) {
    return { valid: false, error: `Username must be at least ${usernameMinLength} characters long.` };
  }
  
  if (username_trimmed.length > usernameMaxLength) {
    return { valid: false, error: `Username must not exceed ${usernameMaxLength} characters.` };
  }
  
  if (!usernameRegex.test(username_trimmed)) {
    return { valid: false, error: 'Username can only contain letters (a-z, A-Z) and underscores. No numbers or special characters allowed.' };
  }
  
  return { valid: true };
};

// Prevent invalid characters while typing
export const sanitizeUsername = (input: string): string => {
  // Only allow letters and underscores
  return input.replace(/[^a-zA-Z_]/g, '');
};

// ============== Full Name Validation ==============
// Full Name: Letters, spaces, and hyphens allowed
const fullNameRegex = /^[a-zA-Z\s\-']+$/;
const fullNameMinLength = 2;
const fullNameMaxLength = 100;

export const validateFullName = (name: string): { valid: boolean; error?: string } => {
  const name_trimmed = name.trim();
  
  if (!name_trimmed) {
    return { valid: false, error: 'Full name is required.' };
  }
  
  if (name_trimmed.length < fullNameMinLength) {
    return { valid: false, error: `Full name must be at least ${fullNameMinLength} characters long.` };
  }
  
  if (name_trimmed.length > fullNameMaxLength) {
    return { valid: false, error: `Full name must not exceed ${fullNameMaxLength} characters.` };
  }
  
  if (!fullNameRegex.test(name_trimmed)) {
    return { valid: false, error: 'Full name can only contain letters, spaces, hyphens, and apostrophes.' };
  }
  
  return { valid: true };
};

export const sanitizeFullName = (input: string): string => {
  // Only allow letters, spaces, hyphens, and apostrophes
  return input.replace(/[^a-zA-Z\s\-']/g, '');
};

// ============== Password Validation ==============
const passwordMinLength = 8;
const hasNumberRegex = /\d/;
const hasSpecialCharRegex = /[!@#$%^&*()_+\-=\[\]{}⌖:";'|,.<>?/\\]/;
const hasUppercaseRegex = /[A-Z]/;
const hasLowercaseRegex = /[a-z]/;

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password) {
    return { valid: false, errors: ['Password is required.'] };
  }
  
  if (password.length < passwordMinLength) {
    errors.push(`Password must be at least ${passwordMinLength} characters long.`);
  }
  
  if (!hasNumberRegex.test(password)) {
    errors.push('Password must contain at least one number (0-9).');
  }
  
  if (!hasSpecialCharRegex.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()...).');
  }
  
  if (!hasUppercaseRegex.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z).');
  }
  
  if (!hasLowercaseRegex.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z).');
  }
  
  return { valid: errors.length === 0, errors };
};

export const getPasswordStrength = (password: string): 'weak' | 'fair' | 'good' | 'strong' => {
  let strength = 0;
  
  if (password.length >= passwordMinLength) strength++;
  if (hasNumberRegex.test(password)) strength++;
  if (hasSpecialCharRegex.test(password)) strength++;
  if (password.length >= 12) strength++;
  if (hasUppercaseRegex.test(password) && hasLowercaseRegex.test(password)) strength++;
  
  if (strength <= 1) return 'weak';
  if (strength <= 2) return 'fair';
  if (strength <= 3) return 'good';
  return 'strong';
};

// ============== Password Match Validation ==============
export const validatePasswordMatch = (password: string, confirmPassword: string): { valid: boolean; error?: string } => {
  if (!confirmPassword) {
    return { valid: false, error: 'Please confirm your password.' };
  }
  
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match.' };
  }
  
  return { valid: true };
};

// ============== OTP Validation ==============
const otpRegex = /^\d{6}$/;

export const validateOTP = (otp: string): { valid: boolean; error?: string } => {
  const otp_trimmed = otp.trim();
  
  if (!otp_trimmed) {
    return { valid: false, error: 'Verification code is required.' };
  }
  
  if (!otpRegex.test(otp_trimmed)) {
    return { valid: false, error: 'Verification code must be exactly 6 digits.' };
  }
  
  return { valid: true };
};

export const sanitizeOTP = (input: string): string => {
  // Only allow digits, max 6
  return input.replace(/\D/g, '').slice(0, 6);
};

// ============== College Selection Validation ==============
export const validateCollegeSelection = (collegeId: string): { valid: boolean; error?: string } => {
  if (!collegeId || collegeId === '') {
    return { valid: false, error: 'Please select your college.' };
  }
  
  return { valid: true };
};

// ============== General Form Validation ==============
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

export const validateRegistrationForm = (data: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  collegeId: string;
}): FormValidationResult => {
  const errors: Record<string, string> = {};
  
  // Validate username
  const usernameValidation = validateUsername(data.username);
  if (!usernameValidation.valid) {
    errors.username = usernameValidation.error || 'Invalid username';
  }
  
  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error || 'Invalid email';
  }
  
  // Validate full name
  const fullNameValidation = validateFullName(data.fullName);
  if (!fullNameValidation.valid) {
    errors.fullName = fullNameValidation.error || 'Invalid full name';
  }
  
  // Validate password
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.errors[0] || 'Invalid password';
  }
  
  // Validate password match
  const passwordMatchValidation = validatePasswordMatch(data.password, data.confirmPassword);
  if (!passwordMatchValidation.valid) {
    errors.confirmPassword = passwordMatchValidation.error || 'Passwords do not match';
  }
  
  // Validate college selection
  const collegeValidation = validateCollegeSelection(data.collegeId);
  if (!collegeValidation.valid) {
    errors.collegeId = collegeValidation.error || 'Please select a college';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateLoginForm = (data: {
  email: string;
  password: string;
  college?: string;
}): FormValidationResult => {
  const errors: Record<string, string> = {};
  
  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error || 'Invalid email';
  }
  
  // Validate password exists
  if (!data.password) {
    errors.password = 'Password is required.';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// ============== First Name Validation ==============
const firstNameRegex = /^[a-zA-Z\s\-']+$/;
const firstNameMinLength = 1;

export const validateFirstName = (name: string): { valid: boolean; error?: string } => {
  const name_trimmed = name.trim();
  
  if (!name_trimmed) {
    return { valid: false, error: 'First name is required.' };
  }
  
  if (!firstNameRegex.test(name_trimmed)) {
    return { valid: false, error: 'First name can only contain letters, spaces, hyphens, and apostrophes.' };
  }
  
  return { valid: true };
};

export const sanitizeFirstName = (input: string): string => {
  return input.replace(/[^a-zA-Z\s\-']/g, '');
};

// ============== Last Name Validation ==============
const lastNameRegex = /^[a-zA-Z\s\-']+$/;

export const validateLastName = (name: string): { valid: boolean; error?: string } => {
  const name_trimmed = name.trim();
  
  if (!name_trimmed) {
    return { valid: false, error: 'Last name is required.' };
  }
  
  if (!lastNameRegex.test(name_trimmed)) {
    return { valid: false, error: 'Last name can only contain letters, spaces, hyphens, and apostrophes.' };
  }
  
  return { valid: true };
};

export const sanitizeLastName = (input: string): string => {
  return input.replace(/[^a-zA-Z\s\-']/g, '');
};

// ============== Phone Validation ==============
// Phone number: Only numbers allowed (for processing), displays with format like +977-XXXXXXXX
const phoneRegex = /^[0-9+\-().\s]*$/;

export const validatePhone = (phone: string): { valid: boolean; error?: string } => {
  if (!phone) {
    return { valid: true }; // Phone is optional
  }
  
  const phone_trimmed = phone.trim();
  
  // Extract only digits
  const digitsOnly = phone_trimmed.replace(/\D/g, '');
  
  if (digitsOnly.length !== 10) {
    return { valid: false, error: 'Phone number must be exactly 10 digits.' };
  }
  
  if (!phoneRegex.test(phone_trimmed)) {
    return { valid: false, error: 'Phone number can only contain numbers and standard formatting characters.' };
  }
  
  return { valid: true };
};

export const formatPhoneNumber = (input: string): string => {
  // Remove all non-digits
  const digitsOnly = input.replace(/\D/g, '');
  
  // If it starts with a country code, format as +XXX XXXXXXXX
  if (digitsOnly.startsWith('977')) {
    return '+' + digitsOnly.substring(0, 3) + ' ' + digitsOnly.substring(3);
  }
  
  // General formatting for other numbers
  if (digitsOnly.length > 10) {
    return digitsOnly.substring(0, 3) + '-' + digitsOnly.substring(3, 6) + '-' + digitsOnly.substring(6);
  }
  
  return input;
};

export const sanitizePhone = (input: string): string => {
  // Only allow numbers, +, -, (), and spaces
  return input.replace(/[^0-9+\-().\s]/g, '');
};
