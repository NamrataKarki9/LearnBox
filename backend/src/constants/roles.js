/**
 * Role-Based Access Control (RBAC) Constants
 * Defines all roles and their permissions in the LearnBox system
 */

export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    COLLEGE_ADMIN: 'COLLEGE_ADMIN',
    STUDENT: 'STUDENT'
};

export const ROLE_HIERARCHY = {
    [ROLES.SUPER_ADMIN]: 3,
    [ROLES.COLLEGE_ADMIN]: 2,
    [ROLES.STUDENT]: 1
};

export const PERMISSIONS = {
    // College Management
    MANAGE_COLLEGES: [ROLES.SUPER_ADMIN],
    VIEW_COLLEGES: [ROLES.SUPER_ADMIN],
    
    // User Management
    CREATE_COLLEGE_ADMIN: [ROLES.SUPER_ADMIN],
    MANAGE_USERS: [ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN],
    VIEW_USERS: [ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN],
    
    // Content Management
    UPLOAD_RESOURCES: [ROLES.COLLEGE_ADMIN],
    MANAGE_RESOURCES: [ROLES.COLLEGE_ADMIN],
    VIEW_RESOURCES: [ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.STUDENT],
    
    // MCQ Management
    CREATE_MCQS: [ROLES.COLLEGE_ADMIN],
    MANAGE_MCQS: [ROLES.COLLEGE_ADMIN],
    ATTEMPT_MCQS: [ROLES.STUDENT],
    VIEW_MCQS: [ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.STUDENT],
    
    // Module Management
    CREATE_MODULES: [ROLES.COLLEGE_ADMIN],
    MANAGE_MODULES: [ROLES.COLLEGE_ADMIN],
    VIEW_MODULES: [ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.STUDENT],
    
    // Analytics & Reports
    VIEW_ANALYTICS: [ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN],
    VIEW_STUDENT_PROGRESS: [ROLES.COLLEGE_ADMIN, ROLES.STUDENT]
};

/**
 * Check if a role has a specific permission
 * @param {string} userRole - The user's role
 * @param {string} permission - The permission to check
 * @returns {boolean}
 */
export function hasPermission(userRole, permission) {
    const allowedRoles = PERMISSIONS[permission];
    return allowedRoles && allowedRoles.includes(userRole);
}

/**
 * Check if a role can access another role's hierarchy
 * @param {string} userRole - The user's role
 * @param {string} targetRole - The target role to compare
 * @returns {boolean}
 */
export function canAccessRole(userRole, targetRole) {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
}

/**
 * Validate if a role exists in the system
 * @param {string} role - The role to validate
 * @returns {boolean}
 */
export function isValidRole(role) {
    return Object.values(ROLES).includes(role);
}
