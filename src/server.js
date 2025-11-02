import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { app } from './app.js';
import { Server } from 'socket.io';

// Get the current file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
try {
    const envPath = path.resolve(__dirname, '../../.env');
    dotenv.config({ path: envPath });
} catch (error) {
    console.warn("⚠️  Couldn't load .env file, using environment variables");
}

import connectDB from "./db/index.js";

// Create HTTP server
const server = http.createServer(app);

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
    // (Keep your existing socket event handlers)
    
    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
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

// Export the server for Vercel
export default async (req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Handle HTTP requests
    return new Promise((resolve) => {
        const { method, url, headers } = req;
        
        // Log request details
        console.log(`[${new Date().toISOString()}] ${method} ${url}`);
        
        // Handle request body
        let body = [];
        req.on('data', chunk => body.push(chunk));
        
        req.on('end', () => {
            try {
                if (body.length > 0) {
                    req.body = JSON.parse(Buffer.concat(body).toString());
                }
                
                const response = {
                    ...res,
                    json: (data) => {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data));
                        resolve();
                    },
                    status: (statusCode) => {
                        res.statusCode = statusCode;
                        return response;
                    },
                    end: (data) => {
                        res.end(data);
                        resolve();
                    }
                };
                
                // Handle the request
                app(req, response, (err) => {
                    if (err) {
                        console.error('Error in request handler:', err);
                        if (!response.headersSent) {
                            response.status(500).json({
                                success: false,
                                message: 'Internal Server Error',
                                ...(process.env.NODE_ENV === 'development' && { error: err.message })
                            });
                        }
                    }
                });
                
            } catch (error) {
                console.error('Error processing request:', error);
                res.statusCode = 500;
                res.end(JSON.stringify({
                    success: false,
                    message: 'Internal Server Error',
                    ...(process.env.NODE_ENV === 'development' && { error: error.message })
                }));
                resolve();
            }
        });
        
        req.on('error', (error) => {
            console.error('Request error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({
                success: false,
                message: 'Internal Server Error'
            }));
            resolve();
        });
    });
};
