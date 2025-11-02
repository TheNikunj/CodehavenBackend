import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

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
import { createSocketServer } from "./SocketIo/SocketIo.js";

// Create server
let app;
try {
    app = createSocketServer();
} catch (error) {
    console.error('❌ Failed to create server:', error);
    process.exit(1);
}

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 3000;
        
        // Only listen in development or when running locally
        if (process.env.VERCEL !== '1') {
            app.listen(PORT, () => {
                console.log(`🚀 Server is running on port ${PORT}`);
            });
        }
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

// Start the server
startServer();

// Export the app for Vercel
export default async (req, res) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        console.log('Handling OPTIONS preflight request');
        return res.status(200).end();
    }

    try {
        // Log request details for debugging
        console.log('Request headers:', JSON.stringify(req.headers, null, 2));
        console.log('Request body:', req.body);
        
        // Create a promise to handle the request
        return new Promise((resolve) => {
            // Create a response handler
            const response = {
                ...res,
                json: (data) => {
                    console.log('Response:', JSON.stringify(data, null, 2));
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                    resolve();
                },
                status: (statusCode) => {
                    console.log(`Status: ${statusCode}`);
                    res.statusCode = statusCode;
                    return response;
                },
                end: (data) => {
                    if (data) console.log('Response data:', data);
                    res.end(data);
                    resolve();
                }
            };

            // Handle the request
            try {
                app(req, response, (err) => {
                    if (err) {
                        console.error('❌ Error in request handler:', err);
                        if (!response.headersSent) {
                            response.status(500).json({ 
                                success: false, 
                                message: 'Internal Server Error',
                                error: process.env.NODE_ENV === 'development' ? err.message : undefined
                            });
                        }
                    }
                });
            } catch (error) {
                console.error('❌ Unhandled error in request handler:', error);
                if (!response.headersSent) {
                    response.status(500).json({ 
                        success: false, 
                        message: 'Internal Server Error',
                        error: process.env.NODE_ENV === 'development' ? error.message : undefined
                    });
                }
            }
        });
    } catch (error) {
        console.error('❌ Fatal error in serverless function:', error);
        if (!res.headersSent) {
            return res.status(500).json({ 
                success: false, 
                message: 'Internal Server Error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};
