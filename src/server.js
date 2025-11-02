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
const app = createSocketServer();

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
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Handle the request
    return new Promise((resolve, reject) => {
        const { method, url, headers, body } = req;
        const request = { ...req, method, url, headers, body };
        const response = res;
        
        response.on('finish', resolve);
        
        try {
            app(request, response, (err) => {
                if (err) {
                    console.error('Error handling request:', err);
                    if (!response.headersSent) {
                        response.status(500).json({ 
                            success: false, 
                            message: 'Internal Server Error' 
                        });
                    }
                    resolve();
                }
            });
        } catch (error) {
            console.error('Unhandled error:', error);
            if (!response.headersSent) {
                response.status(500).json({ 
                    success: false, 
                    message: 'Internal Server Error' 
                });
            }
            resolve();
        }
    });
};
