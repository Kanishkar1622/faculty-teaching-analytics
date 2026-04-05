"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"
import { useFacultyById, useFacultyAssignedSubjects, useSubjects, useSyllabusUpdates, submitSyllabusUpdate, useSubjectProgress } from "@/lib/api-service"
import { BookOpen, CheckCircle2, Clock, FileEdit } from "lucide-react"

export function SyllabusUpdateForm() {
    const { getFacultyId } = useAuth()
    const facultyId = getFacultyId()
    const { data: faculty, loading: loadingFaculty } = useFacultyById(facultyId)
    const { data: assignedSubjects, loading: loadingAssigned } = useFacultyAssignedSubjects(facultyId)
    const { data: subjectsFromCollection, loading: loadingSubjects } = useSubjects(facultyId || undefined)
    const { data: updates, loading: loadingUpdates } = useSyllabusUpdates(facultyId || undefined)

    const [selectedSubject, setSelectedSubject] = useState("")
    const [hours, setHours] = useState("")
    const [topics, setTopics] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState("")

    const { completed: facultyCompleted, loading: loadingProgress } = useSubjectProgress(facultyId, selectedSubject || null)

    const loading = loadingFaculty || loadingAssigned || loadingSubjects || loadingUpdates || loadingProgress

    // Build unified subjects list by merging collection subjects with faculty.assignedSubjects
    const subjects = useMemo(() => {
        const map = new Map<string, { id: string; name: string; totalHours: number; completedHours: number }>()

                // 1. Add subjects from the subjects collection (most reliable key)
        subjectsFromCollection.forEach((s) => {
            const facultyLogs = updates.filter(u => u.subjectId === s.id)
            const facultyCompleted = facultyLogs.reduce((sum, u) => sum + u.hoursCovered, 0)
            
            map.set(s.id, {
                id: s.id,
                name: s.name,
                totalHours: s.totalHours,
                completedHours: facultyCompleted, // Now showing individual faculty progress
            })
        })

        // 2. Merge with assignedSubjects from faculty doc (for backward compatibility/manual entries)
        assignedSubjects.forEach((as) => {
            if (!map.has(as.id)) {
                // If it's a manual entry without a full record, it might have 0 hours in this view
                map.set(as.id, {
                    id: as.id,
                    name: as.name,
                    totalHours: 0,
                    completedHours: 0,
                })
            }
        })

        return Array.from(map.values())
    }, [subjectsFromCollection, assignedSubjects])

    const selectedSub = subjects.find(s => s.id === selectedSubject)
    const remaining = selectedSub ? selectedSub.totalHours - selectedSub.completedHours : 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!selectedSubject || !hours || Number(hours) <= 0) {
            setError("Please select a subject and enter valid hours")
            return
        }

        if (Number(hours) > remaining) {
            setError(`Cannot exceed remaining hours (${remaining}h left)`)
            return
        }

        if (!faculty || !facultyId || !selectedSub) return

        setSubmitting(true)
        try {
            await submitSyllabusUpdate(
                selectedSubject,
                Number(hours),
                topics,
                facultyId,
                faculty.name,
                selectedSub.name,
                selectedSub.completedHours,
                selectedSub.totalHours
            )
            setSubmitted(true)
            setHours("")
            setTopics("")
            setSelectedSubject("")
            setTimeout(() => setSubmitted(false), 3000)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to submit update")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!faculty) {
        return (
            <Card className="border-border bg-card">
                <CardContent className="flex items-center justify-center p-12">
                    <p className="text-muted-foreground">No faculty profile found.</p>
                </CardContent>
            </Card>
        )
    }

    const sortedUpdates = [...updates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
        <div className="flex flex-col gap-6">
            {/* Subject Progress Overview */}
            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-card-foreground">
                        <BookOpen className="h-5 w-5" /> Syllabus Progress
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Your current completion across all subjects</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        {subjects.map((s) => {
                            const pct = s.totalHours > 0 ? Math.round((s.completedHours / s.totalHours) * 100) : 0
                            return (
                                <div key={s.id} className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-card-foreground">{s.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">{s.completedHours}/{s.totalHours}h</span>
                                            <Badge variant={pct >= 90 ? "default" : pct >= 50 ? "secondary" : "outline"} className="text-xs">
                                                {pct}%
                                            </Badge>
                                        </div>
                                    </div>
                                    <Progress value={pct} className="h-2.5" />
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                {/* Update Form */}
                <Card className="border-border bg-card lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-card-foreground">
                            <FileEdit className="h-5 w-5" /> Log Class Update
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">Record hours covered after each class</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {submitted && (
                            <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="text-sm font-medium">Syllabus update recorded!</span>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label className="text-card-foreground">Subject</Label>
                                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                    <SelectTrigger className="bg-background text-foreground">
                                        <SelectValue placeholder="Select subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name} ({s.completedHours}/{s.totalHours}h)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedSub && (
                                <div className="grid grid-cols-3 gap-3 rounded-lg border border-border/50 bg-background p-3 text-sm">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-muted-foreground text-xs uppercase font-semibold">Total</span>
                                        <span className="font-bold text-card-foreground">{selectedSub.totalHours}h</span>
                                    </div>
                                    <div className="flex flex-col gap-1 border-x border-border/50 px-3">
                                        <span className="text-muted-foreground text-xs uppercase font-semibold">Completed</span>
                                        <span className="font-bold text-green-600 dark:text-green-400">{facultyCompleted}h</span>
                                    </div>
                                    <div className="flex flex-col gap-1 pl-3">
                                        <span className="text-muted-foreground text-xs uppercase font-semibold">Remaining</span>
                                        <span className="font-bold text-orange-600 dark:text-orange-400">{selectedSub.totalHours - facultyCompleted}h</span>
                                    </div>
                                    <div className="col-span-3 mt-1">
                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                                            <span>Your Progress</span>
                                            <span>{Math.round((facultyCompleted / selectedSub.totalHours) * 100)}%</span>
                                        </div>
                                        <Progress value={(facultyCompleted / selectedSub.totalHours) * 100} className="h-1.5" />
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <Label className="text-card-foreground">Hours Covered</Label>
                                <Input
                                    type="number"
                                    value={hours}
                                    onChange={e => setHours(e.target.value)}
                                    min="0.5"
                                    max={remaining}
                                    step="0.5"
                                    placeholder="e.g. 2"
                                    required
                                    className="bg-background text-foreground"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label className="text-card-foreground">Topics Covered</Label>
                                <Textarea
                                    value={topics}
                                    onChange={e => setTopics(e.target.value)}
                                    placeholder="e.g. Binary Trees, AVL Trees, Rotations"
                                    rows={3}
                                    className="bg-background text-foreground resize-none"
                                />
                            </div>

                            {error && <p className="text-sm text-destructive">{error}</p>}

                            <Button type="submit" disabled={submitting} className="gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                {submitting ? "Saving..." : "Record Update"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Recent Updates */}
                <Card className="border-border bg-card lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-card-foreground">
                            <Clock className="h-5 w-5" /> Recent Updates
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">Your recent syllabus entries</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sortedUpdates.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">No updates yet</p>
                        ) : (
                            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
                                {sortedUpdates.slice(0, 15).map(u => (
                                    <div key={u.id} className="rounded-lg border border-border/50 bg-background p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-card-foreground">{u.subjectName}</span>
                                            <Badge variant="outline" className="text-xs">{u.hoursCovered}h</Badge>
                                        </div>
                                        {u.topicsCovered && (
                                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{u.topicsCovered}</p>
                                        )}
                                        <p className="mt-1 text-xs text-muted-foreground/60">{u.date}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
