import './config.js';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import { connectDatabase } from './prisma.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

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
