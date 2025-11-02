import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from '../src/db/index.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
try {
    const envPath = path.resolve(__dirname, '../../.env');
    dotenv.config({ path: envPath });
} catch (error) {
    console.warn("⚠️  Couldn't load .env file, using environment variables");
}

// Create Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    },
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected', socket.id);
    
    socket.on('create-room', (data) => {
        const { user, room } = data;
        socket.join(room);
        io.to(socket.id).emit("room:join", data);
        console.log(`Host ${user.fullname} created room- ${room} and Joined`);
    });

    // Add other socket event handlers here...
    
    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });
});

// Middleware
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
    res.header(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// Import routes
import userRouter from '../src/routes/user.routes.js';
import tweetRouter from '../src/routes/tweet.routes.js';
import problemRouter from '../src/routes/problem.routes.js';
import runcodeRouter from '../src/routes/runcode.route.js';
import submissionRouter from '../src/routes/submission.routes.js';

// Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tweet', tweetRouter);
app.use('/api/v1/problem', problemRouter);
app.use('/api/v1/runcode', runcodeRouter);
app.use('/api/v1/submissions', submissionRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        error: {
            statusCode: 404,
            message: `Cannot ${req.method} ${req.path}`
        }
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { 
            error: err.message,
            stack: err.stack 
        })
    });
});

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 3000;
        
        // Only listen in development or when running locally
        if (process.env.VERCEL !== '1') {
            server.listen(PORT, () => {
                console.log(`🚀 Server is running on port ${PORT}`);
                console.log(`Socket.IO server running on ws://localhost:${PORT}`);
            });
        }
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

// Start the server
startServer();

// Export the Express API for Vercel
export default app;
