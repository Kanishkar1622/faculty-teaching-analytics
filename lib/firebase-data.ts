"use client"

import { useMemo } from "react"
import useSWR, { mutate } from "swr"
import type { Faculty, AttendanceRecord, FeedbackRecord, Subject, SyllabusUpdate, LocationAttendance, CampusConfig, Task, TimetablePeriod, SessionAttendance } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("API error")
    return res.json()
})

function useCollection<T>(
    collectionName: string,
    filters: Record<string, string | number | boolean | undefined> = {}
) {
    const queryString = new URLSearchParams(filters as any).toString()
    const url = `/api/db/${collectionName}${queryString ? `?${queryString}` : ""}`
    
    const { data, error, isLoading } = useSWR<T[]>(url, fetcher, {
        refreshInterval: 10000, // 10 second polling for "real-time" feel
        revalidateOnFocus: true
    })

    return { 
        data: data || [], 
        loading: isLoading, 
        error: error?.message || null 
    }
}

// --- Faculty ---

export function useFaculty() {
    return useCollection<Faculty>("faculty")
}

export function useFacultyById(facultyId: string | null) {
    const url = facultyId ? `/api/db/faculty?id=${facultyId}` : null
    const { data, error, isLoading } = useSWR<Faculty>(url, fetcher)

    return { 
        data: data || null, 
        loading: isLoading,
        error: error?.message || null
    }
}

// --- Attendance ---

export function useAttendance(facultyId?: string) {
    const filters = facultyId ? { facultyId } : {}
    return useCollection<AttendanceRecord>("attendance", filters)
}

// --- Feedback ---

export function useFeedback(facultyId?: string) {
    const filters = facultyId ? { facultyId } : {}
    return useCollection<FeedbackRecord>("feedback", filters)
}

// --- Subjects ---

function normalizeSubject(s: Subject & { facultyId?: string }): Subject {
    if (!s.facultyIds || !Array.isArray(s.facultyIds)) {
        return { ...s, facultyIds: s.facultyId ? [s.facultyId] : [] }
    }
    return s
}

export function useSubjects(facultyId?: string) {
    // Note: MongoDB filtering for 'array-contains' is handled by equality in Mongoose if it's an array field
    const filters = facultyId ? { facultyIds: facultyId } : {}
    const result = useCollection<Subject>("subjects", filters)
    
    const normalized = useMemo(() => {
        const all = result.data.map(s => normalizeSubject(s as any))
        const seen = new Set<string>()
        return all.filter(s => {
            if (seen.has(s.id)) return false
            seen.add(s.id)
            return true
        })
    }, [result.data])
    
    return { data: normalized, loading: result.loading }
}

export function useFacultyAssignedSubjects(facultyId: string | null) {
    const { data: faculty, loading } = useFacultyById(facultyId)
    
    const subjects = useMemo(() => {
        if (!faculty) return []
        const assigned = faculty.assignedSubjects || []
        return assigned.map((entry: any) => {
            if (typeof entry === "string") {
                return { id: `manual_${entry}`, name: entry }
            }
            return { id: entry.subjectId, name: entry.subjectName }
        })
    }, [faculty])

    return { data: subjects, loading }
}

export async function syncAssignedSubjectsOnFacultyDocs(
    subjectId: string,
    subjectName: string,
    oldFacultyIds: string[],
    newFacultyIds: string[]
) {
    const entry = { subjectId, subjectName }
    const toAdd = newFacultyIds.filter(id => !oldFacultyIds.includes(id))
    const toRemove = oldFacultyIds.filter(id => !newFacultyIds.includes(id))

    const promises: Promise<any>[] = []

    for (const fid of toAdd) {
        promises.push(
            fetch(`/api/db/faculty?id=${fid}`).then(r => r.json()).then(async (faculty) => {
                if (!faculty) return
                const existing = faculty.assignedSubjects || []
                const filtered = existing.filter((e: any) => e.subjectId !== subjectId)
                filtered.push(entry)
                return fetch(`/api/db/faculty?id=${fid}`, {
                    method: "PUT",
                    body: JSON.stringify({ assignedSubjects: filtered })
                })
            })
        )
    }

    for (const fid of toRemove) {
        promises.push(
            fetch(`/api/db/faculty?id=${fid}`).then(r => r.json()).then(async (faculty) => {
                if (!faculty) return
                const existing = faculty.assignedSubjects || []
                const filtered = existing.filter((e: any) => e.subjectId !== subjectId)
                return fetch(`/api/db/faculty?id=${fid}`, {
                    method: "PUT",
                    body: JSON.stringify({ assignedSubjects: filtered })
                })
            })
        )
    }

    await Promise.all(promises)
    mutate("/api/db/faculty")
}

export function useFacultySubjectsMap() {
    const { data: facultyList, loading: loadingFaculty } = useFaculty()
    const { data: subjects, loading: loadingSubjects } = useSubjects()
    
    const map = useMemo(() => {
        const m: Record<string, { id: string; name: string }[]> = {}

        for (const s of subjects) {
            const ids = s.facultyIds || []
            for (const fid of ids) {
                if (!m[fid]) m[fid] = []
                if (!m[fid].some(x => x.id === s.id)) {
                    m[fid].push({ id: s.id, name: s.name })
                }
            }
        }

        for (const f of facultyList) {
            if (!m[f.id]) m[f.id] = []
            if (f.assignedSubjects && f.assignedSubjects.length > 0) {
                for (const entry of f.assignedSubjects) {
                    if (typeof entry === "string") {
                        if (!m[f.id].some(x => x.name === entry)) {
                            m[f.id].push({ id: `manual_${entry}`, name: entry })
                        }
                    } else {
                        if (!m[f.id].some(x => x.id === entry.subjectId)) {
                            m[f.id].push({ id: entry.subjectId, name: entry.subjectName })
                        }
                    }
                }
            }
        }

        return m
    }, [subjects, facultyList])
    
    return { data: map, loading: loadingFaculty || loadingSubjects }
}

export async function addSubject(subject: Omit<Subject, "id">) {
    // Check for duplicate
    const checkRes = await fetch(`/api/db/subjects?name=${encodeURIComponent(subject.name)}&department=${encodeURIComponent(subject.department)}`)
    const existing = await checkRes.json()
    if (existing && existing.length > 0) {
        throw new Error(`Subject "${subject.name}" already exists in ${subject.department}`)
    }

    const res = await fetch("/api/db/subjects", {
        method: "POST",
        body: JSON.stringify(subject)
    })
    const data = await res.json()
    mutate("/api/db/subjects")
    return data.id
}

export async function updateSubject(id: string, data: Partial<Subject>) {
    await fetch(`/api/db/subjects?id=${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    })
    mutate("/api/db/subjects")
}

export async function deleteSubject(id: string) {
    await fetch(`/api/db/subjects?id=${id}`, { method: "DELETE" })
    mutate("/api/db/subjects")
}

// --- Departments ---

const FIXED_DEPARTMENTS = ["Computer Science", "Mathematics", "Physics", "English", "Chemistry"]

export function useDepartments() {
    const { data: faculty, loading } = useFaculty()
    const dynamicDepts = faculty.map((f) => f.department).filter(Boolean)
    const departments = [...new Set([...FIXED_DEPARTMENTS, ...dynamicDepts])].sort()
    return { data: departments, loading }
}

// --- CRUD operations ---

export async function getUserUidByEmail(email: string): Promise<string | null> {
    const res = await fetch(`/api/db/users?email=${encodeURIComponent(email)}`)
    const data = await res.json()
    if (data && data.length > 0) {
        return data[0].uid || data[0].id
    }
    return null
}

export async function addFaculty(faculty: Omit<Faculty, "id">) {
    const res = await fetch("/api/db/faculty", {
        method: "POST",
        body: JSON.stringify(faculty)
    })
    const data = await res.json()
    mutate("/api/db/faculty")
    return data.id
}

export async function updateFaculty(id: string, data: Partial<Faculty>) {
    await fetch(`/api/db/faculty?id=${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    })
    mutate("/api/db/faculty")
    mutate(`/api/db/faculty?id=${id}`)
}

export async function syncFacultySubjects(facultyId: string, oldSubjectIds: string[], newSubjectIds: string[]) {
    const toAdd = newSubjectIds.filter(id => !oldSubjectIds.includes(id))
    const toRemove = oldSubjectIds.filter(id => !newSubjectIds.includes(id))

    for (const subId of toAdd) {
        const subRes = await fetch(`/api/db/subjects?id=${subId}`)
        const sub = await subRes.json()
        const fids = sub.facultyIds || []
        if (!fids.includes(facultyId)) {
            await updateSubject(subId, { facultyIds: [...fids, facultyId] })
        }
    }
    for (const subId of toRemove) {
        const subRes = await fetch(`/api/db/subjects?id=${subId}`)
        const sub = await subRes.json()
        const fids = sub.facultyIds || []
        await updateSubject(subId, { facultyIds: fids.filter((id: string) => id !== facultyId) })
    }
}

export async function deleteFaculty(id: string) {
    await fetch(`/api/db/faculty?id=${id}`, { method: "DELETE" })
    mutate("/api/db/faculty")
}

export async function addFeedbackRecord(feedback: Omit<FeedbackRecord, "id">) {
    const res = await fetch("/api/db/feedback", {
        method: "POST",
        body: JSON.stringify(feedback)
    })
    const data = await res.json()
    mutate("/api/db/feedback")
    return data.id
}

export async function addAttendanceRecord(record: AttendanceRecord) {
    await fetch("/api/db/attendance", {
        method: "POST",
        body: JSON.stringify(record)
    })
    mutate("/api/db/attendance")
}

// --- Syllabus Updates ---

export function useSyllabusUpdates(facultyId?: string, subjectId?: string) {
    const filters: any = {}
    if (facultyId) filters.facultyId = facultyId
    if (subjectId) filters.subjectId = subjectId
    return useCollection<SyllabusUpdate>("syllabusUpdates", filters)
}

export function useSubjectProgress(facultyId: string | null, subjectId: string | null) {
    const { data: updates, loading } = useSyllabusUpdates(facultyId || undefined, subjectId || undefined)
    const progress = useMemo(() => {
        if (!updates.length) return { completed: 0, logs: [] }
        const completed = updates.reduce((sum, u) => sum + u.hoursCovered, 0)
        return { completed, logs: updates }
    }, [updates])
    return { ...progress, loading }
}

export async function submitSyllabusUpdate(
    subjectId: string,
    hoursCovered: number,
    topicsCovered: string,
    facultyId: string,
    facultyName: string,
    subjectName: string,
    currentCompleted: number,
    totalHours: number
) {
    const newLogEntry = {
        facultyId,
        facultyName,
        subjectId,
        subjectName,
        hoursCovered,
        topicsCovered,
        date: new Date().toISOString().split("T")[0],
        totalHours,
        createdAt: new Date().toISOString()
    }
    
    await fetch("/api/db/syllabusUpdates", {
        method: "POST",
        body: JSON.stringify(newLogEntry)
    })

    const logsRes = await fetch(`/api/db/syllabusUpdates?subjectId=${subjectId}`)
    const logs = await logsRes.json()
    let totalCompleted = 0
    logs.forEach((log: any) => { totalCompleted += log.hoursCovered || 0 })
    const newCompleted = Math.min(totalCompleted, totalHours)

    await updateSubject(subjectId, { completedHours: newCompleted })

    // Recalculate faculty completion
    const subjectsRes = await fetch(`/api/db/subjects?facultyIds=${facultyId}`)
    const subjects = await subjectsRes.json()
    let facultyTotalH = 0
    const assignedIds: string[] = []
    subjects.forEach((s: any) => {
        facultyTotalH += s.totalHours || 0
        assignedIds.push(s.id)
    })

    const facultyLogsRes = await fetch(`/api/db/syllabusUpdates?facultyId=${facultyId}`)
    const facultyLogs = await facultyLogsRes.json()
    let facultyCompletedH = 0
    facultyLogs.forEach((l: any) => {
        if (assignedIds.includes(l.subjectId)) {
            facultyCompletedH += l.hoursCovered || 0
        }
    })

    const pct = facultyTotalH > 0 ? Math.round((facultyCompletedH / facultyTotalH) * 100) : 0
    await updateFaculty(facultyId, { syllabusCompletion: pct })

    mutate("/api/db/syllabusUpdates")
    return newCompleted
}

// --- Location Attendance ---

export function useLocationAttendance(facultyId?: string) {
    const filters = facultyId ? { facultyId } : {}
    return useCollection<LocationAttendance>("locationAttendance", filters)
}

export function useSessionAttendance(facultyId?: string, date?: string) {
    const filters: any = {}
    if (facultyId) filters.facultyId = facultyId
    if (date) filters.date = date
    return useCollection<SessionAttendance>("sessionAttendance", filters)
}

export function useCampusConfig() {
    const { data, error, isLoading } = useSWR("/api/db/settings?key=campus", fetcher)
    const config = data && data.length > 0 ? data[0].value : {
        latitude: 11.49556635735395,
        longitude: 77.2788143157023,
        radiusMeters: 500,
        name: "Main Campus",
        boundary: [],
    }
    return { config, loading: isLoading }
}

export async function markLocationAttendance(record: Omit<LocationAttendance, "id">) {
    await fetch("/api/db/locationAttendance", {
        method: "POST",
        body: JSON.stringify(record)
    })
    mutate("/api/db/locationAttendance")
}

export async function markSessionAbsent(data: {
    facultyId: string
    facultyName: string
    date: string
    session: "Morning" | "Afternoon"
}) {
    const checkRes = await fetch(`/api/db/sessionAttendance?facultyId=${data.facultyId}&date=${data.date}&session=${data.session}`)
    const existing = await checkRes.json()
    if (existing && existing.length > 0) return { skipped: true }

    const record = {
        ...data,
        status: "Absent",
        latitude: 0,
        longitude: 0,
        timestamp: new Date().toISOString(),
        distanceFromCampus: 0,
        autoAbsent: true,
    }

    await fetch("/api/db/sessionAttendance", {
        method: "POST",
        body: JSON.stringify(record)
    })

    // Update faculty session metrics
    const facRes = await fetch(`/api/db/faculty?id=${data.facultyId}`)
    const f = await facRes.json()
    if (f) {
        const isMorning = data.session === "Morning"
        const updates: any = {}
        if (isMorning) {
            const assigned = (f.morningSessionsAssigned || 0) + 1
            updates.morningSessionsAssigned = assigned
            updates.morningAttendancePercent = assigned > 0 ? Math.round((f.morningSessionsPresent || 0) / assigned * 100) : 0
        } else {
            const assigned = (f.afternoonSessionsAssigned || 0) + 1
            updates.afternoonSessionsAssigned = assigned
            updates.afternoonAttendancePercent = assigned > 0 ? Math.round((f.afternoonSessionsPresent || 0) / assigned * 100) : 0
        }
        
        updates.todayMorningPresent = isMorning ? 0 : (f.todayMorningPresent || 0)
        updates.todayAfternoonPresent = !isMorning ? 0 : (f.todayAfternoonPresent || 0)
        updates.todayDate = data.date
        updates.attendancePercent = Math.round(((updates.todayMorningPresent + updates.todayAfternoonPresent) / 2) * 100)
        await updateFaculty(data.facultyId, updates)
    }

    mutate("/api/db/sessionAttendance")
    return { skipped: false, status: "Absent", autoAbsent: true }
}

export async function markSessionAttendance(data: any) {
    const { isPointInPolygon, getDistanceMeters } = await import("@/lib/geolocation")
    
    const isWithinSessionWindow = (session: string) => {
        const now = new Date(); const hh = now.getHours().toString().padStart(2, "0"); const mm = now.getMinutes().toString().padStart(2, "0");
        const current = `${hh}:${mm}`
        const windows: any = { Morning: { s: "08:00", e: "08:45" }, Afternoon: { s: "12:00", e: "12:45" } }
        return current >= windows[session].s && current <= windows[session].e
    }

    const withinWindow = isWithinSessionWindow(data.session)
    const timeStatus = withinWindow ? data.status : "Absent"
    let isInside = false; let distance = 0
    
    if (data.campusConfig.boundary && data.campusConfig.boundary.length >= 3) {
        isInside = isPointInPolygon({ latitude: data.latitude, longitude: data.longitude }, data.campusConfig.boundary)
    } else {
        distance = getDistanceMeters({ latitude: data.latitude, longitude: data.longitude }, { latitude: data.campusConfig.latitude, longitude: data.campusConfig.longitude })
        isInside = distance <= data.campusConfig.radiusMeters
    }

    const finalStatus = timeStatus === "Present" && !isInside ? "Invalid" : timeStatus
    const record = { ...data, status: finalStatus, timestamp: new Date().toISOString(), distanceFromCampus: distance }
    delete record.campusConfig

    await fetch("/api/db/sessionAttendance", { method: "POST", body: JSON.stringify(record) })

    if (finalStatus !== "Invalid") {
        const facRes = await fetch(`/api/db/faculty?id=${data.facultyId}`); const f = await facRes.json()
        if (f) {
            const isMorning = data.session === "Morning"; const updates: any = {}
            let mA = f.morningSessionsAssigned || 0; let mP = f.morningSessionsPresent || 0
            let aA = f.afternoonSessionsAssigned || 0; let aP = f.afternoonSessionsPresent || 0

            if (isMorning) { mA += 1; mP += (finalStatus === "Present" ? 1 : 0); updates.morningSessionsAssigned = mA; updates.morningSessionsPresent = mP; updates.morningAttendancePercent = mA > 0 ? Math.round((mP / mA) * 100) : 0 }
            else { aA += 1; aP += (finalStatus === "Present" ? 1 : 0); updates.afternoonSessionsAssigned = aA; updates.afternoonSessionsPresent = aP; updates.afternoonAttendancePercent = aA > 0 ? Math.round((aP / aA) * 100) : 0 }

            updates.todayMorningPresent = isMorning ? (finalStatus === "Present" ? 1 : 0) : (f.todayMorningPresent || 0)
            updates.todayAfternoonPresent = !isMorning ? (finalStatus === "Present" ? 1 : 0) : (f.todayAfternoonPresent || 0)
            updates.todayDate = data.date
            updates.attendancePercent = Math.round(((updates.todayMorningPresent + updates.todayAfternoonPresent) / 2) * 100)
            await updateFaculty(data.facultyId, updates)
        }
    }
    mutate("/api/db/sessionAttendance")
    return { success: true, status: finalStatus, isInside, withinWindow }
}

export async function saveCampusConfig(config: CampusConfig) {
    const checkRes = await fetch("/api/db/settings?key=campus")
    const existing = await checkRes.json()
    if (existing && existing.length > 0) {
        await fetch(`/api/db/settings?id=${existing[0].id}`, { method: "PUT", body: JSON.stringify({ value: config }) })
    } else {
        await fetch("/api/db/settings", { method: "POST", body: JSON.stringify({ key: "campus", value: config }) })
    }
    mutate("/api/db/settings?key=campus")
}

// --- Timetable ---

export function useTimetable(facultyId?: string) {
    const filters = facultyId ? { facultyId } : {}
    return useCollection<TimetablePeriod>("timetables", filters)
}

export async function saveTimetablePeriods(day: string, periods: Omit<TimetablePeriod, "id">[]) {
    await fetch(`/api/db/timetables?day=${day}&deleteMany=true`, { method: "DELETE" })
    await fetch("/api/db/timetables", { method: "POST", body: JSON.stringify(periods) })
    mutate("/api/db/timetables")
}

export async function deleteTimetablePeriodsForDay(day: string) {
    await fetch(`/api/db/timetables?day=${day}&deleteMany=true`, { method: "DELETE" })
    mutate("/api/db/timetables")
}

export async function assignFacultyToTimetablePeriod(assignment: any) {
    const conflictRes = await fetch(`/api/db/timetables?day=${assignment.day}&periodNumber=${assignment.periodNumber}&facultyId=${assignment.facultyId}&type=period`)
    const conflicts = await conflictRes.json()
    if (conflicts && conflicts.length > 0) throw new Error(`Faculty already has a class assigned on ${assignment.day} Period ${assignment.periodNumber}.`)

    if (assignment.classroom && assignment.classroom.trim() !== "") {
        const roomRes = await fetch(`/api/db/timetables?day=${assignment.day}&periodNumber=${assignment.periodNumber}&classroom=${assignment.classroom}&type=period`)
        const roomConflicts = await roomRes.json()
        if (roomConflicts && roomConflicts.length > 0) throw new Error(`Classroom ${assignment.classroom} is already booked on ${assignment.day} Period ${assignment.periodNumber}.`)
    }

    const res = await fetch("/api/db/timetables", { method: "POST", body: JSON.stringify({ ...assignment, type: "period", label: `Period ${assignment.periodNumber}` }) })
    mutate("/api/db/timetables")
    return res.json()
}

// --- Tasks ---

export function useTasks(facultyId?: string) {
    const filters = facultyId ? { facultyId } : {}
    return useCollection<Task>("tasks", filters)
}

export function useStudentTasks(studentId: string) {
    // MongoDB $in query for array field is handled by useCollection if we use it correctly
    // However, our [collection]/route.ts handles simple equality.
    // For assignedStudentIds: [id], it works as equality if the field is an array.
    return useCollection<Task>("tasks", { assignedStudentIds: studentId })
}

export async function addTask(task: Omit<Task, "id">) {
    const res = await fetch("/api/db/tasks", { method: "POST", body: JSON.stringify(task) })
    mutate("/api/db/tasks")
    return res.json()
}

export async function uploadTaskPDF(taskId: string, file: File) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("taskId", taskId)

    const res = await fetch("/api/upload-task-pdf", {
        method: "POST",
        body: formData
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Upload failed")
    }

    const data = await res.json()
    return data.url
}

export async function submitTask(taskId: string, pdfURL: string) {
    await fetch(`/api/db/tasks?id=${taskId}`, {
        method: "PUT",
        body: JSON.stringify({
            pdfURL,
            status: "submitted",
            submittedAt: new Date().toISOString()
        })
    })
    mutate("/api/db/tasks")
}

export async function updateTask(id: string, data: Partial<Task>) {
    await fetch(`/api/db/tasks?id=${id}`, { method: "PUT", body: JSON.stringify(data) })
    mutate("/api/db/tasks")
}

export async function deleteTask(id: string) {
    await fetch(`/api/db/tasks?id=${id}`, { method: "DELETE" })
    mutate("/api/db/tasks")
}

// Helper for auth creation (maintained for backward compatibility)
export async function createFacultyWithAuth(faculty: Omit<Faculty, "id">, password: string) {
    const facultyId = await addFaculty(faculty)
    if (!facultyId) throw new Error("Failed to create faculty record")

    const res = await fetch("/api/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: faculty.email,
            password: password,
            displayName: faculty.name,
            createIfMissing: true,
        }),
    })
    const data = await res.json()
    if (res.ok && data.uid) {
        await updateFaculty(facultyId, { userId: data.uid })
        await fetch("/api/db/users", {
            method: "POST",
            body: JSON.stringify({ uid: data.uid, name: faculty.name, email: faculty.email, role: "faculty", facultyId })
        })
    }
    return facultyId
}
