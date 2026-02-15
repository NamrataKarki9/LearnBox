import './config.js';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import collegeRoutes from './routes/college.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import moduleRoutes from './routes/module.routes.js';
import mcqRoutes from './routes/mcq.routes.js';
import facultyRoutes from './routes/faculty.routes.js';
import searchRoutes from './routes/search.routes.js';
import summaryRoutes from './routes/summary.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { connectDatabase } from './prisma.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/mcqs', mcqRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'LearnBox Node.js API is running' });
});

// Start server with database connection
async function startServer() {
    try {
        // Test database connection
        const isConnected = await connectDatabase();
        
        if (!isConnected) {
            console.error('⚠️  Server starting without database connection');
        }

        // Load AdminJS after env is configured and db is connected
        const { adminRouter } = await import('./admin.js');
        app.use('/admin', adminRouter);
        
        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export default app;
