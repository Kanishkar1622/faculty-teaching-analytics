export type Role = "admin" | "faculty" | "student"

export interface UserProfile {
    uid: string
    name: string
    email: string
    role: Role
    facultyId?: string
    photoURL?: string
    department?: string
    regno?: string
}

export interface Faculty {
    id: string
    userId: string
    name: string
    email: string
    department: string
    subjectIds: string[]
    assignedSubjects: { subjectId: string; subjectName: string }[]
    experience: number
    attendancePercent: number
    feedbackScore: number
    performanceScore: number
    lectureHours: number
    syllabusCompletion: number
    // Session-wise metrics
    morningSessionsAssigned?: number
    morningSessionsPresent?: number
    morningAttendancePercent?: number
    afternoonSessionsAssigned?: number
    afternoonSessionsPresent?: number
    afternoonAttendancePercent?: number
}

export interface AttendanceRecord {
    month: string
    facultyId: string
    percent: number
}

export interface FeedbackRecord {
    id: string
    facultyId: string
    studentName: string
    rating: number
    comment: string
    date: string
    subject: string
}

export interface Subject {
    id: string
    name: string
    department: string
    facultyIds: string[]
    totalHours: number
    completedHours: number
}

export interface SyllabusUpdate {
    id: string
    facultyId: string
    facultyName: string
    subjectId: string
    subjectName: string
    hoursCovered: number
    topicsCovered: string
    date: string
    completedHoursAfter: number
    totalHours: number
}

export interface LocationAttendance {
    id: string
    facultyId: string
    facultyName: string
    subjectId: string
    subjectName: string
    date: string
    time: string
    latitude: number
    longitude: number
    distanceFromCampus: number
    status: "present" | "absent" | "rejected"
    timeSlot?: string
    classSection?: string
}

export interface SessionAttendance {
    id: string
    facultyId: string
    facultyName: string
    date: string // YYYY-MM-DD
    session: "Morning" | "Afternoon"
    status: "Present" | "Absent" | "Invalid"
    latitude: number
    longitude: number
    timestamp: string // ISO
    distanceFromCampus?: number
}

export interface CampusConfig {
    latitude: number
    longitude: number
    radiusMeters: number
    name: string
    boundary: { latitude: number; longitude: number }[]
}

export interface TimetablePeriod {
    id: string
    day: string
    periodNumber: number
    type: "period" | "break" | "lunch"
    label: string
    startTime: string
    endTime: string
    facultyId: string | null
    facultyName: string
    subjectId: string
    subject: string
    department?: string
    section?: string
    classSection: string
    classroom: string
}

// --- Task Management ---

export type TaskType = "Create Quiz" | "Grade Assignment" | "Upload Study Material"
export type TaskStatus = "pending" | "in-progress" | "submitted" | "completed" | "overdue"

export interface TaskAttachment {
    name: string
    url: string
    uploadedAt: string
}

export interface Task {
    id: string
    taskType: TaskType
    subjectId: string
    subjectName: string
    facultyId: string
    facultyName: string
    description: string
    deadline: string
    status: TaskStatus
    assignedStudentIds: string[]
    attachments: TaskAttachment[]
    createdAt: string
    completedAt: string | null
    pdfURL?: string
    submittedAt?: string | null
}
