/**
 * Firestore Seed Script
 * 
 * Seeds your Firestore database with demo data and creates
 * Firebase Auth accounts for demo users.
 * 
 * Usage:
 *   1. Fill in your Firebase config in .env.local
 *   2. Run: npx tsx scripts/seed-firestore.ts
 * 
 * Note: Requires firebase-admin or you can run this in the browser
 * console. This script uses the client SDK approach.
 */

import { initializeApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { getFirestore, doc, setDoc, collection, addDoc } from "firebase/firestore"

// ⚠️ Replace these with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAKnNrv-YsIwBNjAmKTj0EvBc4m4-rN0Dk",
    authDomain: "faculty-analytics-c4773.firebaseapp.com",
    projectId: "faculty-analytics-c4773",
    storageBucket: "faculty-analytics-c4773.firebasestorage.app",
    messagingSenderId: "823861894139",
    appId: "1:823861894139:web:628b31c03a9b26c6b9495e",
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Demo users
const users = [
    { email: "admin@college.edu", password: "admin123", name: "Admin User", role: "admin" as const },
    { email: "sarah@college.edu", password: "faculty123", name: "Dr. Sarah Johnson", role: "faculty" as const, facultyId: "f1" },
    { email: "michael@college.edu", password: "faculty123", name: "Prof. Michael Chen", role: "faculty" as const, facultyId: "f2" },
    { email: "priya@college.edu", password: "faculty123", name: "Dr. Priya Sharma", role: "faculty" as const, facultyId: "f3" },
    { email: "james@college.edu", password: "faculty123", name: "Prof. James Wilson", role: "faculty" as const, facultyId: "f4" },
    { email: "emily@college.edu", password: "faculty123", name: "Dr. Emily Davis", role: "faculty" as const, facultyId: "f5" },
    { email: "robert@college.edu", password: "faculty123", name: "Prof. Robert Taylor", role: "faculty" as const, facultyId: "f6" },
]

const facultyData = [
    { id: "f1", name: "Dr. Sarah Johnson", email: "sarah@college.edu", department: "Computer Science", subjectIds: ["s1", "s2"], experience: 8, attendancePercent: 92, feedbackScore: 4.5, performanceScore: 88, lectureHours: 120, syllabusCompletion: 85 },
    { id: "f2", name: "Prof. Michael Chen", email: "michael@college.edu", department: "Mathematics", subjectIds: ["s3", "s4"], experience: 12, attendancePercent: 88, feedbackScore: 4.2, performanceScore: 82, lectureHours: 110, syllabusCompletion: 78 },
    { id: "f3", name: "Dr. Priya Sharma", email: "priya@college.edu", department: "Computer Science", subjectIds: ["s5", "s6"], experience: 6, attendancePercent: 95, feedbackScore: 4.8, performanceScore: 94, lectureHours: 130, syllabusCompletion: 92 },
    { id: "f4", name: "Prof. James Wilson", email: "james@college.edu", department: "Physics", subjectIds: ["s7", "s8"], experience: 15, attendancePercent: 78, feedbackScore: 3.9, performanceScore: 75, lectureHours: 100, syllabusCompletion: 70 },
    { id: "f5", name: "Dr. Emily Davis", email: "emily@college.edu", department: "Mathematics", subjectIds: ["s9", "s10"], experience: 10, attendancePercent: 90, feedbackScore: 4.3, performanceScore: 86, lectureHours: 115, syllabusCompletion: 82 },
    { id: "f6", name: "Prof. Robert Taylor", email: "robert@college.edu", department: "Physics", subjectIds: ["s11", "s12"], experience: 20, attendancePercent: 85, feedbackScore: 4.0, performanceScore: 80, lectureHours: 105, syllabusCompletion: 75 },
]

const attendanceData = [
    { month: "Sep", facultyId: "f1", percent: 90 }, { month: "Oct", facultyId: "f1", percent: 92 },
    { month: "Nov", facultyId: "f1", percent: 88 }, { month: "Dec", facultyId: "f1", percent: 94 },
    { month: "Jan", facultyId: "f1", percent: 96 }, { month: "Feb", facultyId: "f1", percent: 91 },
    { month: "Sep", facultyId: "f2", percent: 85 }, { month: "Oct", facultyId: "f2", percent: 88 },
    { month: "Nov", facultyId: "f2", percent: 90 }, { month: "Dec", facultyId: "f2", percent: 86 },
    { month: "Jan", facultyId: "f2", percent: 92 }, { month: "Feb", facultyId: "f2", percent: 89 },
    { month: "Sep", facultyId: "f3", percent: 94 }, { month: "Oct", facultyId: "f3", percent: 96 },
    { month: "Nov", facultyId: "f3", percent: 93 }, { month: "Dec", facultyId: "f3", percent: 97 },
    { month: "Jan", facultyId: "f3", percent: 95 }, { month: "Feb", facultyId: "f3", percent: 96 },
    { month: "Sep", facultyId: "f4", percent: 75 }, { month: "Oct", facultyId: "f4", percent: 78 },
    { month: "Nov", facultyId: "f4", percent: 72 }, { month: "Dec", facultyId: "f4", percent: 80 },
    { month: "Jan", facultyId: "f4", percent: 82 }, { month: "Feb", facultyId: "f4", percent: 79 },
    { month: "Sep", facultyId: "f5", percent: 88 }, { month: "Oct", facultyId: "f5", percent: 91 },
    { month: "Nov", facultyId: "f5", percent: 89 }, { month: "Dec", facultyId: "f5", percent: 92 },
    { month: "Jan", facultyId: "f5", percent: 90 }, { month: "Feb", facultyId: "f5", percent: 93 },
    { month: "Sep", facultyId: "f6", percent: 82 }, { month: "Oct", facultyId: "f6", percent: 85 },
    { month: "Nov", facultyId: "f6", percent: 83 }, { month: "Dec", facultyId: "f6", percent: 87 },
    { month: "Jan", facultyId: "f6", percent: 88 }, { month: "Feb", facultyId: "f6", percent: 86 },
]

const feedbackData = [
    { facultyId: "f1", studentName: "Alice M.", rating: 5, comment: "Excellent teaching methodology", date: "2025-12-10", subject: "Data Structures" },
    { facultyId: "f1", studentName: "Bob K.", rating: 4, comment: "Very clear explanations", date: "2025-12-15", subject: "Algorithms" },
    { facultyId: "f2", studentName: "Carol S.", rating: 4, comment: "Good but could be more engaging", date: "2025-12-08", subject: "Calculus" },
    { facultyId: "f2", studentName: "David L.", rating: 5, comment: "Amazing problem-solving approach", date: "2025-12-18", subject: "Linear Algebra" },
    { facultyId: "f3", studentName: "Eve R.", rating: 5, comment: "Best AI course I have attended", date: "2025-11-20", subject: "Machine Learning" },
    { facultyId: "f3", studentName: "Frank J.", rating: 5, comment: "Very practical and hands-on", date: "2025-12-01", subject: "AI" },
    { facultyId: "f4", studentName: "Grace H.", rating: 3, comment: "Needs more real-world examples", date: "2025-12-05", subject: "Quantum Mechanics" },
    { facultyId: "f4", studentName: "Henry P.", rating: 4, comment: "Knowledgeable but fast-paced", date: "2025-12-12", subject: "Thermodynamics" },
    { facultyId: "f5", studentName: "Ivy T.", rating: 4, comment: "Great at breaking down complex topics", date: "2025-11-25", subject: "Statistics" },
    { facultyId: "f5", studentName: "Jack W.", rating: 5, comment: "Very helpful during office hours", date: "2025-12-20", subject: "Probability" },
    { facultyId: "f6", studentName: "Karen B.", rating: 4, comment: "Solid teaching style", date: "2025-12-03", subject: "Classical Mechanics" },
    { facultyId: "f6", studentName: "Leo N.", rating: 4, comment: "Good, but labs could be better organized", date: "2025-12-14", subject: "Optics" },
]

const subjectsData = [
    { id: "s1", name: "Data Structures", department: "Computer Science", facultyIds: ["f1"], totalHours: 60, completedHours: 52 },
    { id: "s2", name: "Algorithms", department: "Computer Science", facultyIds: ["f1", "f3"], totalHours: 60, completedHours: 50 },
    { id: "s3", name: "Calculus", department: "Mathematics", facultyIds: ["f2"], totalHours: 55, completedHours: 42 },
    { id: "s4", name: "Linear Algebra", department: "Mathematics", facultyIds: ["f2", "f5"], totalHours: 55, completedHours: 44 },
    { id: "s5", name: "Machine Learning", department: "Computer Science", facultyIds: ["f3"], totalHours: 65, completedHours: 60 },
    { id: "s6", name: "AI", department: "Computer Science", facultyIds: ["f3"], totalHours: 65, completedHours: 59 },
    { id: "s7", name: "Quantum Mechanics", department: "Physics", facultyIds: ["f4"], totalHours: 50, completedHours: 35 },
    { id: "s8", name: "Thermodynamics", department: "Physics", facultyIds: ["f4", "f6"], totalHours: 50, completedHours: 36 },
    { id: "s9", name: "Statistics", department: "Mathematics", facultyIds: ["f5"], totalHours: 55, completedHours: 46 },
    { id: "s10", name: "Probability", department: "Mathematics", facultyIds: ["f5"], totalHours: 55, completedHours: 44 },
    { id: "s11", name: "Classical Mechanics", department: "Physics", facultyIds: ["f6"], totalHours: 50, completedHours: 38 },
    { id: "s12", name: "Optics", department: "Physics", facultyIds: ["f6"], totalHours: 50, completedHours: 37 },
]

const tasksData = [
    { taskType: "Create Quiz", subjectId: "s1", subjectName: "Data Structures", facultyId: "f1", facultyName: "Dr. Sarah Johnson", description: "Prepare mid-term quiz covering arrays, linked lists, and trees", deadline: "2026-03-05", status: "pending", assignedStudentIds: [], attachments: [], createdAt: "2026-02-20T10:00:00Z", completedAt: null },
    { taskType: "Grade Assignment", subjectId: "s2", subjectName: "Algorithms", facultyId: "f1", facultyName: "Dr. Sarah Johnson", description: "Grade assignment #3 on dynamic programming", deadline: "2026-02-24", status: "completed", assignedStudentIds: [], attachments: [], createdAt: "2026-02-15T09:00:00Z", completedAt: "2026-02-23T14:30:00Z" },
    { taskType: "Upload Study Material", subjectId: "s3", subjectName: "Calculus", facultyId: "f2", facultyName: "Prof. Michael Chen", description: "Upload lecture notes for integration techniques", deadline: "2026-03-01", status: "pending", assignedStudentIds: [], attachments: [], createdAt: "2026-02-18T11:00:00Z", completedAt: null },
    { taskType: "Create Quiz", subjectId: "s5", subjectName: "Machine Learning", facultyId: "f3", facultyName: "Dr. Priya Sharma", description: "Create quiz on supervised learning algorithms", deadline: "2026-02-20", status: "pending", assignedStudentIds: [], attachments: [], createdAt: "2026-02-10T08:00:00Z", completedAt: null },
    { taskType: "Grade Assignment", subjectId: "s7", subjectName: "Quantum Mechanics", facultyId: "f4", facultyName: "Prof. James Wilson", description: "Grade lab reports on wave-particle duality experiment", deadline: "2026-03-10", status: "in-progress", assignedStudentIds: [], attachments: [], createdAt: "2026-02-22T13:00:00Z", completedAt: null },
    { taskType: "Upload Study Material", subjectId: "s9", subjectName: "Statistics", facultyId: "f5", facultyName: "Dr. Emily Davis", description: "Upload solved examples for hypothesis testing", deadline: "2026-03-15", status: "pending", assignedStudentIds: [], attachments: [], createdAt: "2026-02-25T07:00:00Z", completedAt: null },
    { taskType: "Create Quiz", subjectId: "s11", subjectName: "Classical Mechanics", facultyId: "f6", facultyName: "Prof. Robert Taylor", description: "Prepare end-semester quiz covering Newton's laws and rotational dynamics", deadline: "2026-03-20", status: "pending", assignedStudentIds: [], attachments: [], createdAt: "2026-02-24T10:00:00Z", completedAt: null },
    { taskType: "Grade Assignment", subjectId: "s6", subjectName: "AI", facultyId: "f3", facultyName: "Dr. Priya Sharma", description: "Grade neural network implementation project", deadline: "2026-02-28", status: "completed", assignedStudentIds: [], attachments: [], createdAt: "2026-02-12T09:00:00Z", completedAt: "2026-02-27T16:00:00Z" },
]

async function seed() {
    console.log("🌱 Starting Firestore seed...\n")

    // 1. Create auth accounts and user profiles
    console.log("👤 Creating user accounts...")
    for (const user of users) {
        try {
            const cred = await createUserWithEmailAndPassword(auth, user.email, user.password)
            const profile: Record<string, string> = {
                uid: cred.user.uid,
                name: user.name,
                email: user.email,
                role: user.role,
            }
            if ("facultyId" in user && user.facultyId) {
                profile.facultyId = user.facultyId
            }
            await setDoc(doc(db, "users", cred.user.uid), profile)
            console.log(`  ✅ ${user.email} (${user.role})`)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            console.log(`  ⚠️  ${user.email}: ${msg}`)
        }
    }

    // 2. Seed faculty
    console.log("\n📋 Seeding faculty...")
    for (const f of facultyData) {
        const { id, ...data } = f
        await setDoc(doc(db, "faculty", id), { ...data, userId: "" })
        console.log(`  ✅ ${f.name}`)
    }

    // 3. Seed attendance
    console.log("\n📊 Seeding attendance records...")
    for (const a of attendanceData) {
        await addDoc(collection(db, "attendance"), a)
    }
    console.log(`  ✅ ${attendanceData.length} records`)

    // 4. Seed feedback
    console.log("\n💬 Seeding feedback...")
    for (const f of feedbackData) {
        await addDoc(collection(db, "feedback"), f)
    }
    console.log(`  ✅ ${feedbackData.length} records`)

    // 5. Seed subjects (with deterministic IDs)
    console.log("\n📚 Seeding subjects...")
    for (const s of subjectsData) {
        const { id, ...data } = s
        await setDoc(doc(db, "subjects", id), data)
        console.log(`  ✅ ${s.name} (${id})`)
    }

    // 6. Seed tasks
    console.log("\n📋 Seeding tasks...")
    for (const t of tasksData) {
        await addDoc(collection(db, "tasks"), t)
    }
    console.log(`  ✅ ${tasksData.length} records`)

    console.log("\n🎉 Seed complete! Your Firestore is populated with demo data.")
    process.exit(0)
}

seed().catch(err => {
    console.error("Seed failed:", err)
    process.exit(1)
})
