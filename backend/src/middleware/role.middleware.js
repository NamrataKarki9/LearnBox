/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces role and college-scoped authorization
 */

import { ROLES, hasPermission, isValidRole } from '../constants/roles.js';
import { ERROR_MESSAGES, HTTP_STATUS } from '../constants/errors.js';

/**
 * Middleware to check if user has required role(s)
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 */
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
                error: ERROR_MESSAGES.UNAUTHORIZED 
            });
        }

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        
        if (!roles.includes(req.user.role)) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({ 
                error: ERROR_MESSAGES.ROLE_NOT_AUTHORIZED,
                requiredRoles: roles,
                userRole: req.user.role
            });
        }

        next();
    };
};

// Legacy authorize function for backward compatibility
export const authorize = (allowedRoles) => {
    return requireRole(allowedRoles);
};

/**
 * Middleware to check if user has permission
 * @param {string} permission - Permission constant from roles.js
 */
export const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
                error: ERROR_MESSAGES.UNAUTHORIZED 
            });
        }

        if (!hasPermission(req.user.role, permission)) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({ 
                error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
                permission,
                userRole: req.user.role
            });
        }

        next();
    };
};

/**
 * Middleware to check college access for COLLEGE_ADMIN
 * Ensures COLLEGE_ADMIN can only access their assigned college
 */
export const requireCollegeAccess = async (req, res, next) => {
    if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
            error: ERROR_MESSAGES.UNAUTHORIZED 
        });
    }

    // SUPER_ADMIN has access to all colleges
    if (req.user.role === ROLES.SUPER_ADMIN) {
        return next();
    }

    // COLLEGE_ADMIN must have a college assigned
    if (req.user.role === ROLES.COLLEGE_ADMIN) {
        if (!req.user.collegeId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({ 
                error: ERROR_MESSAGES.COLLEGE_REQUIRED 
            });
        }

        // Check if trying to access a different college
        const requestedCollegeId = parseInt(
            req.params?.collegeId || 
            req.body?.collegeId || 
            req.query?.collegeId
        );
        
        if (requestedCollegeId && requestedCollegeId !== req.user.collegeId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({ 
                error: ERROR_MESSAGES.COLLEGE_ACCESS_DENIED,
                assignedCollegeId: req.user.collegeId,
                requestedCollegeId
            });
        }

        // Attach college ID to request for convenience
        req.collegeId = req.user.collegeId;
    }

    // STUDENT must have a college assigned
    if (req.user.role === ROLES.STUDENT) {
        if (!req.user.collegeId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({ 
                error: ERROR_MESSAGES.COLLEGE_REQUIRED 
            });
        }
        req.collegeId = req.user.collegeId;
    }

    next();
};

// Legacy verifyCollegeAccess function for backward compatibility
export const verifyCollegeAccess = (collegeIdParam = 'collegeId') => {
    return requireCollegeAccess;
};

/**
 * Middleware to prevent SUPER_ADMIN creation through public endpoints
 */
export const preventSuperAdminCreation = (req, res, next) => {
    if (req.body.role === ROLES.SUPER_ADMIN) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({ 
            error: ERROR_MESSAGES.CANNOT_CREATE_SUPER_ADMIN 
        });
    }
    next();
};

/**
 * Middleware to validate role in request body
 */
export const validateRole = (req, res, next) => {
    if (req.body.role && !isValidRole(req.body.role)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
            error: 'Invalid role specified',
            validRoles: Object.values(ROLES)
        });
    }
    next();
};

/**
 * Combined middleware for college-scoped operations
 * Ensures proper role and college access
 */
export const requireCollegeScopedAccess = [
    requireRole([ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN]),
    requireCollegeAccess
];

/**
 * Middleware for student-only access with college check
 */
export const requireStudentAccess = [
    requireRole(ROLES.STUDENT),
    requireCollegeAccess
];

