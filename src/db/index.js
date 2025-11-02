import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        console.log('🔑 Environment Variables:', {
            MONGODB_URI: process.env.MONGODB_URI ? 'Found' : 'Missing',
            NODE_ENV: process.env.NODE_ENV || 'development'
        });

        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        const connection = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`\n✅ MongoDB Connected!`);
        console.log(`📁 HOST: ${connection.connection.host}`);
        console.log(`📂 DB NAME: ${connection.connection.name}`);
    } catch (error) {
        console.error('❌ MONGODB CONNECTION FAILED:', error.message);
        process.exit(1);
    }
};

export default connectDB;