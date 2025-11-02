import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import connectDB from "./db/index.js";
import { createSocketServer } from "./SocketIo/SocketIo.js";

// Create server
const server = createSocketServer();

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 3000;
        
        // Only listen in development or when running locally
        if (process.env.NODE_ENV !== 'production') {
            server.listen(PORT, () => {
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

// Export the server for Vercel
// Vercel will use this as the serverless function
export default (req, res) => {
    // This will be used by Vercel
    server.emit('request', req, res);
};
