import mongoose from "mongoose"
import * as dotenv from "dotenv"
import path from "path"

// Load env vars manually from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { Faculty, Subject, Attendance, Feedback, Task, User, Settings, StoredFile } from "../models"

const MONGODB_URI = process.env.MONGODB_URI

// Demo users
const users = [
    { uid: "admin_uid", email: "admin@college.edu", name: "Admin User", role: "admin" },
    { uid: "f1_uid", email: "sarah@college.edu", name: "Dr. Sarah Johnson", role: "faculty", facultyId: "f1" },
    { uid: "f2_uid", email: "michael@college.edu", name: "Prof. Michael Chen", role: "faculty", facultyId: "f2" },
    { uid: "f3_uid", email: "priya@college.edu", name: "Dr. Priya Sharma", role: "faculty", facultyId: "f3" },
    { uid: "f4_uid", email: "james@college.edu", name: "Prof. James Wilson", role: "faculty", facultyId: "f4" },
    { uid: "f5_uid", email: "emily@college.edu", name: "Dr. Emily Davis", role: "faculty", facultyId: "f5" },
    { uid: "f6_uid", email: "robert@college.edu", name: "Prof. Robert Taylor", role: "faculty", facultyId: "f6" },
]

const facultyData = [
    { _id: "f1", name: "Dr. Sarah Johnson", email: "sarah@college.edu", department: "Computer Science", subjectIds: ["s1", "s2"], experience: 8, attendancePercent: 92, feedbackScore: 4.5, performanceScore: 88, lectureHours: 120, syllabusCompletion: 85, assignedSubjects: [{ subjectId: "s1", subjectName: "Data Structures" }, { subjectId: "s2", subjectName: "Algorithms" }] },
    { _id: "f2", name: "Prof. Michael Chen", email: "michael@college.edu", department: "Mathematics", subjectIds: ["s3", "s4"], experience: 12, attendancePercent: 88, feedbackScore: 4.2, performanceScore: 82, lectureHours: 110, syllabusCompletion: 78, assignedSubjects: [{ subjectId: "s3", subjectName: "Calculus" }, { subjectId: "s4", subjectName: "Linear Algebra" }] },
    { _id: "f3", name: "Dr. Priya Sharma", email: "priya@college.edu", department: "Computer Science", subjectIds: ["s5", "s6"], experience: 6, attendancePercent: 95, feedbackScore: 4.8, performanceScore: 94, lectureHours: 130, syllabusCompletion: 92, assignedSubjects: [{ subjectId: "s5", subjectName: "Machine Learning" }, { subjectId: "s6", subjectName: "AI" }] },
    { _id: "f4", name: "Prof. James Wilson", email: "james@college.edu", department: "Physics", subjectIds: ["s7", "s8"], experience: 15, attendancePercent: 78, feedbackScore: 3.9, performanceScore: 75, lectureHours: 100, syllabusCompletion: 70, assignedSubjects: [{ subjectId: "s7", subjectName: "Quantum Mechanics" }, { subjectId: "s8", subjectName: "Thermodynamics" }] },
    { _id: "f5", name: "Dr. Emily Davis", email: "emily@college.edu", department: "Mathematics", subjectIds: ["s9", "s10"], experience: 10, attendancePercent: 90, feedbackScore: 4.3, performanceScore: 86, lectureHours: 115, syllabusCompletion: 82, assignedSubjects: [{ subjectId: "s9", subjectName: "Statistics" }, { subjectId: "s10", subjectName: "Probability" }] },
    { _id: "f6", name: "Prof. Robert Taylor", email: "robert@college.edu", department: "Physics", subjectIds: ["s11", "s12"], experience: 20, attendancePercent: 85, feedbackScore: 4.0, performanceScore: 80, lectureHours: 105, syllabusCompletion: 75, assignedSubjects: [{ subjectId: "s11", subjectName: "Classical Mechanics" }, { subjectId: "s12", subjectName: "Optics" }] },
]

const attendanceData = [
    { _id: "att1", facultyId: "f1", month: "Sep", percent: 90 }, 
    { _id: "att2", facultyId: "f1", month: "Oct", percent: 92 },
    { _id: "att3", facultyId: "f1", month: "Nov", percent: 88 }, 
    { _id: "att4", facultyId: "f1", month: "Dec", percent: 94 },
    { _id: "att5", facultyId: "f1", month: "Jan", percent: 96 }, 
    { _id: "att6", facultyId: "f1", month: "Feb", percent: 91 },
]

const subjectsData = [
    { _id: "s1", name: "Data Structures", department: "Computer Science", facultyIds: ["f1"], totalHours: 60, completedHours: 52 },
    { _id: "s2", name: "Algorithms", department: "Computer Science", facultyIds: ["f1", "f3"], totalHours: 60, completedHours: 50 },
    { _id: "s3", name: "Calculus", department: "Mathematics", facultyIds: ["f2"], totalHours: 55, completedHours: 42 },
    { _id: "s4", name: "Linear Algebra", department: "Mathematics", facultyIds: ["f2", "f5"], totalHours: 55, completedHours: 44 },
    { _id: "s5", name: "Machine Learning", department: "Computer Science", facultyIds: ["f3"], totalHours: 65, completedHours: 60 },
    { _id: "s6", name: "AI", department: "Computer Science", facultyIds: ["f3"], totalHours: 65, completedHours: 59 },
    { _id: "s7", name: "Quantum Mechanics", department: "Physics", facultyIds: ["f4"], totalHours: 50, completedHours: 35 },
    { _id: "s8", name: "Thermodynamics", department: "Physics", facultyIds: ["f4", "f6"], totalHours: 50, completedHours: 36 },
    { _id: "s9", name: "Statistics", department: "Mathematics", facultyIds: ["f5"], totalHours: 55, completedHours: 46 },
    { _id: "s10", name: "Probability", department: "Mathematics", facultyIds: ["f5"], totalHours: 55, completedHours: 44 },
    { _id: "s11", name: "Classical Mechanics", department: "Physics", facultyIds: ["f6"], totalHours: 50, completedHours: 38 },
    { _id: "s12", name: "Optics", department: "Physics", facultyIds: ["f6"], totalHours: 50, completedHours: 37 },
]

const feedbackData = [
    { _id: "fb1", facultyId: "f1", studentName: "Alice M.", rating: 5, comment: "Excellent teaching methodology", date: "2025-12-10", subject: "Data Structures" },
    { _id: "fb2", facultyId: "f1", studentName: "Bob K.", rating: 4, comment: "Very clear explanations", date: "2025-12-15", subject: "Algorithms" },
]

const tasksData = [
    { _id: "t1", taskType: "Create Quiz", subjectId: "s1", subjectName: "Data Structures", facultyId: "f1", facultyName: "Dr. Sarah Johnson", description: "Prepare mid-term quiz covering arrays, linked lists, and trees", deadline: "2026-03-05", status: "pending", createdAt: new Date().toISOString() },
    { _id: "t2", taskType: "Grade Assignment", subjectId: "s2", subjectName: "Algorithms", facultyId: "f1", facultyName: "Dr. Sarah Johnson", description: "Grade assignment #3 on dynamic programming", deadline: "2026-02-24", status: "completed", createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
]

async function seed() {
    console.log("🌱 Starting MongoDB seed...\n")

    try {
        await mongoose.connect(MONGODB_URI!)
        console.log("Connected to MongoDB.")

        // 1. Clear existing
        console.log("\n🧹 Clearing existing data...")
        await Faculty.deleteMany({})
        await Subject.deleteMany({})
        await Attendance.deleteMany({})
        await Feedback.deleteMany({})
        await Task.deleteMany({})
        await User.deleteMany({})
        await Settings.deleteMany({})
        await StoredFile.deleteMany({})
        console.log("  ✅ Collections cleared.")

        // 2. Users
        console.log("\n👤 Seeding users...")
        await User.insertMany(users.map(u => ({ _id: u.uid, ...u })))
        console.log(`  ✅ Successfully seeded ${users.length} users.`)

        // 3. Faculty
        console.log("\n📋 Seeding faculty...")
        await Faculty.insertMany(facultyData)
        console.log(`  ✅ Successfully seeded ${facultyData.length} faculty members.`)

        // 4. Subjects
        console.log("\n📚 Seeding subjects...")
        await Subject.insertMany(subjectsData)
        console.log(`  ✅ Successfully seeded ${subjectsData.length} subjects.`)

        // 5. Attendance
        console.log("\n📊 Seeding attendance...")
        await Attendance.insertMany(attendanceData)
        console.log(`  ✅ Successfully seeded ${attendanceData.length} attendance records.`)

        // 6. Feedback
        console.log("\n💬 Seeding feedback...")
        await Feedback.insertMany(feedbackData)
        console.log(`  ✅ Successfully seeded ${feedbackData.length} feedback records.`)

        // 7. Tasks
        console.log("\n📋 Seeding tasks...")
        await Task.insertMany(tasksData)
        console.log(`  ✅ Successfully seeded ${tasksData.length} tasks.`)

        // 8. Settings
        console.log("\n⚙️  Seeding campus settings...")
        await Settings.create({ 
            _id: "campus_config",
            key: "campus", 
            value: {
                latitude: 11.49556635735395,
                longitude: 77.2788143157023,
                radiusMeters: 500,
                name: "Main Campus",
                boundary: []
            }
        })
        console.log("  ✅ Successfully seeded settings.")

        console.log("\n🎉 Seed complete! Your MongoDB is populated with demo data.")
    } catch (err) {
        console.error("\n❌ Seed failed:", err)
    } finally {
        await mongoose.disconnect()
        process.exit(0)
    }
}

seed()
