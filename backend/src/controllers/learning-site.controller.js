/**
 * Learning Site Controller
 * Manage curated external learning links per faculty/year/module.
 */

import prisma from '../prisma.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/errors.js';
import { ROLES } from '../constants/roles.js';

const getLearningSiteDelegate = () => {
    if (!prisma.learningSite) {
        return null;
    }
    return prisma.learningSite;
};

const buildWhereClause = (user, query) => {
    const whereClause = {};

    if (user.role !== ROLES.SUPER_ADMIN) {
        whereClause.collegeId = user.collegeId;
    } else if (query.collegeId) {
        whereClause.collegeId = parseInt(query.collegeId);
    }

    if (query.facultyId) {
        whereClause.facultyId = parseInt(query.facultyId);
    }

    if (query.year) {
        whereClause.year = parseInt(query.year);
    }

    if (query.moduleId) {
        whereClause.moduleId = parseInt(query.moduleId);
    }

    if (query.search) {
        whereClause.OR = [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { module: { name: { contains: query.search, mode: 'insensitive' } } }
        ];
    }

    return whereClause;
};

export const getAllLearningSites = async (req, res) => {
    try {
        const learningSiteDelegate = getLearningSiteDelegate();
        if (!learningSiteDelegate) {
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: 'Learning Sites is not initialized yet. Run prisma generate and prisma db push, then restart backend.'
            });
        }

        if (!req.user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                error: ERROR_MESSAGES.UNAUTHORIZED
            });
        }

        if ((req.user.role === ROLES.COLLEGE_ADMIN || req.user.role === ROLES.STUDENT) && !req.user.collegeId) {
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                count: 0,
                data: []
            });
        }

        const whereClause = buildWhereClause(req.user, req.query);

        const learningSites = await learningSiteDelegate.findMany({
            where: whereClause,
            include: {
                module: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                faculty: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                creator: {
                    select: {
                        id: true,
                        username: true,
                        first_name: true,
                        last_name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            count: learningSites.length,
            data: learningSites
        });
    } catch (error) {
        console.error('Get learning sites error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};

export const createLearningSite = async (req, res) => {
    try {
        const learningSiteDelegate = getLearningSiteDelegate();
        if (!learningSiteDelegate) {
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: 'Learning Sites is not initialized yet. Run prisma generate and prisma db push, then restart backend.'
            });
        }

        const { title, description, url, facultyId, year, moduleId } = req.body;

        if (!title || !url || !facultyId || !year || !moduleId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Title, URL, faculty, year, and module are required'
            });
        }

        const parsedFacultyId = parseInt(facultyId);
        const parsedYear = parseInt(year);
        const parsedModuleId = parseInt(moduleId);

        if (Number.isNaN(parsedFacultyId) || Number.isNaN(parsedYear) || Number.isNaN(parsedModuleId)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Invalid faculty, year, or module value'
            });
        }

        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Please provide a valid URL'
            });
        }

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'URL must start with http:// or https://'
            });
        }

        const collegeId = req.user.role === ROLES.SUPER_ADMIN
            ? (req.body.collegeId ? parseInt(req.body.collegeId) : req.user.collegeId)
            : req.user.collegeId;

        if (!collegeId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'College ID is required'
            });
        }

        const [faculty, module] = await Promise.all([
            prisma.faculty.findUnique({ where: { id: parsedFacultyId } }),
            prisma.module.findUnique({ where: { id: parsedModuleId } })
        ]);

        if (!faculty || faculty.collegeId !== collegeId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Faculty not found in your college'
            });
        }

        if (!module || module.collegeId !== collegeId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Module not found in your college'
            });
        }

        if (module.facultyId !== parsedFacultyId || module.year !== parsedYear) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Selected module does not match faculty/year'
            });
        }

        const learningSite = await learningSiteDelegate.create({
            data: {
                title: title.trim(),
                description: description?.trim() || null,
                url: parsedUrl.toString(),
                year: parsedYear,
                facultyId: parsedFacultyId,
                moduleId: parsedModuleId,
                collegeId,
                addedBy: req.user.id
            },
            include: {
                module: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                faculty: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                creator: {
                    select: {
                        id: true,
                        username: true,
                        first_name: true,
                        last_name: true
                    }
                }
            }
        });

        return res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Learning site added successfully',
            data: learningSite
        });
    } catch (error) {
        console.error('Create learning site error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};

export const deleteLearningSite = async (req, res) => {
    try {
        const learningSiteDelegate = getLearningSiteDelegate();
        if (!learningSiteDelegate) {
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: 'Learning Sites is not initialized yet. Run prisma generate and prisma db push, then restart backend.'
            });
        }

        const siteId = parseInt(req.params.id);

        if (Number.isNaN(siteId)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Invalid site ID'
            });
        }

        const existingSite = await learningSiteDelegate.findUnique({
            where: { id: siteId }
        });

        if (!existingSite) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'Learning site not found'
            });
        }

        if (req.user.role === ROLES.COLLEGE_ADMIN && existingSite.collegeId !== req.user.collegeId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                error: ERROR_MESSAGES.COLLEGE_ACCESS_DENIED
            });
        }

        await learningSiteDelegate.delete({
            where: { id: siteId }
        });

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Learning site deleted successfully'
        });
    } catch (error) {
        console.error('Delete learning site error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};
