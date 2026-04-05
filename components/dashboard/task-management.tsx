"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { useFaculty, useFacultySubjectsMap, useTasks, addTask, updateTask, deleteTask } from "@/lib/api-service"
import type { Task, TaskType, TaskStatus } from "@/lib/types"
import {
    Plus, ClipboardList, CheckCircle2, Clock, AlertTriangle, Trash2, Eye, Filter, FileText, Send, Calendar, User, BookOpen, Layers, Check, X, Info, ShieldCheck
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedCounter } from "./animated-counter"

const TASK_TYPES: TaskType[] = ["Create Quiz", "Grade Assignment", "Upload Study Material"]

const statusColors: Record<TaskStatus, string> = {
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    "in-progress": "bg-blue-500/10 text-blue-500 border-blue-500/20",
    submitted: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
    overdue: "bg-rose-500/10 text-rose-500 border-rose-500/20",
}

const statusLabels: Record<TaskStatus, string> = {
    pending: "Pending",
    "in-progress": "Processing",
    submitted: "Review Required",
    completed: "Success",
    overdue: "Critical Delay",
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
}

export function TaskManagement() {
    const { data: faculty, loading: loadingFaculty } = useFaculty()
    const { data: facultySubjectsMap } = useFacultySubjectsMap()
    const { data: tasks, loading: loadingTasks } = useTasks()

    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [filterFaculty, setFilterFaculty] = useState<string>("all")
    const [filterType, setFilterType] = useState<string>("all")

    const [createOpen, setCreateOpen] = useState(false)
    const [formTaskType, setFormTaskType] = useState<string>("")
    const [formFacultyId, setFormFacultyId] = useState<string>("")
    const [formSubject, setFormSubject] = useState<string>("")
    const [formDescription, setFormDescription] = useState("")
    const [formDeadline, setFormDeadline] = useState("")
    const [formSaving, setFormSaving] = useState(false)

    const [detailTask, setDetailTask] = useState<Task | null>(null)

    const loading = loadingFaculty || loadingTasks
    const today = new Date().toISOString().split("T")[0]

    const tasksWithOverdue = useMemo(() =>
        tasks.map(t => {
            if (t.status !== "completed" && t.status !== "submitted" && t.deadline < today) {
                return { ...t, status: "overdue" as TaskStatus }
            }
            return t
        }),
        [tasks, today]
    )

    const filteredTasks = useMemo(() => {
        return tasksWithOverdue
            .filter(t => filterStatus === "all" || t.status === filterStatus)
            .filter(t => filterFaculty === "all" || t.facultyId === filterFaculty)
            .filter(t => filterType === "all" || t.taskType === filterType)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [tasksWithOverdue, filterStatus, filterFaculty, filterType])

    const stats = useMemo(() => [
        { label: "Total Tasks", value: tasksWithOverdue.length, icon: ClipboardList, color: "bg-blue-500/10 text-blue-500" },
        { label: "Pending Ops", value: tasksWithOverdue.filter(t => t.status === "pending" || t.status === "in-progress").length, icon: Clock, color: "bg-amber-500/10 text-amber-500" },
        { label: "Awaiting Review", value: tasksWithOverdue.filter(t => t.status === "submitted").length, icon: Send, color: "bg-violet-500/10 text-violet-500" },
        { label: "Finalized", value: tasksWithOverdue.filter(t => t.status === "completed").length, icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-500" },
        { label: "Delayed", value: tasksWithOverdue.filter(t => t.status === "overdue").length, icon: AlertTriangle, color: "bg-rose-500/10 text-rose-500" },
    ], [tasksWithOverdue])

    const resetForm = () => {
        setFormTaskType(""); setFormFacultyId(""); setFormSubject(""); setFormDescription(""); setFormDeadline("")
    }

    const handleCreate = async () => {
        if (!formTaskType || !formFacultyId || !formSubject || !formDeadline) return
        setFormSaving(true)
        try {
            const fac = faculty.find(f => f.id === formFacultyId)
            const subjectEntry = (facultySubjectsMap[formFacultyId] || []).find(s => s.id === formSubject)
            await addTask({
                taskType: formTaskType as TaskType,
                subjectId: subjectEntry?.id || formSubject,
                subjectName: subjectEntry?.name || "",
                facultyId: formFacultyId,
                facultyName: fac?.name || "",
                description: formDescription,
                deadline: formDeadline,
                status: "pending",
                assignedStudentIds: [],
                attachments: [],
                createdAt: new Date().toISOString(),
                completedAt: null,
            })
            resetForm(); setCreateOpen(false)
        } catch { /* ignore */ } finally { setFormSaving(false) }
    }

    const handleDelete = async (id: string) => { if (window.confirm("Purge this task manifest from repository?")) { await deleteTask(id); setDetailTask(null) } }

    const handleStatusChange = async (id: string, status: TaskStatus) => {
        const update: Partial<Task> = { status }
        if (status === "completed") update.completedAt = new Date().toISOString()
        await updateTask(id, update)
    }

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
            {/* Header Area */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <motion.div variants={itemVariants} className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-card-foreground">
                        Operational <span className="bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">Logistics</span>
                    </h1>
                    <p className="text-muted-foreground italic font-medium">Synchronizing academic task distribution and lifecycle tracking.</p>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                    <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm() }}>
                        <DialogTrigger asChild>
                            <Button className="h-11 px-8 shadow-lg shadow-primary/20 font-black uppercase text-[11px] tracking-widest gap-2">
                                <Plus className="h-4 w-4" /> Initialize Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl bg-card/60 backdrop-blur-3xl border-white/10 shadow-2xl overflow-hidden p-0">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                <ClipboardList className="h-48 w-48 rotate-12" />
                            </div>
                            <DialogHeader className="p-8 pb-0 relative z-10">
                                <DialogTitle className="text-2xl font-black text-card-foreground tracking-tight uppercase">Construct Manifest</DialogTitle>
                                <DialogDescription className="font-bold italic text-muted-foreground">Define and deploy a new operational objective to personnel.</DialogDescription>
                            </DialogHeader>
                            <div className="p-8 pt-6 flex flex-col gap-6 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Directive Class</Label>
                                        <Select value={formTaskType} onValueChange={setFormTaskType}>
                                            <SelectTrigger className="h-11 bg-background/50 border-white/5 font-bold"><SelectValue placeholder="Selection Required" /></SelectTrigger>
                                            <SelectContent className="bg-card border-white/10">
                                                {TASK_TYPES.map(t => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Deadline Horizon</Label>
                                        <Input type="date" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} className="h-11 bg-background/50 border-white/5 font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Target Personnel</Label>
                                        <Select value={formFacultyId} onValueChange={(v) => { setFormFacultyId(v); setFormSubject("") }}>
                                            <SelectTrigger className="h-11 bg-background/50 border-white/5 font-bold"><SelectValue placeholder="Roster Lookup" /></SelectTrigger>
                                            <SelectContent className="bg-card border-white/10">
                                                {faculty.map(f => <SelectItem key={f.id} value={f.id}>{f.name.toUpperCase()}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Subject Sector</Label>
                                        <Select value={formSubject || undefined} onValueChange={setFormSubject} disabled={!formFacultyId}>
                                            <SelectTrigger className="h-11 bg-background/50 border-white/5 font-bold">
                                                <SelectValue placeholder={formFacultyId ? "Domain Entry" : "Selection Locked"} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-white/10">
                                                {(facultySubjectsMap[formFacultyId] || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name.toUpperCase()}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Strategic Description</Label>
                                    <Textarea
                                        value={formDescription}
                                        onChange={e => setFormDescription(e.target.value)}
                                        placeholder="INPUT DETAILED LOGISTICAL REQUIREMENTS..."
                                        rows={4}
                                        className="bg-background/50 border-white/5 resize-none font-bold placeholder:text-muted-foreground/30"
                                    />
                                </div>
                            </div>
                            <DialogFooter className="p-8 pt-0 flex gap-3 relative z-10">
                                <DialogClose asChild><Button variant="ghost" className="h-12 font-black uppercase tracking-widest text-[10px]">Abort</Button></DialogClose>
                                <Button onClick={handleCreate} disabled={formSaving || !formTaskType || !formFacultyId || !formSubject || !formDeadline} className="h-12 px-8 shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-[10px] min-w-[140px]">
                                    {formSaving ? "COMMISSIONING..." : "DEPLOY DIRECTIVE"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </motion.div>
            </div>

            {/* Stats Array */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                {stats.map(stat => (
                    <motion.div key={stat.label} variants={itemVariants}>
                        <Card className="relative overflow-hidden border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/60">
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform", stat.color)}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-2xl font-black text-card-foreground"><AnimatedCounter value={stat.value} /></p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Filters Bar */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5 shadow-inner">
                <div className="flex items-center gap-2 px-3 opacity-40">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Filters</span>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-36 h-10 bg-background/50 border-white/5 font-bold text-[10px] tracking-widest"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card">
                        <SelectItem value="all" className="uppercase font-black text-[10px]">ALL STATUS</SelectItem>
                        {Object.keys(statusLabels).map(s => <SelectItem key={s} value={s} className="uppercase font-black text-[10px]">{statusLabels[s as TaskStatus].toUpperCase()}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterFaculty} onValueChange={setFilterFaculty}>
                    <SelectTrigger className="w-48 h-10 bg-background/50 border-white/5 font-bold text-[10px] tracking-widest"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card">
                        <SelectItem value="all" className="uppercase font-black text-[10px]">ALL PERSONNEL</SelectItem>
                        {faculty.map(f => <SelectItem key={f.id} value={f.id} className="uppercase font-black text-[10px]">{f.name.toUpperCase()}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48 h-10 bg-background/50 border-white/5 font-bold text-[10px] tracking-widest"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card">
                        <SelectItem value="all" className="uppercase font-black text-[10px]">ALL TASK TYPES</SelectItem>
                        {TASK_TYPES.map(t => <SelectItem key={t} value={t} className="uppercase font-black text-[10px]">{t.toUpperCase()}</SelectItem>)}
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Task Manifest Table */}
            <motion.div variants={itemVariants}>
                <Card className="border-white/5 bg-card/40 backdrop-blur-xl overflow-hidden shadow-2xl">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02] py-6 px-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black">TASK MANIFEST</CardTitle>
                                <CardDescription className="font-bold opacity-60">Synchronized audit trail of mission objectives.</CardDescription>
                            </div>
                            <Badge variant="secondary" className="h-7 text-[10px] font-black uppercase tracking-widest bg-white/5 border-none">{filteredTasks.length} INDEXED</Badge>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5 text-left">
                                    <th className="p-4 pl-8 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Class</th>
                                    <th className="p-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Subject Sector</th>
                                    <th className="p-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Target Entity</th>
                                    <th className="p-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Temporal Boundary</th>
                                    <th className="p-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Status Verification</th>
                                    <th className="p-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Data Sink</th>
                                    <th className="p-4 pr-8 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right">Ops</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filteredTasks.map((task, idx) => (
                                    <motion.tr 
                                        key={task.id} 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group transition-all hover:bg-white/[0.02]"
                                    >
                                        <td className="p-4 pl-8">
                                            <Badge variant="outline" className="border-white/10 bg-white/5 text-[9px] font-black uppercase h-7 tracking-tighter px-3">
                                                {task.taskType}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-3 w-3 text-primary opacity-40" />
                                                <span className="font-bold text-card-foreground text-sm tracking-tight">{task.subjectName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <User className="h-3 w-3 text-muted-foreground opacity-30" />
                                                <span className="text-xs font-bold text-muted-foreground uppercase">{task.facultyName.split(" ").slice(-1)[0]}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 font-black text-[10px] text-muted-foreground opacity-60">
                                                <Calendar className="h-3 w-3" /> {task.deadline}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className={cn("inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border shadow-sm", statusColors[task.status])}>
                                                <div className="h-1 w-1 rounded-full bg-current animate-pulse" />
                                                {statusLabels[task.status]}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {task.pdfURL ? (
                                                <Button variant="ghost" size="sm" asChild className="h-8 px-3 gap-2 bg-primary/5 hover:bg-primary/20 text-primary border border-primary/10 rounded-lg group/btn shadow-inner">
                                                    <a href={task.pdfURL} target="_blank" rel="noopener noreferrer">
                                                        <FileText className="h-3 w-3 transition-transform group-hover/btn:scale-110" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">MANIFEST</span>
                                                    </a>
                                                </Button>
                                            ) : (
                                                <span className="text-[10px] font-black text-muted-foreground opacity-20 uppercase tracking-widest">— VACANT —</span>
                                            )}
                                        </td>
                                        <td className="p-4 pr-8 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-white/5 hover:text-primary" onClick={() => setDetailTask(task)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500" onClick={() => handleDelete(task.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {filteredTasks.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-24 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                                                <Layers className="h-12 w-12" />
                                                <div className="space-y-1">
                                                    <p className="font-black uppercase tracking-[0.3em] text-sm text-muted-foreground">Zero Manifests Indexed</p>
                                                    <p className="text-[10px] font-bold italic text-muted-foreground">Initialize a task directive to start tracking performance metrics.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </motion.div>

            {/* Inspect Dialog */}
            <Dialog open={!!detailTask} onOpenChange={(o) => { if (!o) setDetailTask(null) }}>
                <DialogContent className="sm:max-w-2xl bg-card border-white/10 shadow-3xl overflow-hidden p-0">
                    {detailTask && (
                        <>
                            <div className="h-32 w-full bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-b border-white/5 flex items-center px-8 relative">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
                                <div className="flex items-center gap-4 relative z-10 w-full">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl">
                                        <Info className="h-8 w-8 text-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                                    </div>
                                    <div>
                                        <Badge variant="outline" className="mb-1 border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest">{detailTask.taskType}</Badge>
                                        <h2 className="text-2xl font-black text-card-foreground tracking-tight uppercase leading-none">{detailTask.subjectName}</h2>
                                    </div>
                                    <div className="ml-auto">
                                         <Badge className={cn("px-4 py-1.5 font-black uppercase text-[10px] tracking-widest border-none shadow-lg", statusColors[detailTask.status])}>
                                            {statusLabels[detailTask.status]}
                                         </Badge>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {[
                                        { label: "Temporal Cap", value: detailTask.deadline, icon: Calendar },
                                        { label: "Entity Target", value: detailTask.facultyName.split(" ").slice(-1)[0], icon: User },
                                        { label: "Subject Domain", value: detailTask.subjectName.split(" ").slice(0, 1)[0], icon: Layers },
                                        { label: "Sync Status", value: "ENCRYPTED", icon: ShieldCheck },
                                    ].map(info => (
                                        <div key={info.label} className="space-y-1">
                                            <div className="flex items-center gap-1.5 opacity-40">
                                                <info.icon className="h-3 w-3 text-primary" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{info.label}</span>
                                            </div>
                                            <p className="font-bold text-card-foreground uppercase text-xs truncate">{info.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50 flex items-center gap-2">
                                        <div className="h-px w-8 bg-current" /> Logistical Description
                                    </h4>
                                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 italic font-medium leading-relaxed text-muted-foreground text-sm shadow-inner min-h-[100px]">
                                        {detailTask.description || "NO QUALITATIVE DATA PROVIDED FOR THIS MANIFEST."}
                                    </div>
                                </div>

                                {detailTask.pdfURL && (
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50 flex items-center gap-2">
                                            <div className="h-px w-8 bg-current" /> Submitted Artifact
                                        </h4>
                                        <div className="flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                                            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary group transition-all cursor-pointer hover:bg-primary/30">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-black text-card-foreground text-xs uppercase tracking-tight">Personnel_submission_artifact.pdf</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Submitted via Encrypted Tunnel</p>
                                            </div>
                                            <Button variant="ghost" size="sm" asChild className="h-9 px-4 font-black uppercase text-[9px] tracking-widest text-primary hover:bg-primary/10 transition-all">
                                                <a href={detailTask.pdfURL} target="_blank" rel="noopener noreferrer">Initialize View</a>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <DialogFooter className="p-8 border-t border-white/5 bg-white/[0.02] flex gap-3">
                                <div className="flex-1 text-[10px] font-bold italic text-muted-foreground opacity-30 mt-2">MANIFEST ID: {detailTask.id?.slice(-12).toUpperCase()}</div>
                                <div className="flex gap-2">
                                    {detailTask.status === "submitted" && (
                                        <Button size="sm" onClick={() => { handleStatusChange(detailTask.id, "completed"); setDetailTask(null) }} className="h-10 px-6 font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 border-none text-white">
                                            <Check className="h-4 w-4" /> Finalize Manifest
                                        </Button>
                                    )}
                                    <Button size="sm" variant="outline" onClick={() => handleDelete(detailTask.id)} className="h-10 px-6 font-black uppercase text-[10px] tracking-widest gap-2 bg-transparent border-white/10 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20">
                                        <Trash2 className="h-4 w-4" /> Terminate
                                    </Button>
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}

function cn(...classes: (string | undefined | null | boolean)[]) { return classes.filter(Boolean).join(" ") }
