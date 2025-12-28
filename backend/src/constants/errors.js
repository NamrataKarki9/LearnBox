/**
 * Standard error messages for the LearnBox system
 */

export const ERROR_MESSAGES = {
    // Authentication
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'Authentication required',
    TOKEN_EXPIRED: 'Token has expired',
    INVALID_TOKEN: 'Invalid token',
    
    // Authorization
    FORBIDDEN: 'You do not have permission to perform this action',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
    ROLE_NOT_AUTHORIZED: 'Your role is not authorized for this action',
    
    // College Access
    COLLEGE_ACCESS_DENIED: 'You do not have access to this college',
    INVALID_COLLEGE: 'Invalid or inactive college',
    COLLEGE_REQUIRED: 'College assignment is required',
    
    // User Management
    USER_NOT_FOUND: 'User not found',
    USER_ALREADY_EXISTS: 'User with this email already exists',
    CANNOT_CREATE_SUPER_ADMIN: 'Cannot create SUPER_ADMIN through public endpoints',
    
    // Validation
    INVALID_INPUT: 'Invalid input data',
    REQUIRED_FIELD_MISSING: 'Required field is missing',
    
    // Resources
    RESOURCE_NOT_FOUND: 'Resource not found',
    
    // General
    INTERNAL_SERVER_ERROR: 'Internal server error',
    DATABASE_ERROR: 'Database operation failed'
};

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};
