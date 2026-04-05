"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { useFaculty, useSubjects, addSubject, updateSubject, deleteSubject, syncAssignedSubjectsOnFacultyDocs } from "@/lib/api-service"
import type { Subject } from "@/lib/types"
import { Plus, BookOpen, Pencil, Trash2, Users, Search, Filter, Check, X, Briefcase, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedCounter } from "./animated-counter"

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
}

export function SubjectManagement() {
    const { data: faculty, loading: loadingFaculty } = useFaculty()
    const { data: subjects, loading: loadingSubjects } = useSubjects()

    const [search, setSearch] = useState("")
    const [filterDept, setFilterDept] = useState("all")

    // Create form state
    const [createOpen, setCreateOpen] = useState(false)
    const [formName, setFormName] = useState("")
    const [formDepartment, setFormDepartment] = useState("")
    const [formTotalHours, setFormTotalHours] = useState("")
    const [formFacultyIds, setFormFacultyIds] = useState<string[]>([])
    const [formSaving, setFormSaving] = useState(false)
    const [formError, setFormError] = useState("")
    const [successMsg, setSuccessMsg] = useState("")

    // Edit state
    const [editSubject, setEditSubject] = useState<Subject | null>(null)
    const [editOpen, setEditOpen] = useState(false)

    const loading = loadingFaculty || loadingSubjects

    const departments = useMemo(() => [...new Set(faculty.map(f => f.department))].sort(), [faculty])

    const filteredSubjects = useMemo(() => {
        return subjects
            .filter(s => filterDept === "all" || s.department === filterDept)
            .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [subjects, filterDept, search])

    const toggleFaculty = (fid: string) => {
        setFormFacultyIds(prev => prev.includes(fid) ? prev.filter(id => id !== fid) : [...prev, fid])
    }

    const resetForm = () => {
        setFormName("")
        setFormDepartment("")
        setFormTotalHours("")
        setFormFacultyIds([])
        setFormError("")
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError("")
        if (!formName.trim() || !formDepartment || !formTotalHours || formFacultyIds.length === 0) {
            setFormError("Please fill all fields and select at least one faculty")
            return
        }
        
        const exists = subjects.some(
            s => s.name.toLowerCase() === formName.trim().toLowerCase() && s.department === formDepartment
        )
        if (exists) {
            setFormError("A subject with this name already exists in this department")
            return
        }

        setFormSaving(true)
        try {
            const newId = await addSubject({
                name: formName.trim(),
                department: formDepartment,
                facultyIds: formFacultyIds,
                totalHours: parseInt(formTotalHours),
                completedHours: 0,
            })
            await syncAssignedSubjectsOnFacultyDocs(newId, formName.trim(), [], formFacultyIds)
            setSuccessMsg(`Subject "${formName}" created successfully`)
            resetForm()
            setCreateOpen(false)
            setTimeout(() => setSuccessMsg(""), 3000)
        } catch (err: any) {
            setFormError(err.message || "Failed to create subject")
        } finally {
            setFormSaving(false)
        }
    }

    const openEdit = (s: Subject) => {
        setEditSubject(s)
        setFormName(s.name)
        setFormDepartment(s.department)
        setFormTotalHours(String(s.totalHours))
        setFormFacultyIds([...(s.facultyIds || [])])
        setFormError("")
        setEditOpen(true)
    }

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editSubject) return
        setFormError("")
        if (!formName.trim() || !formDepartment || !formTotalHours || formFacultyIds.length === 0) {
            setFormError("Please fill all fields and select at least one faculty")
            return
        }
        setFormSaving(true)
        try {
            await updateSubject(editSubject.id, {
                name: formName.trim(),
                department: formDepartment,
                facultyIds: formFacultyIds,
                totalHours: parseInt(formTotalHours),
            })
            await syncAssignedSubjectsOnFacultyDocs(
                editSubject.id,
                formName.trim(),
                editSubject.facultyIds || [],
                formFacultyIds
            )
            setSuccessMsg(`Subject "${formName}" updated successfully`)
            resetForm()
            setEditOpen(false)
            setEditSubject(null)
            setTimeout(() => setSuccessMsg(""), 3000)
        } catch (err: any) {
            setFormError(err.message || "Failed to edit subject")
        } finally {
            setFormSaving(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            await deleteSubject(id)
            setSuccessMsg(`Subject "${name}" deleted`)
            setTimeout(() => setSuccessMsg(""), 3000)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    const stats = [
        { label: "Total Subjects", value: subjects.length, icon: BookOpen, color: "bg-primary/10 text-primary", glow: "shadow-primary/20" },
        { label: "Departments", value: departments.length, icon: Briefcase, color: "bg-indigo-500/10 text-indigo-500", glow: "shadow-indigo-500/20" },
        { label: "Faculty Assigned", value: [...new Set(subjects.flatMap(s => s.facultyIds || []))].length, icon: Users, color: "bg-emerald-500/10 text-emerald-500", glow: "shadow-emerald-500/20" },
    ]

    const formFields = (
        <div className="grid grid-cols-1 gap-6 py-4">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><BookOpen className="h-3 w-3" /> Subject Name</Label>
                    <Input value={formName} onChange={e => setFormName(e.target.value)} required placeholder="e.g. Data Structures & Algorithms" className="bg-background/50 border-white/5 h-11" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Briefcase className="h-3 w-3" /> Department</Label>
                        <Select value={formDepartment} onValueChange={setFormDepartment}>
                            <SelectTrigger className="bg-background/50 border-white/5 h-11">
                                <SelectValue placeholder="Select dept" />
                            </SelectTrigger>
                            <SelectContent className="bg-card/90 backdrop-blur-xl border-white/10">
                                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Clock className="h-3 w-3" /> Total Hours</Label>
                        <Input type="number" value={formTotalHours} onChange={e => setFormTotalHours(e.target.value)} required className="bg-background/50 border-white/5 h-11" placeholder="60" min="1" />
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Users className="h-3 w-3" /> Assign Faculty</Label>
                    <div className="flex flex-wrap gap-2 rounded-xl border border-white/5 p-3 bg-background/30 max-h-48 overflow-y-auto custom-scrollbar">
                        {faculty
                        .filter(f => !formDepartment || f.department === formDepartment)
                        .map(f => {
                            const selected = formFacultyIds.includes(f.id)
                            return (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => toggleFaculty(f.id)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all border ${selected
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                        : "bg-card/50 text-muted-foreground border-white/5 hover:bg-white/10"
                                        }`}
                                >
                                    {f.name}
                                </button>
                            )
                        })}
                        {faculty.filter(f => !formDepartment || f.department === formDepartment).length === 0 && (
                            <p className="w-full py-4 text-center text-xs text-muted-foreground italic">Select a department first to see eligible faculty</p>
                        )}
                    </div>
                    {formFacultyIds.length > 0 && (
                        <p className="text-xs font-bold text-primary">{formFacultyIds.length} faculty selected</p>
                    )}
                </div>
            </div>
            {formError && (
                <div className="text-sm font-bold text-destructive flex items-center gap-2 p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                    <X className="h-4 w-4" /> {formError}
                </div>
            )}
        </div>
    )

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-8 pb-12"
        >
            <AnimatePresence>
                {successMsg && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-600 shadow-xl backdrop-blur-md dark:text-emerald-400"
                    >
                        <Check className="h-5 w-5" />
                        <span className="text-sm font-semibold">{successMsg}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <motion.div variants={itemVariants} className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-card-foreground">
                        Subject <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">Curriculum</span>
                    </h1>
                    <p className="text-muted-foreground">Manage academic subjects and instructor assignments.</p>
                </motion.div>
                <motion.div variants={itemVariants}>
                    <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm() }}>
                        <DialogTrigger asChild>
                            <Button className="h-11 px-6 font-bold shadow-lg shadow-primary/20">
                                <Plus className="mr-2 h-5 w-5" /> New Subject
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl border-white/10 bg-card/95 backdrop-blur-2xl shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Add Subject</DialogTitle>
                                <DialogDescription>Create a new curriculum entry and assign instructional staff.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate}>
                                {formFields}
                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} disabled={formSaving}>Cancel</Button>
                                    <Button type="submit" disabled={formSaving} className="min-w-[120px] font-black">
                                        {formSaving ? "Creating..." : "Save Subject"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </motion.div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {stats.map(stat => (
                    <motion.div key={stat.label} variants={itemVariants}>
                        <Card className="relative overflow-hidden border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/60">
                            <CardContent className="flex items-center gap-4 p-6">
                                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform", stat.color, stat.glow)}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-2xl font-black text-card-foreground">
                                        <AnimatedCounter value={stat.value} />
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Filters & Actions */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-4">
                <div className="relative flex-1 min-w-[280px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by subject name..."
                        className="pl-10 bg-background/50 border-white/5 h-11 focus:ring-primary"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    <Select value={filterDept} onValueChange={setFilterDept}>
                        <SelectTrigger className="w-48 h-11 bg-background/50 border-white/5">
                            <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent className="bg-card/90 backdrop-blur-xl border-white/10">
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </motion.div>

            {/* Subect List Table */}
            <motion.div variants={itemVariants}>
                <Card className="border-white/5 bg-card/40 backdrop-blur-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5 text-left">
                                    <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground">Subject Title</th>
                                    <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground">Department</th>
                                    <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground">Assigned Faculty</th>
                                    <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground">Progress</th>
                                    <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                                {filteredSubjects.map(s => (
                                    <motion.tr key={s.id} variants={itemVariants} className="border-b border-white/10 transition-all hover:bg-white/[0.03] group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary font-black shadow-inner">
                                                    <BookOpen className="h-5 w-5" />
                                                </div>
                                                <span className="font-black text-card-foreground text-base tracking-tight">{s.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="secondary" className="font-bold text-[10px] uppercase shadow-sm">{s.department}</Badge>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1 max-w-[300px]">
                                                {(s.facultyIds || []).map(fid => {
                                                    const fac = faculty.find(f => f.id === fid)
                                                    return (
                                                        <Badge key={fid} variant="outline" className="border-white/10 bg-white/5 text-[10px] font-bold">
                                                            {fac?.name || "Unknown"}
                                                        </Badge>
                                                    )
                                                })}
                                                {(s.facultyIds || []).length === 0 && <span className="text-[10px] text-muted-foreground italic tracking-tight">Needs Assignment</span>}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-2 min-w-[120px]">
                                                <div className="flex items-center justify-between text-[11px] font-black uppercase text-muted-foreground">
                                                    <span>{Math.round((s.completedHours / s.totalHours) * 100)}% Complete</span>
                                                    <span>{s.completedHours}/{s.totalHours}h</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(s.completedHours / s.totalHours) * 100}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className="h-full bg-gradient-to-r from-primary to-violet-500 shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(s)} className="h-9 w-9 text-muted-foreground hover:bg-primary/20 hover:text-primary">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id, s.name)} className="h-9 w-9 text-muted-foreground hover:bg-rose-500/20 hover:text-rose-500">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {filteredSubjects.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="rounded-full bg-white/5 p-4 shadow-inner">
                                                    <BookOpen className="h-10 w-10 text-muted-foreground" />
                                                </div>
                                                <p className="font-bold text-muted-foreground">No subjects found matching your criteria</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </motion.tbody>
                        </table>
                    </div>
                </Card>
            </motion.div>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { resetForm(); setEditSubject(null) } }}>
                <DialogContent className="max-w-xl border-white/10 bg-card/95 backdrop-blur-2xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Edit Subject</DialogTitle>
                        <DialogDescription>Update subject details and staff assignments.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit}>
                        {formFields}
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} disabled={formSaving}>Cancel</Button>
                            <Button type="submit" disabled={formSaving} className="min-w-[120px] font-black">
                                {formSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}

function cn(...classes: (string | undefined | null | boolean)[]) {
    return classes.filter(Boolean).join(" ")
}
