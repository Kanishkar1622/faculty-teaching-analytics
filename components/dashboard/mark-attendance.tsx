"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useFacultyById, useFacultyAssignedSubjects, useLocationAttendance, useCampusConfig, markLocationAttendance, useTimetable, useSessionAttendance, markSessionAttendance, markSessionAbsent } from "@/lib/api-service"
import { getCurrentPosition, isPointInPolygon, getDistanceToPolygon, getDistanceMeters, getPolygonCenter } from "@/lib/geolocation"
import { MapPin, CheckCircle2, XCircle, Loader2, Clock, BarChart3 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"

const chartConfig = {
    count: { label: "Attendance", color: "hsl(var(--chart-1))" },
}

export function MarkAttendance() {
    const { getFacultyId } = useAuth()
    const facultyId = getFacultyId()
    const { data: faculty, loading: loadingFaculty } = useFacultyById(facultyId)
    const { data: subjects, loading: loadingSubjects } = useFacultyAssignedSubjects(facultyId)
    const todayStr = new Date().toISOString().split("T")[0]
    const { data: locationAttendance, loading: loadingLocAttendance } = useLocationAttendance(facultyId || undefined)
    const { data: sessionAttendance, loading: loadingAttendance } = useSessionAttendance(facultyId || undefined, todayStr)
    const { config: campus, loading: loadingCampus } = useCampusConfig()
    const { data: timetable, loading: loadingTimetable } = useTimetable(facultyId || undefined)

    const [locStatus, setLocStatus] = useState<"idle" | "checking" | "inside" | "outside" | "error">("idle")
    const [distance, setDistance] = useState<number | null>(null)
    const [currentPos, setCurrentPos] = useState<{ latitude: number; longitude: number } | null>(null)
    const [errorMsg, setErrorMsg] = useState("")
    const [submitting, setSubmitting] = useState<string | null>(null)
    const [submitted, setSubmitted] = useState(false)

    const loading = loadingFaculty || loadingSubjects || loadingAttendance || loadingLocAttendance || loadingCampus || loadingTimetable

    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const currentDay = DAYS[new Date().getDay()]

    // Determine if faculty is assigned to Morning or Afternoon session based on timetable
    const sessionAssignments = useMemo(() => {
        const morning = timetable.some(p => p.day === currentDay && p.periodNumber <= 4 && p.facultyId === facultyId)
        const afternoon = timetable.some(p => p.day === currentDay && p.periodNumber > 4 && p.facultyId === facultyId)
        return { morning, afternoon }
    }, [timetable, currentDay, facultyId])

    const todayPeriods = useMemo(() => {
        return timetable
            .filter(p => p.day === currentDay && p.type === "period" && p.facultyId === facultyId)
            .sort((a, b) => a.periodNumber - b.periodNumber)
    }, [timetable, currentDay, facultyId])

    const checkLocation = useCallback(async () => {
        if (!campus) return
        setLocStatus("checking")
        setErrorMsg("")
        try {
            const pos = await getCurrentPosition()
            setCurrentPos(pos)

            if (campus.boundary && campus.boundary.length >= 3) {
                const inside = isPointInPolygon(pos, campus.boundary)
                const dist = inside ? 0 : getDistanceToPolygon(pos, campus.boundary)
                setDistance(dist)
                setLocStatus(inside ? "inside" : "outside")
            } else {
                const dist = getDistanceMeters(pos, { latitude: campus.latitude, longitude: campus.longitude })
                setDistance(dist)
                setLocStatus(dist <= campus.radiusMeters ? "inside" : "outside")
            }
        } catch (err) {
            setLocStatus("error")
            setErrorMsg(typeof err === "string" ? err : "Failed to get location")
        }
    }, [campus])

    useEffect(() => {
        if (campus && locStatus === "idle") {
            checkLocation()
        }
    }, [campus, locStatus, checkLocation])

    // Auto-absent: if a session window has already ended and faculty has no record, create Absent automatically.
    useEffect(() => {
        if (!faculty || !facultyId || loading) return

        const now = new Date()
        const hh = now.getHours().toString().padStart(2, "0")
        const mm = now.getMinutes().toString().padStart(2, "0")
        const current = `${hh}:${mm}`

        const WINDOWS = {
            Morning:   { end: "08:45" },
            Afternoon: { end: "12:45" },
        } as const

        const sessions: Array<"Morning" | "Afternoon"> = ["Morning", "Afternoon"]
        sessions.forEach(session => {
            const windowClosed = current > WINDOWS[session].end
            const alreadyMarked = sessionAttendance.some(a => a.session === session)
            if (windowClosed && !alreadyMarked) {
                markSessionAbsent({
                    facultyId,
                    facultyName: faculty.name,
                    date: todayStr,
                    session,
                }).catch(console.error)
            }
        })
    // Only run once when both faculty and session data have loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [faculty, loading, sessionAttendance.length])

    const handleMarkSessionAttendance = async (session: "Morning" | "Afternoon", status: "Present" | "Absent") => {
        if (!faculty || !facultyId || !currentPos || !campus) return

        setErrorMsg("")
        setSubmitting(session)

        try {
            const result = await markSessionAttendance({
                facultyId,
                facultyName: faculty.name,
                date: todayStr,
                session,
                status,
                latitude: currentPos.latitude,
                longitude: currentPos.longitude,
                campusConfig: campus
            })

            if (!result.withinWindow && status === "Present") {
                setErrorMsg(`⏰ Outside marking window — your attendance was recorded as Absent automatically.`)
            } else if (result.status === "Invalid") {
                setErrorMsg(`📍 GPS validation failed — you are outside the campus boundary. Attendance marked as Invalid.`)
            } else {
                setSubmitted(true)
                setTimeout(() => setSubmitted(false), 3000)
            }
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to mark attendance")
        } finally {
            setSubmitting(null)
        }
    }

    const handleMarkSlotAttendance = async (period: any, status: "present" | "absent") => {
        if (!faculty || !facultyId || !currentPos || !campus) return

        setErrorMsg("")
        
        // Use existing validation logic
        let isInside = false
        let dist = 0
        if (campus.boundary && campus.boundary.length >= 3) {
            isInside = isPointInPolygon(currentPos, campus.boundary)
            dist = isInside ? 0 : getDistanceToPolygon(currentPos, campus.boundary)
        } else {
            dist = getDistanceMeters(currentPos, { latitude: campus.latitude, longitude: campus.longitude })
            isInside = dist <= campus.radiusMeters
        }

        if (status === "present" && !isInside) {
            setErrorMsg(`You are ${Math.round(dist)}m outside the campus boundary. Cannot mark present for period.`)
            return
        }

        const center = campus.boundary?.length >= 3
            ? getPolygonCenter(campus.boundary)
            : { latitude: campus.latitude, longitude: campus.longitude }
        const distFromCenter = getDistanceMeters(currentPos, center)

        setSubmitting(period.id)
        try {
            const now = new Date()
            await markLocationAttendance({
                facultyId,
                facultyName: faculty.name,
                subjectId: period.subjectId || "N/A",
                subjectName: period.subject || "N/A",
                date: todayStr,
                time: now.toTimeString().split(" ")[0],
                latitude: currentPos.latitude,
                longitude: currentPos.longitude,
                distanceFromCampus: distFromCenter,
                status,
                timeSlot: period.label,
                classSection: period.classSection || ""
            })
            setSubmitted(true)
            setTimeout(() => setSubmitted(false), 3000)
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to mark period attendance")
        } finally {
            setSubmitting(null)
        }
    }

    // ── Session time-window helpers ────────────────────────────────────────
    const SESSION_WINDOWS = {
        Morning:   { start: "08:00", end: "08:45", label: "08:00 AM – 08:45 AM" },
        Afternoon: { start: "12:00", end: "12:45", label: "12:00 PM – 12:45 PM" },
    } as const

    const getWindowStatus = (sessionId: "Morning" | "Afternoon") => {
        const now = new Date()
        const hh = now.getHours().toString().padStart(2, "0")
        const mm = now.getMinutes().toString().padStart(2, "0")
        const current = `${hh}:${mm}`
        const { start, end } = SESSION_WINDOWS[sessionId]
        const isOpen = current >= start && current <= end
        return { isOpen, current }
    }

    const sessions = [
        {
            id: "Morning" as const,
            title: "Morning Session",
            markingWindow: SESSION_WINDOWS.Morning.label,
            assigned: sessionAssignments.morning,
            ...getWindowStatus("Morning"),
        },
        {
            id: "Afternoon" as const,
            title: "Afternoon Session",
            markingWindow: SESSION_WINDOWS.Afternoon.label,
            assigned: sessionAssignments.afternoon,
            ...getWindowStatus("Afternoon"),
        },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Location Status Card */}
            <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${locStatus === "inside" ? "bg-green-500/10 text-green-500" :
                                locStatus === "outside" ? "bg-red-500/10 text-red-500" :
                                    locStatus === "checking" ? "bg-blue-500/10 text-blue-500" :
                                        "bg-muted text-muted-foreground"
                                } shadow-inner`}>
                                {locStatus === "checking" ? (
                                    <Loader2 className="h-7 w-7 animate-spin" />
                                ) : locStatus === "inside" ? (
                                    <CheckCircle2 className="h-7 w-7" />
                                ) : locStatus === "outside" ? (
                                    <XCircle className="h-7 w-7" />
                                ) : (
                                    <MapPin className="h-7 w-7" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold tracking-tight text-card-foreground">
                                    {locStatus === "checking" ? "Verifying GPS..." :
                                        locStatus === "inside" ? "Inside Campus Boundary" :
                                            locStatus === "outside" ? "Outside Campus Boundary" :
                                                locStatus === "error" ? "Location Error" :
                                                    "Checking Location..."}
                                </h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {locStatus === "inside"
                                        ? `Verified at ${campus?.name || "Campus"}`
                                        : locStatus === "outside" && distance !== null
                                            ? `${distance}m outside boundary. Mark "Absent" or move closer.`
                                            : errorMsg || "Detecting your current coordinates..."}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={checkLocation} disabled={locStatus === "checking"} className="rounded-xl">
                            <MapPin className="mr-2 h-4 w-4" /> Refresh Location
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                {/* Attendance Interface */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    {/* Session Attendance Form */}
                    <Card className="border-border bg-card shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="flex items-center gap-2 text-card-foreground">
                                <Clock className="h-5 w-5 text-primary" /> Session Attendance
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">Main attendance marking for {todayStr}.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            {submitted && (
                                <div className="mb-4 animate-in fade-in slide-in-from-top-2 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-600 dark:text-green-400">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <span className="text-sm font-semibold">Attendance recorded!</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                {sessions.map(session => {
                                    const record = sessionAttendance.find(a => a.session === session.id)
                                    
                                    return (
                                        <div 
                                            key={session.id} 
                                            className={`group relative flex flex-col md:flex-row md:items-center justify-between rounded-2xl border ${session.isOpen ? "border-green-500/30 bg-green-500/5 ring-1 ring-green-500/10" : "border-border/50 bg-background"} p-5 gap-4 transition-all hover:shadow-md`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${session.isOpen ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
                                                    <Clock className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-bold text-card-foreground">{session.title}</h4>
                                                        {session.isOpen ? (
                                                            <Badge className="text-[10px] h-4 uppercase tracking-tighter bg-green-500 text-white">🟢 Window Open</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[10px] h-4 uppercase tracking-tighter text-red-500 border-red-300">🔴 Window Closed</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        Mark window: <span className="font-bold text-foreground">{session.markingWindow}</span>
                                                    </p>
                                                    {!session.isOpen && (
                                                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                                                            Outside window — marking will auto-record as Absent
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 self-end md:self-center">
                                                {record ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <Badge 
                                                            className={`px-4 py-1.5 rounded-lg border-0 ${record.status === "Present" ? "bg-green-500 text-white" : 
                                                                            record.status === "Invalid" ? "bg-orange-500 text-white" : "bg-gray-500 text-white"}`}
                                                        >
                                                            {record.status}
                                                        </Badge>
                                                        <span className="text-[9px] text-muted-foreground">{new Date(record.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-10 px-4 rounded-xl hover:bg-red-500/10 text-red-600"
                                                            onClick={() => handleMarkSessionAttendance(session.id, "Absent")}
                                                            disabled={submitting !== null}
                                                        >
                                                            Mark Absent
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className={`h-10 px-6 rounded-xl font-bold shadow-lg ${session.isOpen && locStatus === "inside" ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20" : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"}`}
                                                            onClick={() => handleMarkSessionAttendance(session.id, "Present")}
                                                            disabled={submitting !== null || locStatus !== "inside"}
                                                            title={!session.isOpen ? "Outside marking window — will be recorded as Absent" : locStatus !== "inside" ? "Must be inside campus to mark Present" : ""}
                                                        >
                                                            {submitting === session.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                                                            {session.isOpen ? "Mark Present" : "Mark (→ Absent)"}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Period-wise Attendance (Legacy Support) */}
                    <Card className="border-border bg-card shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/10 border-b border-border/50">
                            <CardTitle className="flex items-center gap-2 text-card-foreground text-sm font-bold uppercase tracking-wider">
                                <BarChart3 className="h-4 w-4" /> Period-wise Tracking
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {errorMsg && (
                                <div className="mb-4 text-xs font-semibold text-red-500 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                {todayPeriods.length === 0 ? (
                                    <div className="p-8 text-center border-2 border-dashed border-border/30 rounded-2xl">
                                        <p className="text-xs text-muted-foreground">No periods scheduled for today</p>
                                    </div>
                                ) : (
                                    todayPeriods.map(period => {
                                        const record = locationAttendance.find(a => a.date === todayStr && a.timeSlot === period.label)

                                        return (
                                            <div key={period.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-background/50 p-4 hover:bg-muted/20 transition-colors">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px] h-4">{period.label}</Badge>
                                                        <span className="text-sm font-bold text-card-foreground">{period.subject}</span>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {period.startTime} - {period.endTime} • {period.classSection}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    {record ? (
                                                        <Badge 
                                                            variant={record.status === "present" ? "default" : "secondary"}
                                                            className="text-[10px] h-6 px-3 rounded-full"
                                                        >
                                                            {record.status === "present" ? "Marked Present" : "Marked Absent"}
                                                        </Badge>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 text-[10px] px-3 rounded-lg"
                                                                onClick={() => handleMarkSlotAttendance(period, "absent")}
                                                                disabled={submitting !== null}
                                                            >
                                                                Absent
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="h-8 text-[10px] px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white"
                                                                onClick={() => handleMarkSlotAttendance(period, "present")}
                                                                disabled={submitting !== null || locStatus !== "inside"}
                                                            >
                                                                {submitting === period.id ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <CheckCircle2 className="h-3 w-3 mr-1.5" />}
                                                                Present
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Metrics */}
                <Card className="border-border bg-card lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-card-foreground text-base">
                            <BarChart3 className="h-4.5 w-4.5 text-primary" /> Tracking Metrics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        {/* Daily Progress */}
                        <div className="flex flex-col gap-2 rounded-2xl bg-primary/10 p-5 border border-primary/20">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-widest text-primary">Daily Attendance</span>
                                <span className="text-2xl font-black text-primary tracking-tighter">{faculty?.attendancePercent || 0}%</span>
                            </div>
                            <div className="w-full bg-primary/20 overflow-hidden rounded-full h-2">
                                <div className="bg-primary h-full transition-all" style={{ width: `${faculty?.attendancePercent || 0}%` }} />
                            </div>
                            <p className="text-[10px] text-muted-foreground text-right mt-1 font-medium">Derived from session-wise data</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 rounded-2xl bg-muted/40 p-4 border border-border/50">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Morning %</span>
                                <span className="text-xl font-black text-card-foreground text-center tracking-tighter">{faculty?.morningAttendancePercent || 0}%</span>
                            </div>
                            <div className="flex flex-col gap-1 rounded-2xl bg-muted/40 p-4 border border-border/50">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Afternoon %</span>
                                <span className="text-xl font-black text-card-foreground text-center tracking-tighter">{faculty?.afternoonAttendancePercent || 0}%</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Session Logs</h4>
                            <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                {sessionAttendance.length === 0 ? (
                                    <p className="text-[10px] text-muted-foreground text-center py-4">No sessions marked today</p>
                                ) : (
                                    sessionAttendance.map((a: any) => (
                                        <div key={a.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-background/50 p-2 text-[10px]">
                                            <span className="font-bold">{a.session} Session</span>
                                            <Badge variant={a.status === "Present" ? "default" : "secondary"} className="h-4 px-1.5 text-[8px] uppercase">{a.status}</Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Recent Periods</h4>
                            <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                {locationAttendance.length === 0 ? (
                                    <p className="text-[10px] text-muted-foreground text-center py-4">No periods marked today</p>
                                ) : (
                                    [...locationAttendance]
                                        .filter(a => a.date === todayStr)
                                        .sort((a, b) => b.time.localeCompare(a.time))
                                        .map((a) => (
                                            <div key={a.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-background/50 p-2 text-[10px]">
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{a.subjectName}</span>
                                                    <span className="text-[8px] opacity-70">{a.timeSlot}</span>
                                                </div>
                                                <Badge variant={a.status === "present" ? "default" : "outline"} className="h-4 px-1.5 text-[8px] uppercase">{a.status}</Badge>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
