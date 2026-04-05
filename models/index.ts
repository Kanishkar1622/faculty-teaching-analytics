import mongoose, { Schema } from "mongoose"

// -----------------------------------------------------------------------------
// MODELS DEFINITIONS
// -----------------------------------------------------------------------------

const transformConfig = {
    transform: (doc: any, ret: any) => {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
    }
}

// --- Faculty ---
export const Faculty = mongoose.models.Faculty || mongoose.model("Faculty", new Schema({
    _id: { type: String, required: true },
    userId: { type: String, required: false },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    subjectIds: [{ type: String }],
    assignedSubjects: [{
        subjectId: String,
        subjectName: String
    }],
    experience: { type: Number, default: 0 },
    attendancePercent: { type: Number, default: 0 },
    feedbackScore: { type: Number, default: 0 },
    performanceScore: { type: Number, default: 0 },
    lectureHours: { type: Number, default: 0 },
    syllabusCompletion: { type: Number, default: 0 },
    morningSessionsAssigned: { type: Number, default: 0 },
    morningSessionsPresent: { type: Number, default: 0 },
    morningAttendancePercent: { type: Number, default: 0 },
    afternoonSessionsAssigned: { type: Number, default: 0 },
    afternoonSessionsPresent: { type: Number, default: 0 },
    afternoonAttendancePercent: { type: Number, default: 0 },
}, { timestamps: true, collection: 'faculty' }).set('toJSON', transformConfig))

// --- Subject ---
export const Subject = mongoose.models.Subject || mongoose.model("Subject", new Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    facultyIds: [{ type: String }],
    totalHours: { type: Number, required: true },
    completedHours: { type: Number, default: 0 },
}, { timestamps: true, collection: 'subjects' }).set('toJSON', transformConfig))

// --- Attendance (Historical) ---
export const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", new Schema({
    _id: { type: String, required: true },
    month: { type: String, required: true },
    facultyId: { type: String, required: true },
    percent: { type: Number, required: true },
}, { timestamps: true, collection: 'attendance' }).set('toJSON', transformConfig))

// --- LocationAttendance (Live/Detailed) ---
export const LocationAttendance = mongoose.models.LocationAttendance || mongoose.model("LocationAttendance", new Schema({
    _id: { type: String, required: true },
    facultyId: { type: String, required: true },
    facultyName: { type: String, required: true },
    subjectId: { type: String, required: true },
    subjectName: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    distanceFromCampus: { type: Number, required: true },
    status: { type: String, enum: ["present", "absent", "rejected"], required: true },
    timeSlot: { type: String },
    classSection: { type: String }
}, { timestamps: true, collection: 'locationAttendance' }).set('toJSON', transformConfig))

// --- SessionAttendance (Morning/Afternoon) ---
export const SessionAttendance = mongoose.models.SessionAttendance || mongoose.model("SessionAttendance", new Schema({
    _id: { type: String, required: true },
    facultyId: { type: String, required: true },
    facultyName: { type: String, required: true },
    date: { type: String, required: true },
    session: { type: String, enum: ["Morning", "Afternoon"], required: true },
    status: { type: String, enum: ["Present", "Absent", "Invalid"], required: true },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    timestamp: { type: String, required: true },
    distanceFromCampus: { type: Number, default: 0 }
}, { timestamps: true, collection: 'sessionAttendance' }).set('toJSON', transformConfig))

// --- Feedback ---
export const Feedback = mongoose.models.Feedback || mongoose.model("Feedback", new Schema({
    _id: { type: String, required: true },
    facultyId: { type: String, required: true },
    studentName: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    date: { type: String, required: true },
    subject: { type: String, required: true }
}, { timestamps: true, collection: 'feedback' }).set('toJSON', transformConfig))

// --- SyllabusUpdate ---
export const SyllabusUpdate = mongoose.models.SyllabusUpdate || mongoose.model("SyllabusUpdate", new Schema({
    _id: { type: String, required: true },
    facultyId: { type: String, required: true },
    facultyName: { type: String, required: true },
    subjectId: { type: String, required: true },
    subjectName: { type: String, required: true },
    hoursCovered: { type: Number, required: true },
    topicsCovered: { type: String, required: true },
    date: { type: String, required: true },
    completedHoursAfter: { type: Number },
    totalHours: { type: Number, required: true }
}, { timestamps: true, collection: 'syllabusUpdates' }).set('toJSON', transformConfig))

// --- Timetable ---
export const Timetable = mongoose.models.Timetable || mongoose.model("Timetable", new Schema({
    _id: { type: String, required: true },
    day: { type: String, required: true },
    periodNumber: { type: Number, required: true },
    type: { type: String, enum: ["period", "break", "lunch"], required: true },
    label: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    facultyId: { type: String, default: null },
    facultyName: { type: String, default: "" },
    subjectId: { type: String, default: "" },
    subject: { type: String, default: "" },
    department: { type: String },
    section: { type: String },
    classSection: { type: String, default: "" },
    classroom: { type: String, default: "" }
}, { timestamps: true, collection: 'timetables' }).set('toJSON', transformConfig))

// --- Task ---
export const Task = mongoose.models.Task || mongoose.model("Task", new Schema({
    _id: { type: String, required: true },
    taskType: { type: String, required: true },
    subjectId: { type: String, required: true },
    subjectName: { type: String, required: true },
    facultyId: { type: String, required: true },
    facultyName: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: String, required: true },
    status: { type: String, required: true },
    assignedStudentIds: [{ type: String }],
    attachments: [{
        name: String,
        url: String,
        uploadedAt: String
    }],
    createdAt: { type: String, required: true },
    completedAt: { type: String, default: null },
    pdfURL: { type: String },
    submittedAt: { type: String, default: null }
}, { timestamps: true, collection: 'tasks' }).set('toJSON', transformConfig))

// --- User ---
export const User = mongoose.models.User || mongoose.model("User", new Schema({
    _id: { type: String, required: true },
    uid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    facultyId: { type: String },
    photoURL: { type: String }
}, { timestamps: true, collection: 'users' }).set('toJSON', transformConfig))

// --- Settings ---
export const Settings = mongoose.models.Settings || mongoose.model("Settings", new Schema({
    _id: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true }
}, { timestamps: true, collection: 'settings' }).set('toJSON', transformConfig))

// --- StoredFile (for PDFs) ---
export const StoredFile = mongoose.models.StoredFile || mongoose.model("StoredFile", new Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
}, { timestamps: true, collection: 'files' }))

// -----------------------------------------------------------------------------
// DEFAULT EXPORTS (for backward compatibility)
// -----------------------------------------------------------------------------

export default {
    Faculty,
    Subject,
    Attendance,
    LocationAttendance,
    SessionAttendance,
    Feedback,
    SyllabusUpdate,
    Timetable,
    Task,
    User,
    Settings
}
