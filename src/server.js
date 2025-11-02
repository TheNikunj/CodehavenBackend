import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // ✅ Load env first

import connectDB from "./db/index.js";
import { createSocketServer } from "./SocketIo/SocketIo.js";

// ✅ Debug log to confirm URI loading — remove later
console.log("✅ Loaded Mongo URI:", process.env.MONGODB_URI);

const server = createSocketServer();

connectDB()
    .then(() => {
        const PORT = process.env.PORT || 8000;
        server.listen(PORT, () => {
            console.log(`🚀 APP IS LISTENING ON PORT ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB Connection Failed:", err);
    });
