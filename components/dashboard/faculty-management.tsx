"use client"

import React, { useState, useMemo } from "react"
import type { Faculty } from "@/lib/types"
import { 
  useFaculty, 
  useSubjects, 
  useDepartments, 
  updateFaculty, 
  deleteFaculty, 
  createFacultyWithAuth, 
  getUserUidByEmail, 
  syncFacultySubjects 
} from "@/lib/api-service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Pencil, Trash2, Filter, Mail, User, Briefcase, GraduationCap, X, ChevronRight, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
}

export function FacultyManagement() {
  const { data: faculty, loading } = useFaculty()
  const { data: allSubjects } = useSubjects()
  const { data: departments } = useDepartments()
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null)

  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formDept, setFormDept] = useState("")
  const [formSubjectIds, setFormSubjectIds] = useState<string[]>([])
  const [formAssignedSubjectEntries, setFormAssignedSubjectEntries] = useState<{ subjectId: string; subjectName: string }[]>([])
  const [formExperience, setFormExperience] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const filtered = faculty.filter(f => {
    const matchSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === "all" || f.department === deptFilter
    return matchSearch && matchDept
  })

  // Toggle a subject in the assignedSubjectEntries list
  const toggleAssignedSubject = (subjectId: string, subjectName: string) => {
    setFormAssignedSubjectEntries(prev => {
      const exists = prev.some(e => e.subjectId === subjectId)
      if (exists) return prev.filter(e => e.subjectId !== subjectId)
      return [...prev, { subjectId, subjectName }]
    })
    setFormSubjectIds(prev => {
      if (prev.includes(subjectId)) return prev.filter(id => id !== subjectId)
      return [...prev, subjectId]
    })
  }

  const resetForm = () => {
    setFormName("")
    setFormEmail("")
    setFormPassword("")
    setFormDept("")
    setFormSubjectIds([])
    setFormAssignedSubjectEntries([])
    setFormExperience("")
    setEditingFaculty(null)
    setFormError("")
  }

  const openAddDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (f: Faculty) => {
    setEditingFaculty(f)
    setFormName(f.name)
    setFormEmail(f.email)
    setFormDept(f.department)
    setFormSubjectIds([...(f.subjectIds || [])])
    
    // Load existing assignedSubjects into the structured entries
    const entries = (f.assignedSubjects || []).map((entry: { subjectId: string; subjectName: string } | string) => {
      if (typeof entry === "string") {
        const match = allSubjects.find(s => s.name === entry)
        return match ? { subjectId: match.id, subjectName: match.name } : { subjectId: `manual_${entry}`, subjectName: entry }
      }
      return entry
    })
    setFormAssignedSubjectEntries(entries)
    setFormExperience(String(f.experience))
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setSubmitting(true)

    try {
      if (editingFaculty) {
        // 1. Update Faculty in Database
        await updateFaculty(editingFaculty.id, {
          name: formName,
          email: formEmail,
          department: formDept,
          subjectIds: formSubjectIds,
          assignedSubjects: formAssignedSubjectEntries,
          experience: Number(formExperience),
        })

        // 2. Sync Subjects
        await syncFacultySubjects(editingFaculty.id, editingFaculty.subjectIds || [], formSubjectIds)

        // 3. Update User Auth and Firestore User Document
        const uid = editingFaculty.userId || await getUserUidByEmail(editingFaculty.email)
        
        if (uid) {
          // Update name/email in Firestore users collection
          const userRes = await fetch(`/api/db/users?uid=${uid}`)
          if (userRes.ok) {
            const users = await userRes.json()
            if (users && users.length > 0) {
              await fetch(`/api/db/users?id=${users[0].id}`, {
                method: "PUT",
                body: JSON.stringify({ name: formName, email: formEmail })
              })
            }
          }
        }

        // 4. Update password/email in Firebase via upsert-user route
        if (formPassword.length > 0 || formEmail !== editingFaculty.email || formName !== editingFaculty.name || !uid) {
          const payload = {
            email: formEmail,
            password: formPassword || "KeepCurrentPassword123!", // Dummy password if not changing, as our API currently expects one.
            name: formName,
            role: "faculty",
            facultyId: editingFaculty.id
          }
          
          const res = await fetch("/api/auth/admin/upsert-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
          
          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || "Failed to update authentication account")
          }
          
          const data = await res.json()
          if (data.uid && data.uid !== uid) {
            await updateFaculty(editingFaculty.id, { userId: data.uid })
          }
        }
        
        setSuccessMsg("Faculty profile updated successfully")
      } else {
        // Create Logic
        if (formPassword.length < 6) {
          throw new Error("Password must be at least 6 characters")
        }
        
        const newFacultyId = await createFacultyWithAuth(
          {
            userId: "",
            name: formName,
            email: formEmail,
            department: formDept,
            subjectIds: formSubjectIds,
            assignedSubjects: formAssignedSubjectEntries,
            experience: Number(formExperience),
            attendancePercent: 0,
            feedbackScore: 0,
            performanceScore: 0,
            lectureHours: 0,
            syllabusCompletion: 0,
          },
          formPassword
        )
        
        if (newFacultyId) {
          await syncFacultySubjects(newFacultyId, [], formSubjectIds)
        }
        setSuccessMsg("Faculty member added successfully")
      }
      
      setDialogOpen(false)
      resetForm()
      setTimeout(() => setSuccessMsg(""), 3000)
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this faculty member?")) {
      await deleteFaculty(id)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-600 shadow-lg backdrop-blur-md dark:text-emerald-400"
          >
            <Check className="h-5 w-5" />
            <span className="text-sm font-semibold">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="border-white/5 bg-card/40 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-2xl font-black tracking-tight">Faculty <span className="text-primary">Management</span></CardTitle>
            <CardDescription>Manage your institutional workforce and subject assignments.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search faculty..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-background/50 pl-10 h-10 border-white/5 focus:ring-primary sm:w-60"
              />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full bg-background/50 h-10 border-white/5 sm:w-44">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <SelectValue placeholder="Department" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-card/90 backdrop-blur-xl border-white/10">
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="h-10 px-6 font-bold shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-5 w-5" /> Add Faculty
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl border-white/10 bg-card/95 backdrop-blur-2xl shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">{editingFaculty ? "Edit Profile" : "New Faculty"}</DialogTitle>
                  <DialogDescription>
                    Provide the necessary details to {editingFaculty ? "update" : "create"} a faculty account.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><User className="h-3 w-3" /> Full Name</Label>
                      <Input value={formName} onChange={e => setFormName(e.target.value)} required className="bg-background/50 border-white/5 h-11" placeholder="Dr. Jane Smith" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Mail className="h-3 w-3" /> Email Address</Label>
                      <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required className="bg-background/50 border-white/5 h-11" placeholder="jane@college.edu" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Mail className="h-3 w-3" /> {editingFaculty ? "Change Password" : "Account Password"}</Label>
                      <Input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} required={!editingFaculty} minLength={6} placeholder={editingFaculty ? "Leave blank to keep current" : "Min 6 characters"} className="bg-background/50 border-white/5 h-11" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Briefcase className="h-3 w-3" /> Department</Label>
                      <Select value={formDept} onValueChange={setFormDept}>
                        <SelectTrigger className="bg-background/50 border-white/5 h-11">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent className="bg-card/90 backdrop-blur-xl border-white/10">
                          {departments.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><GraduationCap className="h-3 w-3" /> Subjects</Label>
                      <div className="flex flex-wrap gap-2 rounded-xl border border-white/5 p-3 bg-background/30 max-h-44 overflow-y-auto custom-scrollbar">
                        {allSubjects.map(s => {
                          const selected = formAssignedSubjectEntries.some(e => e.subjectId === s.id)
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleAssignedSubject(s.id, s.name)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all border ${selected
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                : "bg-card/50 text-muted-foreground border-white/5 hover:bg-white/10"
                                }`}
                            >
                              {s.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Experience (Years)</Label>
                      <Input type="number" value={formExperience} onChange={e => setFormExperience(e.target.value)} required className="bg-background/50 border-white/5 h-11" placeholder="e.g. 10" />
                    </div>
                  </div>
                  {formError && (
                    <div className="col-span-1 md:col-span-2 text-sm font-bold text-destructive flex items-center gap-2 p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                      <X className="h-4 w-4" /> {formError}
                    </div>
                  )}
                  <DialogFooter className="col-span-1 md:col-span-2 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
                    <Button type="submit" disabled={submitting} className="min-w-[120px] font-black">
                      {submitting ? "Processing..." : editingFaculty ? "Save Changes" : "Create Account"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-white/5 shadow-inner">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-left">
                  <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground">Faculty Member</th>
                  <th className="hidden p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground md:table-cell">Department</th>
                  <th className="hidden p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground lg:table-cell">Assigned Subjects</th>
                  <th className="hidden p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground sm:table-cell">Metrics</th>
                  <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                {filtered.map(f => (
                  <motion.tr key={f.id} variants={itemVariants} className="border-b border-white/10 transition-all hover:bg-white/[0.03] group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-500 font-black text-white shadow-lg">
                          {f.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-card-foreground">{f.name}</span>
                          <span className="text-xs text-muted-foreground">{f.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden p-4 md:table-cell">
                      <Badge variant="secondary" className="font-bold text-[10px] uppercase shadow-sm">{f.department}</Badge>
                    </td>
                    <td className="hidden p-4 lg:table-cell max-w-[250px]">
                      <div className="flex flex-wrap gap-1">
                        {(f.assignedSubjects || []).length > 0 ? (
                          f.assignedSubjects.map((entry: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="border-white/10 bg-white/5 text-[10px] font-bold">
                              {typeof entry === "string" ? entry : entry.subjectName}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Pending Assignment</span>
                        )}
                      </div>
                    </td>
                    <td className="hidden p-4 sm:table-cell">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-muted-foreground">Exp</span>
                          <span className="font-bold text-card-foreground">{f.experience}y</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-muted-foreground">Perf</span>
                          <span className="font-bold text-primary">{f.performanceScore}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(f)} className="h-9 w-9 text-muted-foreground hover:bg-primary/20 hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)} className="h-9 w-9 text-muted-foreground hover:bg-rose-500/20 hover:text-rose-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="rounded-full bg-white/5 p-4 shadow-inner">
                          <Search className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <p className="font-bold text-muted-foreground">No faculty members found matching your criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </motion.tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
