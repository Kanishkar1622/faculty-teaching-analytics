"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFaculty, useTimetable, saveTimetablePeriods, assignFacultyToTimetablePeriod, useDepartments, useSubjects } from "@/lib/api-service"
import type { TimetablePeriod, Subject } from "@/lib/types"
import { Clock, Save, CheckCircle2, Calendar, Coffee, UtensilsCrossed, UserPlus, AlertCircle, Sparkles, ChevronRight, Layout, Search, Filter, Layers, Zap, Users, ShieldCheck, Map as MapIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

interface RowTemplate {
    periodNumber: number
    type: "period" | "break" | "lunch"
    label: string
    startTime: string
    endTime: string
}

const ROW_TEMPLATE: RowTemplate[] = [
    { periodNumber: 1, type: "period", label: "Period 1", startTime: "09:00", endTime: "09:50" },
    { periodNumber: 2, type: "period", label: "Period 2", startTime: "09:50", endTime: "10:40" },
    { periodNumber: 0, type: "break", label: "Short Break", startTime: "10:40", endTime: "10:55" },
    { periodNumber: 3, type: "period", label: "Period 3", startTime: "10:55", endTime: "11:45" },
    { periodNumber: 4, type: "period", label: "Period 4", startTime: "11:45", endTime: "12:35" },
    { periodNumber: 0, type: "lunch", label: "Lunch Break", startTime: "12:35", endTime: "13:15" },
    { periodNumber: 5, type: "period", label: "Period 5", startTime: "13:15", endTime: "14:05" },
    { periodNumber: 6, type: "period", label: "Period 6", startTime: "14:05", endTime: "14:55" },
    { periodNumber: 0, type: "break", label: "Short Break", startTime: "14:55", endTime: "15:00" },
]

interface EditRow {
    periodNumber: number
    type: "period" | "break" | "lunch"
    label: string
    startTime: string
    endTime: string
    facultyId: string
    facultyName: string
    subjectId: string
    subject: string
    classSection: string
    classroom: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
}

export function TimetableManagement() {
    const { data: faculty, loading: loadingFaculty } = useFaculty()
    const { data: allSubjects, loading: loadingSubjects } = useSubjects()
    const { data: allPeriods, loading: loadingTimetable } = useTimetable()

    const uniqueSubjects = useMemo(() => {
        const seen = new Set<string>()
        return allSubjects.filter(s => {
            const key = `${s.name}-${s.department}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
    }, [allSubjects])

    const [selectedDay, setSelectedDay] = useState("Monday")
    const [editRows, setEditRows] = useState<EditRow[]>([])
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [viewMode, setViewMode] = useState<"day" | "faculty" | "assign">("day")
    const [filterFacultyId, setFilterFacultyId] = useState("all")
    
    const { data: departments } = useDepartments()
    const [assignForm, setAssignForm] = useState({
        day: "Monday",
        periodNumber: 1,
        department: "",
        section: "",
        facultyId: "",
        subjectId: "",
        classroom: ""
    })
    const [assignError, setAssignError] = useState("")
    const [assignSuccess, setAssignSuccess] = useState(false)
    const [assigning, setAssigning] = useState(false)
    const [generating, setGenerating] = useState(false)

    const loading = loadingFaculty || loadingTimetable || loadingSubjects

    const findFacultyForSubjectName = (subjectName: string) => {
        if (!subjectName) return undefined
        const lowerSub = subjectName.trim().toLowerCase()
        return faculty.find(f => {
            return (f as any).subject?.toLowerCase() === lowerSub || 
                   f.assignedSubjects?.some(as => as.subjectName.toLowerCase() === lowerSub) ||
                   f.subjectIds?.some(id => allSubjects.find(s => s.id === id)?.name.toLowerCase() === lowerSub)
        })
    }

    const dayPeriods = useMemo(() =>
        allPeriods
            .filter(p => p.day === selectedDay)
            .sort((a, b) => a.periodNumber - b.periodNumber),
        [allPeriods, selectedDay]
    )

    const displayRows = useMemo(() => {
        return ROW_TEMPLATE.map(tmpl => {
            if (tmpl.type !== "period") return { ...tmpl, facultyId: "", facultyName: "", subjectId: "", subject: "", classSection: "", classroom: "" }
            const saved = dayPeriods.find(p => p.type === "period" && p.periodNumber === tmpl.periodNumber)
            return {
                ...tmpl,
                facultyId: saved?.facultyId || "",
                facultyName: saved?.facultyName || "",
                subjectId: saved?.subjectId || "",
                subject: saved?.subject || "",
                classSection: saved?.classSection || "",
                classroom: saved?.classroom || "",
            }
        })
    }, [dayPeriods])

    const startEditing = () => {
        setEditRows(displayRows.map(r => ({ ...r, facultyId: r.facultyId || "" })))
        setEditing(true)
        setSaved(false)
    }

    const updateRow = (index: number, field: keyof EditRow, value: string) => {
        setEditRows(prev =>
            prev.map((r, i) => {
                if (i !== index) return r
                if (field === "subjectId") {
                    const sub: Subject | undefined = uniqueSubjects.find(s => s.id === value) || allSubjects.find(s => s.id === value)
                    if (sub) {
                        const fac = findFacultyForSubjectName(sub.name)
                        const prior = allPeriods.find(p => p.subjectId === value && (p.classroom || p.classSection))
                        return { 
                            ...r, 
                            subjectId: value, 
                            subject: sub.name, 
                            facultyId: fac ? fac.id : "", 
                            facultyName: fac ? fac.name : "Unassigned",
                            classSection: prior?.classSection || r.classSection,
                            classroom: prior?.classroom || r.classroom
                        }
                    }
                    return { ...r, subjectId: value, subject: "", facultyId: "", facultyName: "Unassigned", classSection: "", classroom: "" }
                }
                return { ...r, [field]: value }
            })
        )
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const periodsToSave: Omit<TimetablePeriod, "id">[] = editRows
                .filter(r => r.type === "period")
                .map(r => ({
                    day: selectedDay,
                    periodNumber: r.periodNumber,
                    type: "period" as const,
                    label: r.label,
                    startTime: r.startTime,
                    endTime: r.endTime,
                    facultyId: r.facultyId || null,
                    facultyName: r.facultyName || "",
                    subjectId: r.subjectId || "",
                    subject: r.subject || "",
                    classSection: r.classSection || "",
                    classroom: r.classroom || "",
                }))

            const breakRows: Omit<TimetablePeriod, "id">[] = editRows
                .filter(r => r.type !== "period")
                .map(r => ({
                    day: selectedDay,
                    periodNumber: r.periodNumber,
                    type: r.type,
                    label: r.label,
                    startTime: r.startTime,
                    endTime: r.endTime,
                    facultyId: null,
                    facultyName: "",
                    subjectId: "",
                    subject: "",
                    classSection: "",
                    classroom: "",
                }))

            await saveTimetablePeriods(selectedDay, [...periodsToSave, ...breakRows])
            setSaved(true); setEditing(false)
            setTimeout(() => setSaved(false), 2000)
        } catch { /* ignore */ } finally { setSaving(false) }
    }

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault()
        setAssignError(""); setAssignSuccess(false)
        if (!assignForm.facultyId || !assignForm.subjectId || !assignForm.department || !assignForm.section) {
            setAssignError("Required fields manifest is incomplete."); return
        }
        setAssigning(true)
        try {
            const fac = faculty.find(f => f.id === assignForm.facultyId)
            const sub = uniqueSubjects.find(s => s.id === assignForm.subjectId) || allSubjects.find(s => s.id === assignForm.subjectId)
            await assignFacultyToTimetablePeriod({
                day: assignForm.day,
                periodNumber: assignForm.periodNumber,
                facultyId: assignForm.facultyId,
                facultyName: fac?.name || "",
                subjectId: assignForm.subjectId,
                subject: sub?.name || "",
                department: assignForm.department,
                section: assignForm.section,
                classSection: `${assignForm.department}-${assignForm.section}`,
                classroom: assignForm.classroom
            })
            setAssignSuccess(true)
            setTimeout(() => setAssignSuccess(false), 3000)
            setAssignForm(prev => ({ ...prev, facultyId: "", subjectId: "" }))
        } catch (err: any) { setAssignError(err.message || "Assignment protocols failed.") } finally { setAssigning(false) }
    }

    const handleAutoGenerate = async () => {
        if (!window.confirm("CAUTION: This will overwrite weekly scheduling data. Proceed with matrix generation?")) return;
        setGenerating(true)
        try {
            const subjectsWithFaculty = uniqueSubjects.filter(s => s.facultyIds && s.facultyIds.length > 0)
            if (subjectsWithFaculty.length === 0) {
                alert("Subject-Faculty mapping is empty. Initialization failed."); setGenerating(false); return
            }
            let pool = [...subjectsWithFaculty]
            while (pool.length < 36) pool = pool.concat(subjectsWithFaculty)
            pool = pool.sort(() => Math.random() - 0.5)
            let poolIndex = 0

            for (const day of DAYS) {
                const dayPeriodsToSave: Omit<TimetablePeriod, "id">[] = []
                let consecutiveFacultyId = ""; let consecutiveCount = 0

                for (const tmpl of ROW_TEMPLATE) {
                    if (tmpl.type !== "period") continue
                    let sub = pool[poolIndex]; let facId = ""
                    if (sub) {
                        const fac = findFacultyForSubjectName(sub.name)
                        if (fac) facId = fac.id
                    }
                    if (facId && facId === consecutiveFacultyId && consecutiveCount >= 2) {
                        const altIndex = pool.findIndex((s, idx) => {
                            if (idx <= poolIndex) return false;
                            const altFac = findFacultyForSubjectName(s.name)
                            return altFac && altFac.id !== consecutiveFacultyId;
                        })
                        if (altIndex !== -1) {
                            const temp = pool[poolIndex]; pool[poolIndex] = pool[altIndex]; pool[altIndex] = temp
                            sub = pool[poolIndex]
                            const altFacForNewSub = findFacultyForSubjectName(sub.name)
                            facId = altFacForNewSub ? altFacForNewSub.id : ""
                        }
                    }
                    if (facId === consecutiveFacultyId) consecutiveCount++
                    else { consecutiveFacultyId = facId; consecutiveCount = 1 }
                    poolIndex++
                    const facName = faculty.find(f => f.id === facId)?.name || "Auto-assigned Personnel"
                    dayPeriodsToSave.push({
                        day, periodNumber: tmpl.periodNumber, type: "period" as const,
                        label: tmpl.label, startTime: tmpl.startTime, endTime: tmpl.endTime,
                        facultyId: facId, facultyName: facName, subjectId: sub?.id || "",
                        subject: sub?.name || "", classSection: sub?.department || "CORE", classroom: "AUTO-101"
                    })
                }

                const breakRows: Omit<TimetablePeriod, "id">[] = ROW_TEMPLATE
                    .filter(r => r.type !== "period")
                    .map(r => ({
                        day, periodNumber: r.periodNumber, type: r.type,
                        label: r.label, startTime: r.startTime, endTime: r.endTime,
                        facultyId: null, facultyName: "", subjectId: "", subject: "", classSection: "", classroom: "",
                    }))
                await saveTimetablePeriods(day, [...dayPeriodsToSave, ...breakRows])
            }
            alert("Institutional weekly matrix generated successfully.")
        } catch (err: any) { alert("Generation failure: " + err.message) } finally { setGenerating(false) }
    }

    const daysWithData = useMemo(() => new Set(allPeriods.map(p => p.day)), [allPeriods])

    const facultyWeekly = useMemo(() => {
        if (filterFacultyId === "all") return []
        return DAYS.map(day => {
            const periods = allPeriods
                .filter(p => p.day === day && p.type === "period" && p.facultyId === filterFacultyId)
                .sort((a, b) => a.periodNumber - b.periodNumber)
            return { day, periods }
        }).filter(d => d.periods.length > 0)
    }, [allPeriods, filterFacultyId])

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-8 pb-12"
        >
            {/* Nav & Action Strip */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <motion.div variants={itemVariants} className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-card-foreground">
                        Time <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Matrix</span>
                    </h1>
                    <p className="text-muted-foreground italic font-medium">Orchestrating departmental temporal synchronization.</p>
                </motion.div>
                
                <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2">
                    <div className="flex h-11 items-center bg-white/5 border border-white/5 p-1 rounded-xl shadow-inner">
                        {[
                            { id: "day", label: "Timeline", icon: Layout },
                            { id: "faculty", label: "Personnel", icon: Users },
                            { id: "assign", label: "Mapping", icon: UserPlus },
                        ].map((btn) => (
                            <Button
                                key={btn.id}
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode(btn.id as any)}
                                className={cn(
                                    "px-4 h-9 font-black uppercase text-[10px] tracking-widest transition-all rounded-lg",
                                    viewMode === btn.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-white/5"
                                )}
                            >
                                <btn.icon className="mr-2 h-3 w-3" /> {btn.label}
                            </Button>
                        ))}
                    </div>
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAutoGenerate} 
                        disabled={generating} 
                        className="h-11 px-6 border-white/5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-500 font-black uppercase text-[10px] tracking-widest transition-all shadow-lg"
                    >
                        {generating ? <Zap className="h-3 w-3 animate-pulse text-amber-500" /> : <Sparkles className="h-3 w-3 text-amber-500 mr-2" />}
                        Generator
                    </Button>
                </motion.div>
            </div>

            {/* ─── DAY VIEW ─── */}
            {viewMode === "day" && (
                <div className="space-y-6">
                    <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5 shadow-inner">
                        {DAYS.map(day => (
                            <Button
                                key={day}
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedDay(day); setEditing(false) }}
                                className={cn(
                                    "h-10 px-6 font-black uppercase text-[11px] tracking-widest transition-all rounded-xl",
                                    selectedDay === day ? "bg-white/10 text-card-foreground shadow-sm" : "text-muted-foreground hover:bg-white/5"
                                )}
                            >
                                {day}
                                {daysWithData.has(day) && (
                                    <span className="ml-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                )}
                            </Button>
                        ))}
                    </motion.div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedDay}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="border-white/5 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/[0.02] py-6 px-8">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <CardTitle className="text-2xl font-black text-card-foreground">{selectedDay.toUpperCase()}</CardTitle>
                                            <Badge variant="outline" className="border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] px-3">{displayRows.filter(r => r.type === "period").length} SESSIONS ACTIVE</Badge>
                                        </div>
                                        <CardDescription className="italic font-bold text-muted-foreground mt-1 opacity-60">Full spectral day timeline // Academic Year 2023-24</CardDescription>
                                    </div>
                                    {!editing ? (
                                        <Button onClick={startEditing} className="h-11 px-6 shadow-lg shadow-primary/20 font-black uppercase text-[11px] tracking-widest gap-2">
                                            <Zap className="h-4 w-4" /> {daysWithData.has(selectedDay) ? "OVERRIDE MATRIX" : "INITIALIZE DAY"}
                                        </Button>
                                    ) : (
                                        <div className="flex gap-3">
                                            <Button variant="ghost" onClick={() => setEditing(false)} className="h-11 font-black uppercase text-[11px] tracking-widest">Abort</Button>
                                            <Button onClick={handleSave} disabled={saving} className="h-11 px-8 shadow-lg shadow-primary/20 font-black uppercase text-[11px] tracking-widest gap-2">
                                                <Save className="h-4 w-4" /> {saving ? "SYNCING..." : "COMMIT CHANGES"}
                                            </Button>
                                        </div>
                                    )}
                                </CardHeader>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-white/5 text-left">
                                                <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground whitespace-nowrap pl-8">Slot Mapping</th>
                                                <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground whitespace-nowrap">Temporal Window</th>
                                                <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground whitespace-nowrap">Personnel Assigned</th>
                                                <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground whitespace-nowrap">Subject Domain</th>
                                                <th className="hidden p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground whitespace-nowrap sm:table-cell">Target Group</th>
                                                <th className="hidden p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground whitespace-nowrap md:table-cell pr-8">Loc Vector</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03]">
                                            {(editing ? editRows : displayRows).map((row, idx) => (
                                                <motion.tr
                                                    key={idx}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className={cn(
                                                        "group transition-all hover:bg-white/[0.02]",
                                                        row.type === "break" ? "bg-amber-500/[0.02]" : row.type === "lunch" ? "bg-orange-500/[0.02]" : ""
                                                    )}
                                                >
                                                    <td className="p-4 pl-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg font-black text-[9px] shadow-sm uppercase tracking-tighter",
                                                                row.type === "period" ? "bg-primary/10 text-primary border border-primary/20" :
                                                                row.type === "lunch" ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" :
                                                                "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                                            )}>
                                                                {row.label.split(" ").pop()}
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-card-foreground group-hover:text-primary transition-colors">{row.label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/5 text-[10px] font-bold text-muted-foreground group-hover:bg-white/10 transition-all">
                                                            <Clock className="h-3 w-3" /> {row.startTime} – {row.endTime}
                                                        </div>
                                                    </td>
                                                    
                                                    {row.type !== "period" ? (
                                                        <td colSpan={4} className="p-4">
                                                            <div className="flex items-center gap-3 opacity-60">
                                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground whitespace-nowrap">
                                                                    {row.type === "break" ? "INTERVAL BREAK" : "LUNCH MANIFEST"}
                                                                </span>
                                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                            </div>
                                                        </td>
                                                    ) : editing ? (
                                                        <>
                                                            <td className="p-4">
                                                                <Select
                                                                    value={row.subjectId || undefined}
                                                                    onValueChange={v => updateRow(idx, "subjectId", v)}
                                                                >
                                                                    <SelectTrigger className="h-9 text-xs bg-background/50 border-white/5 w-40 font-bold">
                                                                        <SelectValue placeholder="Select Domain" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-card/90 backdrop-blur-xl border-white/10">
                                                                        {uniqueSubjects.map(s =>
                                                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="h-9 px-3 flex items-center rounded-lg border border-white/5 bg-white/5 text-[11px] font-black uppercase text-muted-foreground truncate w-32 tracking-tighter shadow-inner">
                                                                    {row.facultyName?.split(" ").pop() || "SYSTEM"}
                                                                </div>
                                                            </td>
                                                            <td className="hidden p-4 sm:table-cell">
                                                                <Input
                                                                    className="h-9 text-xs bg-background/50 border-white/5 font-bold w-28"
                                                                    placeholder="SECTION"
                                                                    value={row.classSection || ""}
                                                                    onChange={e => updateRow(idx, "classSection", e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="hidden p-4 md:table-cell pr-8">
                                                                <Input
                                                                    className="h-9 text-xs bg-background/50 border-white/5 font-bold w-32"
                                                                    placeholder="CLASSROOM"
                                                                    value={row.classroom || ""}
                                                                    onChange={e => updateRow(idx, "classroom", e.target.value)}
                                                                />
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-7 w-7 rounded-full bg-white/5 flex items-center justify-center font-black text-[10px] text-muted-foreground group-hover:text-primary border border-white/5 transition-all">
                                                                       {row.facultyName ? row.facultyName.charAt(0) : "?"}
                                                                    </div>
                                                                    <span className="font-bold text-card-foreground text-sm tracking-tight">{row.facultyName || "UNASSIGNED"}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                {row.subject ? (
                                                                    <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] font-black uppercase h-7 tracking-tighter px-3">
                                                                        {row.subject}
                                                                    </Badge>
                                                                ) : <span className="text-muted-foreground opacity-20">—</span>}
                                                            </td>
                                                            <td className="hidden p-4 text-[11px] font-bold text-muted-foreground sm:table-cell uppercase tracking-widest">{row.classSection || "GENERAL"}</td>
                                                            <td className="hidden p-4 md:table-cell pr-8">
                                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground opacity-60">
                                                                    <Search className="h-3 w-3" /> {row.classroom || "N/A"}
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

            {/* ─── FACULTY VIEW ─── */}
            {viewMode === "faculty" && (
                <div className="space-y-8 max-w-5xl mx-auto w-full">
                    <motion.div variants={itemVariants} className="flex flex-col gap-3">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Target Personnel Identifier</Label>
                        <Select value={filterFacultyId} onValueChange={setFilterFacultyId}>
                            <SelectTrigger className="h-12 bg-card/40 backdrop-blur-xl border-white/10 font-bold px-6 shadow-xl w-full sm:w-80">
                                <SelectValue placeholder="INITIALIZE SELECTION" />
                            </SelectTrigger>
                            <SelectContent className="bg-card/90 backdrop-blur-2xl border-white/10">
                                <SelectItem value="all" className="font-black">SELECT FROM ROSTER</SelectItem>
                                {faculty.map(f => <SelectItem key={f.id} value={f.id}>{f.name.toUpperCase()}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </motion.div>

                    {filterFacultyId === "all" ? (
                        <motion.div variants={itemVariants}>
                            <Card className="border-dashed border-white/10 bg-white/5 backdrop-blur-xl">
                                <CardContent className="p-24 flex flex-col items-center justify-center gap-4 text-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                                        <Users className="h-16 w-16 text-muted-foreground opacity-20 relative z-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-black uppercase tracking-[0.2em] text-muted-foreground text-sm">Personnel Matrix Idle</p>
                                        <p className="text-xs text-muted-foreground opacity-40 font-medium italic">Execute selection to synthesize individual schedule manifests.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {facultyWeekly.length === 0 ? (
                                <Card className="border-white/5 bg-card/40 backdrop-blur-xl p-12 text-center md:col-span-2">
                                    <p className="font-black text-muted-foreground uppercase tracking-widest">Zero assigned sessions detected for this entity.</p>
                                </Card>
                            ) : (
                                facultyWeekly.map(({ day, periods }, dayIdx) => (
                                    <motion.div 
                                        key={day} 
                                        variants={itemVariants}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: dayIdx * 0.1 }}
                                    >
                                        <Card className="h-full border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/60 overflow-hidden shadow-lg border-l-4 border-l-primary/40">
                                            <CardHeader className="py-4 px-6 border-b border-white/5 bg-white/[0.02]">
                                                <CardTitle className="text-sm font-black text-card-foreground tracking-widest uppercase">{day}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="flex flex-col">
                                                    {periods.map((p, pIdx) => (
                                                        <div key={p.id} className={cn(
                                                            "p-4 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-all",
                                                            pIdx % 2 === 1 ? "bg-white/[0.01]" : ""
                                                        )}>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge className="h-5 text-[8px] font-black uppercase tracking-tighter bg-primary/20 text-primary border-none">{p.label}</Badge>
                                                                    <span className="font-bold text-card-foreground text-sm">{p.subject || "NO DOMAIN"}</span>
                                                                </div>
                                                                <div className="text-[10px] font-black text-muted-foreground flex items-center gap-3">
                                                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.startTime} – {p.endTime}</span>
                                                                    <span className="flex items-center gap-1 opacity-50"><Layers className="h-3 w-3" /> {p.classSection || "CORE"}</span>
                                                                </div>
                                                            </div>
                                                            <Badge variant="outline" className="bg-white/5 border-white/10 text-[9px] font-black uppercase">{p.classroom || "TBD"}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ─── ASSIGN FACULTY VIEW ─── */}
            {viewMode === "assign" && (
                <motion.div variants={itemVariants} className="max-w-4xl mx-auto w-full">
                    <Card className="border-white/5 bg-card/40 backdrop-blur-3xl shadow-2xl overflow-hidden">
                        <CardHeader className="border-b border-white/5 bg-indigo-500/[0.03] py-8 px-10">
                             <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
                                    <UserPlus className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black text-card-foreground tracking-tight">MANUAL MAPPING INTERFACE</CardTitle>
                                    <CardDescription className="italic font-bold text-muted-foreground">Assign specific personnel to high-priority temporal slots.</CardDescription>
                                </div>
                             </div>
                        </CardHeader>
                        <CardContent className="p-10">
                            <form onSubmit={handleAssign} className="flex flex-col gap-10">
                                <AnimatePresence>
                                    {assignError && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-bold text-rose-500"
                                        >
                                            <AlertCircle className="h-4 w-4" /> {assignError}
                                        </motion.div>
                                    )}

                                    {assignSuccess && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-500"
                                        >
                                            <CheckCircle2 className="h-4 w-4" /> MAPPING SYNCED SUCCESSFULLY
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Temporal Day</Label>
                                        <Select value={assignForm.day} onValueChange={v => setAssignForm(p => ({ ...p, day: v }))}>
                                            <SelectTrigger className="h-12 bg-background/50 border-white/5 font-bold px-4"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-card/90 backdrop-blur-xl border-white/10">
                                                {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Session Slot</Label>
                                        <Select value={assignForm.periodNumber.toString()} onValueChange={v => setAssignForm(p => ({ ...p, periodNumber: parseInt(v) }))}>
                                            <SelectTrigger className="h-12 bg-background/50 border-white/5 font-bold px-4"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-card/90 backdrop-blur-xl border-white/10">
                                                {ROW_TEMPLATE.filter(r => r.type === "period").map(r => (
                                                    <SelectItem key={r.periodNumber} value={r.periodNumber.toString()}>{r.label} [{r.startTime}]</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Departmental Vertical</Label>
                                        <Select value={assignForm.department} onValueChange={v => setAssignForm(p => ({ ...p, department: v }))}>
                                            <SelectTrigger className="h-12 bg-background/50 border-white/5 font-bold px-4"><SelectValue placeholder="SELECT DEPT" /></SelectTrigger>
                                            <SelectContent className="bg-card/90 backdrop-blur-xl border-white/10">
                                                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Section Component</Label>
                                        <Input
                                            className="h-12 bg-background/50 border-white/5 font-bold px-4 uppercase placeholder:text-muted-foreground/30"
                                            placeholder="E.G. 'CSE-A', 'II YEAR'"
                                            value={assignForm.section}
                                            onChange={e => setAssignForm(p => ({ ...p, section: e.target.value.toUpperCase() }))}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Subject Domain</Label>
                                        <Select 
                                            value={assignForm.subjectId} 
                                            onValueChange={v => {
                                                const sub = uniqueSubjects.find(s => s.id === v) || allSubjects.find(s => s.id === v)
                                                let facId = ""; let room = ""; let dept = assignForm.department; let sec = assignForm.section
                                                if (sub) {
                                                    const fac = findFacultyForSubjectName(sub.name)
                                                    if (fac) facId = fac.id
                                                    const prior = allPeriods.find(p => p.subjectId === v && (p.classroom || p.department || p.section))
                                                    if (prior) { room = prior.classroom || room; dept = prior.department || dept; sec = prior.section || sec }
                                                }
                                                setAssignForm(p => ({ ...p, subjectId: v, facultyId: facId, classroom: room || p.classroom, department: dept, section: sec }))
                                            }}
                                        >
                                            <SelectTrigger className="h-12 bg-background/50 border-white/5 font-bold px-4"><SelectValue placeholder="SELECT SUBJECT" /></SelectTrigger>
                                            <SelectContent className="bg-card/90 backdrop-blur-xl border-white/10">
                                                {uniqueSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name} [{s.department}]</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Personnel Vector (LOCKED)</Label>
                                        <div className="h-12 px-5 flex items-center justify-between rounded-xl border border-white/5 bg-white/5 text-[11px] font-black uppercase text-muted-foreground shadow-inner">
                                            <span className="opacity-40">{assignForm.facultyId ? faculty.find(f => f.id === assignForm.facultyId)?.name : "AWAITING DOMAIN"}</span>
                                            {assignForm.facultyId && <ShieldCheck className="h-4 w-4 text-emerald-500 opacity-60" />}
                                        </div>
                                    </div>

                                    <div className="space-y-3 md:col-span-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Location Vector (Optional)</Label>
                                        <div className="relative">
                                            <Input
                                                className="h-12 bg-background/50 border-white/5 font-bold px-12 italic placeholder:text-muted-foreground/30"
                                                placeholder="e.g. MAIN BLOCK // LAB-402"
                                                value={assignForm.classroom}
                                                onChange={e => setAssignForm(p => ({ ...p, classroom: e.target.value }))}
                                            />
                                            <MapIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-40" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-end pt-4">
                                    <Button type="submit" disabled={assigning} className="min-w-[240px] h-14 rounded-2xl shadow-2xl shadow-primary/20 font-black uppercase tracking-widest text-xs gap-3">
                                        {assigning ? (
                                            <><Clock className="h-5 w-5 animate-spin" /> SYNCING MANIFEST...</>
                                        ) : (
                                            <><Zap className="h-5 w-5" /> COMMISSION ASSIGNMENT</>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </motion.div>
    )
}

function cn(...classes: (string | undefined | null | boolean)[]) { return classes.filter(Boolean).join(" ") }
