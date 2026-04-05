"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { 
    useFaculty, 
    useFeedback, 
    addFeedbackRecord, 
    useStudentTasks, 
    useFacultySubjectsMap,
    useTimetable,
    useAttendance
} from "@/lib/api-service"
import { 
    Star, 
    Send, 
    CheckCircle2, 
    MessageSquare, 
    ClipboardList, 
    BookOpen, 
    AlertTriangle, 
    Users, 
    Activity, 
    Clock, 
    Loader2, 
    ArrowRight,
    TrendingUp,
    Zap,
    Calendar,
    GraduationCap,
    Layout
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatedCounter } from "./animated-counter"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
}

export function StudentDashboard() {
    const { user } = useAuth()
    const { data: faculty, loading: loadingFaculty } = useFaculty()
    const { data: allFeedback, loading: loadingFeedback } = useFeedback()
    const { data: studentTasks, loading: loadingTasks } = useStudentTasks(user?.uid || "")
    const { data: facultySubjectsMap } = useFacultySubjectsMap()
    const { data: allTimetable } = useTimetable()
    const { data: allAttendance } = useAttendance()

    const [selectedFaculty, setSelectedFaculty] = useState("")
    const [selectedSubject, setSelectedSubject] = useState("")
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState("")

    const selectedFac = faculty.find(f => f.id === selectedFaculty)
    const myFeedback = allFeedback.filter(fb => fb.studentName === user?.name)

    const loading = loadingFaculty || loadingFeedback || loadingTasks

    const today = new Date().toISOString().split("T")[0]
    const currentDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date())

    const quizzes = studentTasks.filter(t => t.taskType === "Create Quiz")
    const materials = studentTasks.filter(t => t.taskType === "Upload Study Material")

    // Stats calculations
    const attendancePercent = useMemo(() => {
        if (!allAttendance.length) return 85 // Fallback mock for redesign look
        return Math.round(allAttendance.reduce((sum, a) => sum + a.percent, 0) / allAttendance.length)
    }, [allAttendance])

    const avgFeedbackGiven = useMemo(() => {
        if (!myFeedback.length) return 0
        return Math.round((myFeedback.reduce((sum, f) => sum + f.rating, 0) / myFeedback.length) * 10) / 10
    }, [myFeedback])

    const todaySchedule = useMemo(() => {
        return allTimetable
            .filter(t => t.day === currentDay && t.type === "period")
            .sort((a, b) => a.periodNumber - b.periodNumber)
            .slice(0, 4)
    }, [allTimetable, currentDay])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!selectedFaculty || !selectedSubject || rating === 0) {
            setError("Please select all required fields and provide a rating")
            return
        }

        setSubmitting(true)
        try {
            await addFeedbackRecord({
                facultyId: selectedFaculty,
                studentName: user?.name || "Anonymous",
                rating,
                comment,
                date: new Date().toISOString().split("T")[0],
                subject: selectedSubject,
            })
            setSubmitted(true)
            setSelectedFaculty("")
            setSelectedSubject("")
            setRating(0)
            setComment("")
            setTimeout(() => setSubmitted(false), 3000)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to submit feedback")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                <p className="text-sm font-black uppercase tracking-widest text-emerald-600/60 animate-pulse">Initializing Neural Link...</p>
            </div>
        )
    }

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mx-auto flex max-w-7xl flex-col gap-8 pb-12"
        >
            {/* Dynamic Student Hero */}
            <motion.div 
                variants={itemVariants}
                className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] p-12 shadow-2xl shadow-emerald-500/20"
            >
                {/* Visual Depth Elements */}
                <div className="absolute right-0 top-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-white/10 blur-[100px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-[80px]" />
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <div className="relative group">
                            <div className="absolute inset-0 rounded-[2.5rem] bg-white opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
                            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-[2.5rem] bg-white/10 backdrop-blur-2xl border border-white/30 text-4xl font-black text-white shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    user?.name?.charAt(0) || "S"
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                                <Badge className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1 rounded-full backdrop-blur-md">
                                    {user?.department || "Academic Grid"}
                                </Badge>
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Active Session</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2 leading-none">
                                Hey, <span className="text-emerald-100 italic">{user?.name?.split(' ')[0]}</span>!
                            </h1>
                            <p className="text-lg text-emerald-50/60 font-medium max-w-md">
                                Your scholarly trajectory is currently at <span className="text-white font-bold underline decoration-emerald-300 underline-offset-4">Optimal Velocity</span>. Continue your mission.
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats Integrated in Hero */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full lg:w-auto">
                        {[
                            { label: "Attendance", value: attendancePercent, suffix: "%", icon: Activity, color: "text-emerald-300" },
                            { label: "Avg Rating", value: avgFeedbackGiven, suffix: "", icon: Star, color: "text-amber-300" },
                            { label: "Tasks Done", value: studentTasks.filter(t => t.status === "completed").length, suffix: "", icon: CheckCircle2, color: "text-cyan-300" },
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col items-center lg:items-start p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors shadow-inner">
                                <stat.icon className={`h-5 w-5 mb-3 ${stat.color}`} />
                                <div className="text-2xl font-black text-white leading-none mb-1 tabular-nums">
                                    <AnimatedCounter value={stat.value} />{stat.suffix}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-50/40">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                
                {/* LEFT: Academic Pulse & Schedule */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Today's Schedule Card */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-emerald-500/10 bg-card/40 backdrop-blur-2xl shadow-xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="bg-emerald-500/5 pb-4 border-b border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-white">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black uppercase tracking-tight">Today's Pulse</CardTitle>
                                            <CardDescription className="text-[10px] font-bold uppercase text-emerald-600/50">{currentDay} Manifest</CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="border-emerald-500/20 text-emerald-600 font-black text-[9px] uppercase tracking-widest">Live</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {todaySchedule.length > 0 ? todaySchedule.map((slot, i) => (
                                        <div key={i} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-[2px] before:bg-emerald-500/20 before:rounded-full">
                                            <div className="absolute left-[-4px] top-2 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                            <div className="flex flex-col">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black uppercase text-card-foreground tracking-tight">{slot.subject}</span>
                                                    <span className="text-[10px] font-black text-muted-foreground opacity-40">{slot.startTime}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-muted-foreground italic">{slot.facultyName} · {slot.classroom}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-8 text-center">
                                            <div className="h-12 w-12 mx-auto mb-3 opacity-10 text-emerald-500"><Zap className="h-full w-full" /></div>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] opacity-30">Static Frequency Detected</p>
                                        </div>
                                    )}
                                </div>
                                <Button variant="ghost" className="w-full mt-6 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-500/5 gap-2">
                                    Full Timetable <ArrowRight className="h-3 w-3" />
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Results / Performance Summary */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-emerald-500/10 bg-card/40 backdrop-blur-2xl shadow-xl rounded-[2.5rem]">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                                        <TrendingUp className="h-6 w-6" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Grade Point</p>
                                        <p className="text-2xl font-black text-card-foreground">3.8 / 4.0</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                                            <span>Academic Saturation</span>
                                            <span className="text-emerald-500">92%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-emerald-500/10 overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: "92%" }}
                                                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter mb-1">Rank</p>
                                            <p className="text-xl font-black text-card-foreground">#18 <span className="text-[10px] opacity-40">/ 120</span></p>
                                        </div>
                                        <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-tighter mb-1">Credits</p>
                                            <p className="text-xl font-black text-card-foreground">24 <span className="text-[10px] opacity-40">Earned</span></p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* MIDDLE: Operational Logistics (Assignments) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <motion.div variants={itemVariants}>
                        <Card className="border-emerald-500/10 bg-card/40 backdrop-blur-2xl shadow-xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="pb-8 border-b border-white/5 bg-white/[0.02] p-8">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-emerald-500/10 text-emerald-500 shadow-inner">
                                            <Layout className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-3xl font-black tracking-tighter uppercase">Mission Board</CardTitle>
                                            <CardDescription className="text-sm font-bold opacity-60 italic">Your active scholarly assignments and resources grid.</CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge className="bg-emerald-500 text-white font-black text-[10px] px-4 h-9 rounded-xl border-none shadow-lg shadow-emerald-500/20">{quizzes.length} QUIZZES</Badge>
                                        <Badge variant="outline" className="border-emerald-500/20 text-emerald-600 font-black text-[10px] px-4 h-9 rounded-xl">{materials.length} RESOURCES</Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                {quizzes.length === 0 && materials.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-24 text-center">
                                        <div className="mb-8 p-10 rounded-[3rem] bg-emerald-500/5 text-emerald-500/20"><BookOpen className="h-20 w-20" /></div>
                                        <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Sync Complete</h3>
                                        <p className="text-xs text-muted-foreground/40 max-w-xs font-bold uppercase tracking-[0.2em] leading-relaxed">No pending transmissions detected in your operational sector.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Quizzes Column */}
                                        <div className="flex flex-col gap-6">
                                            <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em] flex items-center gap-3">
                                                <span className="h-[2px] w-8 bg-emerald-500" />
                                                Active Assessments
                                            </h4>
                                            <div className="flex flex-col gap-4">
                                                {quizzes.map((task, idx) => {
                                                    const isOverdue = task.status !== "completed" && task.deadline < today
                                                    return (
                                                        <motion.div 
                                                            key={task.id} 
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.1 * idx }}
                                                            whileHover={{ scale: 1.02 }}
                                                            className={cn(
                                                                "group relative overflow-hidden rounded-[2rem] border p-6 transition-all duration-500",
                                                                isOverdue ? "border-rose-500/30 bg-rose-500/5 shadow-rose-500/10" : "border-emerald-500/10 bg-background/40 hover:bg-background/60 shadow-lg"
                                                            )}
                                                        >
                                                            <div className="flex flex-col gap-4 relative z-10">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm font-black uppercase tracking-tight text-card-foreground group-hover:text-emerald-500 transition-colors">{task.subjectName}</span>
                                                                    <Badge className={cn("rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-wider border-none",
                                                                        isOverdue ? "bg-rose-500/20 text-rose-600 animate-pulse" :
                                                                        task.status === "completed" ? "bg-emerald-500/20 text-emerald-600" :
                                                                        "bg-amber-500/20 text-amber-600"
                                                                    )}>
                                                                        {isOverdue ? "Overdue" : task.status}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs font-medium text-muted-foreground/70 line-clamp-2 leading-relaxed italic opacity-80 group-hover:opacity-100 italic transition-opacity">"{task.description}"</p>
                                                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                                    <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase opacity-40">
                                                                        <Clock className="h-3.5 w-3.5" /> Due: {task.deadline}
                                                                    </div>
                                                                    <Button size="icon" className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                                                                        <ArrowRight className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="absolute right-0 bottom-0 -mb-8 -mr-8 h-24 w-24 opacity-[0.03] rotate-12 group-hover:scale-150 transition-transform"><GraduationCap className="h-full w-full" /></div>
                                                        </motion.div>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Materials Column */}
                                        <div className="flex flex-col gap-6">
                                            <h4 className="text-[10px] font-black uppercase text-cyan-500 tracking-[0.3em] flex items-center gap-3">
                                                <span className="h-[2px] w-8 bg-cyan-500" />
                                                Study Vectors
                                            </h4>
                                            <div className="flex flex-col gap-4">
                                                {materials.map((task, idx) => (
                                                    <motion.div 
                                                        key={task.id} 
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.1 * idx }}
                                                        whileHover={{ scale: 1.02 }}
                                                        className="group relative overflow-hidden rounded-[2rem] border border-cyan-500/10 bg-background/40 hover:bg-background/60 p-6 transition-all duration-500 shadow-lg shadow-cyan-500/5 hover:border-cyan-500/30"
                                                    >
                                                        <div className="flex flex-col gap-4 relative z-10">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-black uppercase tracking-tight text-card-foreground group-hover:text-cyan-500 transition-colors">{task.subjectName}</span>
                                                                <Badge className="bg-cyan-500/20 text-cyan-600 rounded-lg px-3 py-1 text-[9px] font-black uppercase border-none shadow-sm">Updated</Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase opacity-40">
                                                                <Users className="h-3.5 w-3.5" /> {task.facultyName}
                                                            </div>
                                                            <div className="pt-4 border-t border-white/5 text-right">
                                                                <Button variant="ghost" className="h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-cyan-600 hover:bg-cyan-500/10 gap-2">
                                                                    Open Archive <BookOpen className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="absolute right-0 bottom-0 -mb-8 -mr-8 h-24 w-24 opacity-[0.03] -rotate-12 group-hover:scale-150 transition-transform"><Zap className="h-full w-full" /></div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Bottom Split: Feedback Grid & History */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* New Feedback Submission Panel */}
                        <motion.div variants={itemVariants}>
                            <Card className="h-full overflow-hidden border-emerald-500/10 bg-card/40 backdrop-blur-2xl shadow-xl rounded-[2.5rem]">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                                            <MessageSquare className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black uppercase tracking-tight">System Feedback</CardTitle>
                                            <CardDescription className="text-[10px] font-bold uppercase opacity-60">Direct transmission to academic lead</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <AnimatePresence mode="wait">
                                        {submitted && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="mb-6 flex items-center gap-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-600"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 animate-bounce">
                                                    <CheckCircle2 className="h-6 w-6" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Successful Sync</span>
                                                    <span className="text-xs font-medium opacity-80">Feedback archived in system metadata.</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex flex-col gap-2">
                                                <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Entity Selection</Label>
                                                <Select value={selectedFaculty} onValueChange={(val) => { setSelectedFaculty(val); setSelectedSubject("") }}>
                                                    <SelectTrigger className="h-12 bg-background/30 border-white/10 hover:border-emerald-500/30 transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest px-4">
                                                        <SelectValue placeholder="PORTAL COORDINATOR" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-white/10 bg-card/90 backdrop-blur-3xl p-2">
                                                        {faculty.map(f => (
                                                            <SelectItem key={f.id} value={f.id} className="cursor-pointer rounded-xl hover:bg-emerald-500/10 transition-colors uppercase font-black text-[10px] px-3 py-2.5">
                                                                {f.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {selectedFac && (
                                                <div className="flex flex-col gap-2">
                                                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Academic Stream</Label>
                                                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                                        <SelectTrigger className="h-12 bg-background/30 border-white/10 hover:border-emerald-500/30 transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest px-4">
                                                            <SelectValue placeholder="STREAM MAPPING" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-2xl border-white/10 bg-card/90 backdrop-blur-3xl p-2">
                                                            {(facultySubjectsMap[selectedFac.id] || []).length === 0 ? (
                                                                <div className="px-2 py-3 text-[10px] font-black text-muted-foreground/40 text-center uppercase tracking-widest">No active streams detected</div>
                                                            ) : (
                                                                (facultySubjectsMap[selectedFac.id] || []).map(s => (
                                                                    <SelectItem key={s.id} value={s.name} className="cursor-pointer rounded-xl hover:bg-emerald-500/10 transition-colors uppercase font-black text-[10px] px-3 py-2.5">{s.name}</SelectItem>
                                                                ))
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-3 rounded-[2rem] bg-emerald-500/5 p-6 border border-emerald-500/10 shadow-inner">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onClick={() => setRating(i)}
                                                            onMouseEnter={() => setHoverRating(i)}
                                                            onMouseLeave={() => setHoverRating(0)}
                                                            className="group relative rounded-full p-2 transition-all hover:scale-125"
                                                        >
                                                            <Star
                                                                className={`h-8 w-8 transition-all duration-300 ${i <= (hoverRating || rating)
                                                                    ? "fill-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                                                    : "text-muted-foreground/10 group-hover:text-emerald-500/30"
                                                                    }`}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                                {rating > 0 && (
                                                    <motion.span 
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] bg-emerald-500/10 px-4 py-1.5 rounded-full"
                                                    >
                                                        {rating === 1 ? "Inadequate" : rating === 2 ? "Generic" : rating === 3 ? "Sufficient" : rating === 4 ? "Proficient" : "Exemplary"}
                                                    </motion.span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Operational Log</Label>
                                            <Textarea
                                                value={comment}
                                                onChange={e => setComment(e.target.value)}
                                                placeholder="Narrative summary of academic experience..."
                                                rows={3}
                                                className="rounded-[1.5rem] bg-background/30 border-white/10 focus:border-emerald-500/30 text-[11px] font-medium resize-none p-4 placeholder:uppercase placeholder:text-[9px] placeholder:tracking-widest placeholder:font-black placeholder:opacity-20 transition-all"
                                            />
                                        </div>

                                        <Button type="submit" disabled={submitting} className="h-14 rounded-[1.5rem] bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 gap-3 text-[11px] font-black uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-[0.98]">
                                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                            {submitting ? "UPLOADING..." : "SYNC FEEDBACK"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Recent History / Log Card */}
                        <motion.div variants={itemVariants}>
                            <Card className="h-full border-emerald-500/10 bg-card/40 backdrop-blur-2xl shadow-xl rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl font-black uppercase tracking-tight">Transmission Log</CardTitle>
                                        <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500"><Activity className="h-5 w-5" /></div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-[500px] overflow-y-auto px-6 py-6 custom-scrollbar flex flex-col gap-4">
                                        {myFeedback.length === 0 ? (
                                            <div className="py-20 text-center flex flex-col items-center">
                                                <div className="h-16 w-16 mb-4 opacity-10 grayscale scale-75 rotate-12 bg-emerald-500/20 rounded-3xl" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Quiet Operational sector</p>
                                            </div>
                                        ) : (
                                            [...myFeedback].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((fb, idx) => (
                                                <motion.div 
                                                    key={fb.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.05 * idx }}
                                                    className="p-5 rounded-[1.8rem] bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all group"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[11px] font-black uppercase text-card-foreground group-hover:text-emerald-500 transition-colors">{fb.subject}</span>
                                                            <span className="text-[9px] font-bold text-muted-foreground opacity-40 uppercase tracking-tighter">{faculty.find(f => f.id === fb.facultyId)?.name || "SYSTEM RECORD"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10 shadow-sm transition-transform hover:scale-110">
                                                            <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                                                            <span className="text-[10px] font-black tabular-nums text-emerald-600">{fb.rating}</span>
                                                        </div>
                                                    </div>
                                                    {fb.comment && (
                                                        <div className="mt-4 text-[10px] font-medium text-muted-foreground/60 italic leading-relaxed line-clamp-2 border-l-2 border-emerald-500/20 pl-4 py-1">
                                                            "{fb.comment}"
                                                        </div>
                                                    )}
                                                    <div className="mt-3 text-right">
                                                        <span className="text-[8px] font-black text-muted-foreground opacity-20 uppercase tracking-widest">{fb.date}</span>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}


