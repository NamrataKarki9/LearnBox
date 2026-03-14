/**
 * College Management Controller
 * Handles CRUD operations for colleges (SUPER_ADMIN only)
 */

import prisma from '../prisma.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/errors.js';

/**
 * Get all colleges
 * @route GET /api/colleges (authenticated) or /api/colleges/public (public)
 * @access Public for /public route, authenticated for other routes
 */
export const getAllColleges = async (req, res) => {
    try {
        const { includeInactive } = req.query;
        const isPublicRoute = req.path.includes('/public');
        
        const whereClause = {};
        
        // Filter by active status unless explicitly requesting inactive
        if (includeInactive !== 'true') {
            whereClause.isActive = true;
        }
        
        // For public route, return minimal data
        if (isPublicRoute) {
            const colleges = await prisma.college.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    code: true
                },
                orderBy: { name: 'asc' }
            });
            
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                count: colleges.length,
                data: colleges
            });
        }
        
        // For authenticated routes, return full data with counts
        const colleges = await prisma.college.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: {
                        users: true,
                        resources: true,
                        modules: true,
                        mcqs: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            count: colleges.length,
            data: colleges
        });
    } catch (error) {
        console.error('Get all colleges error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};

/**
 * Get single college by ID
 * @route GET /api/colleges/:id
 * @access SUPER_ADMIN, COLLEGE_ADMIN (own college), STUDENT (own college)
 */
export const getCollegeById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const college = await prisma.college.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: {
                        users: true,
                        resources: true,
                        modules: true,
                        mcqs: true
                    }
                }
            }
        });

        if (!college) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'College not found'
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: college
        });
    } catch (error) {
        console.error('Get college by ID error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};

/**
 * Create new college
 * @route POST /api/colleges
 * @access SUPER_ADMIN only
 */
export const createCollege = async (req, res) => {
    try {
        const { name, code, location, description, isActive = true } = req.body;

        // Validate required fields
        if (!name || !code) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Name and code are required'
            });
        }

        // Check if college with same code already exists
        const existingCollege = await prisma.college.findUnique({
            where: { code }
        });

        if (existingCollege) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                error: 'College with this code already exists'
            });
        }

        const college = await prisma.college.create({
            data: {
                name,
                code: code.toUpperCase(),
                location,
                description,
                isActive
            }
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'College created successfully',
            data: college
        });
    } catch (error) {
        console.error('Create college error:', error);
        
        if (error.code === 'P2002') {
            return res.status(HTTP_STATUS.CONFLICT).json({
                error: 'College with this name or code already exists'
            });
        }
        
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};

/**
 * Update college
 * @route PUT /api/colleges/:id
 * @access SUPER_ADMIN only
 */
export const updateCollege = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, location, description, isActive } = req.body;

        // Check if college exists
        const existingCollege = await prisma.college.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingCollege) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'College not found'
            });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (code !== undefined) updateData.code = code.toUpperCase();
        if (location !== undefined) updateData.location = location;
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined) updateData.isActive = isActive;

        const college = await prisma.college.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'College updated successfully',
            data: college
        });
    } catch (error) {
        console.error('Update college error:', error);
        
        if (error.code === 'P2002') {
            return res.status(HTTP_STATUS.CONFLICT).json({
                error: 'College with this name or code already exists'
            });
        }
        
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};

/**
 * Delete/Deactivate college
 * @route DELETE /api/colleges/:id
 * @access SUPER_ADMIN only
 */
export const deleteCollege = async (req, res) => {
    try {
        const { id } = req.params;
        const { hardDelete = false } = req.query;
        const collegeId = parseInt(id);

        // Check if college exists
        const existingCollege = await prisma.college.findUnique({
            where: { id: collegeId }
        });

        if (!existingCollege) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'College not found'
            });
        }

        // Soft delete by default (deactivate)
        if (hardDelete === 'true') {
            // Hard delete: cascade delete all associated data using transaction
            console.log(`Starting cascade delete for college ${collegeId}`);
            
            try {
                // Use transaction to ensure all-or-nothing deletion
                await prisma.$transaction(async (tx) => {
                    // 1. Get all users in this college
                    const collegUsers = await tx.user.findMany({
                        where: { collegeId },
                        select: { id: true }
                    });
                    const userIds = collegUsers.map(u => u.id);
                    console.log(`Found ${userIds.length} users to delete`);

                    // 2. Delete MCQ Attempts (references users and MCQs)
                    if (userIds.length > 0) {
                        const deletedAttempts = await tx.mCQAttempt.deleteMany({
                            where: { studentId: { in: userIds } }
                        });
                        console.log(`✓ Deleted ${deletedAttempts.count} MCQ attempts`);
                    }

                    // 3. Delete Progress records (references users)
                    if (userIds.length > 0) {
                        const deletedProgress = await tx.progress.deleteMany({
                            where: { studentId: { in: userIds } }
                        });
                        console.log(`✓ Deleted ${deletedProgress.count} progress records`);
                    }

                    // 4. Delete Performance Analytics (references users)
                    if (userIds.length > 0) {
                        const deletedAnalytics = await tx.performanceAnalytics.deleteMany({
                            where: { studentId: { in: userIds } }
                        });
                        console.log(`✓ Deleted ${deletedAnalytics.count} performance analytics`);
                    }

                    // 5. Delete Document Summaries (references users)
                    if (userIds.length > 0) {
                        const deletedSummaries = await tx.documentSummary.deleteMany({
                            where: { userId: { in: userIds } }
                        });
                        console.log(`✓ Deleted ${deletedSummaries.count} document summaries`);
                    }

                    // 6. Delete Quiz Sessions
                    const deletedSessions = await tx.quizSession.deleteMany({ where: { collegeId } });
                    console.log(`✓ Deleted ${deletedSessions.count} quiz sessions`);

                    // 7. Delete SetMCQ entries (junction table - has cascade delete)
                    // But manually delete them first to be safe
                    const deletedSetMCQ = await tx.setMCQ.deleteMany({
                        where: { set: { collegeId } }
                    });
                    console.log(`✓ Deleted ${deletedSetMCQ.count} set-MCQ mappings`);

                    // 8. Delete MCQs
                    const deletedMCQs = await tx.mCQ.deleteMany({ where: { collegeId } });
                    console.log(`✓ Deleted ${deletedMCQs.count} MCQs`);

                    // 9. Delete MCQ Sets
                    const deletedSets = await tx.mCQSet.deleteMany({ where: { collegeId } });
                    console.log(`✓ Deleted ${deletedSets.count} MCQ sets`);

                    // 10. Delete Learning Sites
                    const deletedSites = await tx.learningSite.deleteMany({ where: { collegeId } });
                    console.log(`✓ Deleted ${deletedSites.count} learning sites`);

                    // 11. Delete Resources
                    const deletedResources = await tx.resource.deleteMany({ where: { collegeId } });
                    console.log(`✓ Deleted ${deletedResources.count} resources`);

                    // 12. Delete Modules
                    const deletedModules = await tx.module.deleteMany({ where: { collegeId } });
                    console.log(`✓ Deleted ${deletedModules.count} modules`);

                    // 13. Delete Faculties
                    const deletedFaculties = await tx.faculty.deleteMany({ where: { collegeId } });
                    console.log(`✓ Deleted ${deletedFaculties.count} faculties`);

                    // 14. Delete Users
                    const deletedUsers = await tx.user.deleteMany({ where: { collegeId } });
                    console.log(`✓ Deleted ${deletedUsers.count} users`);

                    // 15. Delete the College
                    const deletedCollege = await tx.college.delete({ where: { id: collegeId } });
                    console.log(`✓ Deleted college: ${deletedCollege.name}`);
                });

                console.log(`✅ College ${collegeId} and all associated data deleted successfully`);
                
                res.status(HTTP_STATUS.OK).json({
                    success: true,
                    message: 'College and all associated data permanently deleted'
                });
            } catch (transactionError) {
                console.error('Transaction error during cascade delete:', transactionError.message);
                throw transactionError;
            }
        } else {
            // Soft delete (deactivate)
            await prisma.college.update({
                where: { id: collegeId },
                data: { isActive: false }
            });

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'College deactivated successfully'
            });
        }
    } catch (error) {
        console.error('❌ Delete college error:', error.message);

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Failed to delete college: ' + error.message,
            details: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};

/**
 * Get college statistics
 * @route GET /api/colleges/:id/stats
 * @access SUPER_ADMIN, COLLEGE_ADMIN (own college)
 */
export const getCollegeStats = async (req, res) => {
    try {
        const { id } = req.params;

        const stats = await prisma.college.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                name: true,
                code: true,
                _count: {
                    select: {
                        users: true,
                        resources: true,
                        modules: true,
                        mcqs: true
                    }
                },
                users: {
                    select: {
                        role: true
                    }
                }
            }
        });

        if (!stats) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'College not found'
            });
        }

        // Count users by role
        const roleCount = stats.users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                college: {
                    id: stats.id,
                    name: stats.name,
                    code: stats.code
                },
                totalUsers: stats._count.users,
                totalResources: stats._count.resources,
                totalModules: stats._count.modules,
                totalMCQs: stats._count.mcqs,
                usersByRole: roleCount
            }
        });
    } catch (error) {
        console.error('Get college stats error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};
