import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local")
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null }
}

async function dbConnect() {
    if (cached.conn) {
        console.log("Using cached MongoDB connection")
        return cached.conn
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000, // Reduced to 5s for faster failure
            socketTimeoutMS: 10000,
            family: 4,
            connectTimeoutMS: 5000
        }

        console.log("Connecting to MongoDB Atlas (Timeout: 5s)...")
        cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
            console.log("✅ Successfully connected to MongoDB Cluster")
            return mongooseInstance
        }).catch((err) => {
            console.error("❌ MongoDB Connection Error:", err.message)
            cached.promise = null 
            throw err
        })
    }

    try {
        cached.conn = await cached.promise
    } catch (e: any) {
        cached.promise = null
        throw e
    }

    return cached.conn
}

export default dbConnect
