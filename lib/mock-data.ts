export type Role = "admin" | "faculty"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  password: string
}

export interface Faculty {
  id: string
  userId: string
  name: string
  email: string
  department: string
  subjectIds: string[]
  experience: number
  attendancePercent: number
  feedbackScore: number
  performanceScore: number
  lectureHours: number
  syllabusCompletion: number
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

export const mockUsers: User[] = [
  { id: "u1", name: "Admin User", email: "admin@college.edu", role: "admin", password: "admin123" },
  { id: "u2", name: "Dr. Sarah Johnson", email: "sarah@college.edu", role: "faculty", password: "faculty123" },
  { id: "u3", name: "Prof. Michael Chen", email: "michael@college.edu", role: "faculty", password: "faculty123" },
  { id: "u4", name: "Dr. Priya Sharma", email: "priya@college.edu", role: "faculty", password: "faculty123" },
  { id: "u5", name: "Prof. James Wilson", email: "james@college.edu", role: "faculty", password: "faculty123" },
  { id: "u6", name: "Dr. Emily Davis", email: "emily@college.edu", role: "faculty", password: "faculty123" },
  { id: "u7", name: "Prof. Robert Taylor", email: "robert@college.edu", role: "faculty", password: "faculty123" },
]

export const mockFaculty: Faculty[] = [
  { id: "f1", userId: "u2", name: "Dr. Sarah Johnson", email: "sarah@college.edu", department: "Computer Science", subjectIds: ["s1", "s2"], experience: 8, attendancePercent: 92, feedbackScore: 4.5, performanceScore: 88, lectureHours: 120, syllabusCompletion: 85 },
  { id: "f2", userId: "u3", name: "Prof. Michael Chen", email: "michael@college.edu", department: "Mathematics", subjectIds: ["s3", "s4"], experience: 12, attendancePercent: 88, feedbackScore: 4.2, performanceScore: 82, lectureHours: 110, syllabusCompletion: 78 },
  { id: "f3", userId: "u4", name: "Dr. Priya Sharma", email: "priya@college.edu", department: "Computer Science", subjectIds: ["s5", "s6"], experience: 6, attendancePercent: 95, feedbackScore: 4.8, performanceScore: 94, lectureHours: 130, syllabusCompletion: 92 },
  { id: "f4", userId: "u5", name: "Prof. James Wilson", email: "james@college.edu", department: "Physics", subjectIds: ["s7", "s8"], experience: 15, attendancePercent: 78, feedbackScore: 3.9, performanceScore: 75, lectureHours: 100, syllabusCompletion: 70 },
  { id: "f5", userId: "u6", name: "Dr. Emily Davis", email: "emily@college.edu", department: "Mathematics", subjectIds: ["s9", "s10"], experience: 10, attendancePercent: 90, feedbackScore: 4.3, performanceScore: 86, lectureHours: 115, syllabusCompletion: 82 },
  { id: "f6", userId: "u7", name: "Prof. Robert Taylor", email: "robert@college.edu", department: "Physics", subjectIds: ["s11", "s12"], experience: 20, attendancePercent: 85, feedbackScore: 4.0, performanceScore: 80, lectureHours: 105, syllabusCompletion: 75 },
]

export const mockAttendance: AttendanceRecord[] = [
  // Dr. Sarah Johnson
  { month: "Sep", facultyId: "f1", percent: 90 },
  { month: "Oct", facultyId: "f1", percent: 92 },
  { month: "Nov", facultyId: "f1", percent: 88 },
  { month: "Dec", facultyId: "f1", percent: 94 },
  { month: "Jan", facultyId: "f1", percent: 96 },
  { month: "Feb", facultyId: "f1", percent: 91 },
  // Prof. Michael Chen
  { month: "Sep", facultyId: "f2", percent: 85 },
  { month: "Oct", facultyId: "f2", percent: 88 },
  { month: "Nov", facultyId: "f2", percent: 90 },
  { month: "Dec", facultyId: "f2", percent: 86 },
  { month: "Jan", facultyId: "f2", percent: 92 },
  { month: "Feb", facultyId: "f2", percent: 89 },
  // Dr. Priya Sharma
  { month: "Sep", facultyId: "f3", percent: 94 },
  { month: "Oct", facultyId: "f3", percent: 96 },
  { month: "Nov", facultyId: "f3", percent: 93 },
  { month: "Dec", facultyId: "f3", percent: 97 },
  { month: "Jan", facultyId: "f3", percent: 95 },
  { month: "Feb", facultyId: "f3", percent: 96 },
  // Prof. James Wilson
  { month: "Sep", facultyId: "f4", percent: 75 },
  { month: "Oct", facultyId: "f4", percent: 78 },
  { month: "Nov", facultyId: "f4", percent: 72 },
  { month: "Dec", facultyId: "f4", percent: 80 },
  { month: "Jan", facultyId: "f4", percent: 82 },
  { month: "Feb", facultyId: "f4", percent: 79 },
  // Dr. Emily Davis
  { month: "Sep", facultyId: "f5", percent: 88 },
  { month: "Oct", facultyId: "f5", percent: 91 },
  { month: "Nov", facultyId: "f5", percent: 89 },
  { month: "Dec", facultyId: "f5", percent: 92 },
  { month: "Jan", facultyId: "f5", percent: 90 },
  { month: "Feb", facultyId: "f5", percent: 93 },
  // Prof. Robert Taylor
  { month: "Sep", facultyId: "f6", percent: 82 },
  { month: "Oct", facultyId: "f6", percent: 85 },
  { month: "Nov", facultyId: "f6", percent: 83 },
  { month: "Dec", facultyId: "f6", percent: 87 },
  { month: "Jan", facultyId: "f6", percent: 88 },
  { month: "Feb", facultyId: "f6", percent: 86 },
]

export const mockFeedback: FeedbackRecord[] = [
  { id: "fb1", facultyId: "f1", studentName: "Alice M.", rating: 5, comment: "Excellent teaching methodology", date: "2025-12-10", subject: "Data Structures" },
  { id: "fb2", facultyId: "f1", studentName: "Bob K.", rating: 4, comment: "Very clear explanations", date: "2025-12-15", subject: "Algorithms" },
  { id: "fb3", facultyId: "f2", studentName: "Carol S.", rating: 4, comment: "Good but could be more engaging", date: "2025-12-08", subject: "Calculus" },
  { id: "fb4", facultyId: "f2", studentName: "David L.", rating: 5, comment: "Amazing problem-solving approach", date: "2025-12-18", subject: "Linear Algebra" },
  { id: "fb5", facultyId: "f3", studentName: "Eve R.", rating: 5, comment: "Best AI course I have attended", date: "2025-11-20", subject: "Machine Learning" },
  { id: "fb6", facultyId: "f3", studentName: "Frank J.", rating: 5, comment: "Very practical and hands-on", date: "2025-12-01", subject: "AI" },
  { id: "fb7", facultyId: "f4", studentName: "Grace H.", rating: 3, comment: "Needs more real-world examples", date: "2025-12-05", subject: "Quantum Mechanics" },
  { id: "fb8", facultyId: "f4", studentName: "Henry P.", rating: 4, comment: "Knowledgeable but fast-paced", date: "2025-12-12", subject: "Thermodynamics" },
  { id: "fb9", facultyId: "f5", studentName: "Ivy T.", rating: 4, comment: "Great at breaking down complex topics", date: "2025-11-25", subject: "Statistics" },
  { id: "fb10", facultyId: "f5", studentName: "Jack W.", rating: 5, comment: "Very helpful during office hours", date: "2025-12-20", subject: "Probability" },
  { id: "fb11", facultyId: "f6", studentName: "Karen B.", rating: 4, comment: "Solid teaching style", date: "2025-12-03", subject: "Classical Mechanics" },
  { id: "fb12", facultyId: "f6", studentName: "Leo N.", rating: 4, comment: "Good, but labs could be better organized", date: "2025-12-14", subject: "Optics" },
]

export const mockSubjects: Subject[] = [
  { id: "s1", name: "Data Structures", department: "Computer Science", facultyIds: ["f1"], totalHours: 60, completedHours: 52 },
  { id: "s2", name: "Algorithms", department: "Computer Science", facultyIds: ["f1"], totalHours: 60, completedHours: 50 },
  { id: "s3", name: "Calculus", department: "Mathematics", facultyIds: ["f2"], totalHours: 55, completedHours: 42 },
  { id: "s4", name: "Linear Algebra", department: "Mathematics", facultyIds: ["f2"], totalHours: 55, completedHours: 44 },
  { id: "s5", name: "Machine Learning", department: "Computer Science", facultyIds: ["f3"], totalHours: 65, completedHours: 60 },
  { id: "s6", name: "AI", department: "Computer Science", facultyIds: ["f3"], totalHours: 65, completedHours: 59 },
  { id: "s7", name: "Quantum Mechanics", department: "Physics", facultyIds: ["f4"], totalHours: 50, completedHours: 35 },
  { id: "s8", name: "Thermodynamics", department: "Physics", facultyIds: ["f4"], totalHours: 50, completedHours: 36 },
  { id: "s9", name: "Statistics", department: "Mathematics", facultyIds: ["f5"], totalHours: 55, completedHours: 46 },
  { id: "s10", name: "Probability", department: "Mathematics", facultyIds: ["f5"], totalHours: 55, completedHours: 44 },
  { id: "s11", name: "Classical Mechanics", department: "Physics", facultyIds: ["f6"], totalHours: 50, completedHours: 38 },
  { id: "s12", name: "Optics", department: "Physics", facultyIds: ["f6"], totalHours: 50, completedHours: 37 },
]

// Helper functions
export function getAverageAttendance(): number {
  const avg = mockFaculty.reduce((sum, f) => sum + f.attendancePercent, 0) / mockFaculty.length
  return Math.round(avg * 10) / 10
}

export function getAverageFeedback(): number {
  const avg = mockFaculty.reduce((sum, f) => sum + f.feedbackScore, 0) / mockFaculty.length
  return Math.round(avg * 10) / 10
}

export function getFacultyAttendance(facultyId: string): AttendanceRecord[] {
  return mockAttendance.filter(a => a.facultyId === facultyId)
}

export function getFacultyFeedback(facultyId: string): FeedbackRecord[] {
  return mockFeedback.filter(f => f.facultyId === facultyId)
}

export function getFacultySubjects(facultyId: string): Subject[] {
  return mockSubjects.filter(s => s.facultyIds.includes(facultyId))
}

export function getDepartments(): string[] {
  return [...new Set(mockFaculty.map(f => f.department))]
}

export function getFacultyByDepartment(department: string): Faculty[] {
  return mockFaculty.filter(f => f.department === department)
}
