/**
 * MongoDB Migration Script
 * 
 * Migrates data from Firestore to MongoDB.
 * Run after setting Firestore and MongoDB credentials in .env.local
 */

import admin from "firebase-admin"
import mongoose from "mongoose"
import * as dotenv from "dotenv"
import path from "path"

// Load env vars manually from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { Faculty, Subject, Attendance, SessionAttendance, Feedback, SyllabusUpdate, Timetable, Task, User, Settings } from "../models"

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')
const MONGODB_URI = process.env.MONGODB_URI

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    })
}

const firestore = admin.firestore()

async function migrateCollection(collectionName: string, Model: any) {
    console.log(`\n📦 Migrating ${collectionName}...`)
    const snapshot = await firestore.collection(collectionName).get()
    
    if (snapshot.empty) {
        console.log(`  Empty collection.`)
        return
    }

    const docs = snapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
    }))

    // Clear existing data in MongoDB for this collection to avoid duplicates on retry
    await Model.deleteMany({ _id: { $in: docs.map(d => d._id) } })
    
    await Model.insertMany(docs)
    console.log(`  ✅ Successfully migrated ${docs.length} documents.`)
}

// Special case for settings which might not use doc.id as the key in the same way
async function migrateSettings() {
    console.log(`\n⚙️  Migrating settings...`)
    const snapshot = await firestore.collection("settings").get()
    
    for (const doc of snapshot.docs) {
        const data = doc.data()
        await Settings.findOneAndUpdate(
            { key: doc.id },
            { key: doc.id, value: data },
            { upsert: true, new: true }
        )
    }
    console.log(`  ✅ Successfully migrated settings.`)
}

async function runMigration() {
    console.log("🚀 Starting Database Migration: Firestore -> MongoDB")
    
    try {
        await mongoose.connect(MONGODB_URI!)
        console.log("Connected to MongoDB.")

        await migrateCollection("faculty", Faculty)
        await migrateCollection("subjects", Subject)
        await migrateCollection("attendance", Attendance)
        await migrateCollection("sessionAttendance", SessionAttendance)
        await migrateCollection("feedback", Feedback)
        await migrateCollection("syllabusUpdates", SyllabusUpdate)
        await migrateCollection("timetables", Timetable)
        await migrateCollection("tasks", Task)
        await migrateCollection("users", User)
        await migrateSettings()

        console.log("\n🎉 Migration complete!")
    } catch (error) {
        console.error("\n❌ Migration failed:", error)
    } finally {
        await mongoose.disconnect()
        process.exit(0)
    }
}

runMigration()
