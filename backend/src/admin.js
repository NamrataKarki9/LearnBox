import './config.js';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Database, Resource, getModelByName } from '@adminjs/prisma';
import { PrismaClient } from '@prisma/client';

// Create a separate Prisma client for AdminJS (without pg adapter)
const prismaForAdmin = new PrismaClient();

AdminJS.registerAdapter({ Database, Resource });

const adminOptions = {
    resources: [
        {
            resource: { model: getModelByName('User'), client: prismaForAdmin, dmmf: prismaForAdmin._runtimeDataModel },
            options: {
                navigation: { name: 'User Management' },
                properties: {
                    password: { isVisible: false },
                    roles: {
                        isArray: true,
                    }
                },
            },
        },
    ],
    rootPath: '/admin',
    branding: {
        companyName: 'LearnBox Admin',
        withMadeWithLove: false,
    },
};

const admin = new AdminJS(adminOptions);

const adminRouter = AdminJSExpress.buildRouter(admin);

export { admin, adminRouter };
