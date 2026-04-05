"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"
import { useFacultyById, useLocationAttendance, useFeedback, useFacultyAssignedSubjects, useSubjects, useTasks, uploadTaskPDF, submitTask } from "@/lib/api-service"
import type { TaskStatus } from "@/lib/types"
import { Star, TrendingUp, Clock, UserCircle, CheckCircle2, ClipboardList, AlertTriangle, Upload, FileText, Loader2, Award, BookOpen, MessageSquare, Zap, BarChart3 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts"
import { motion, AnimatePresence, animate, type Variants } from "framer-motion"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

const attendanceConfig = {
  count: { label: "Classes", color: "hsl(var(--primary))" },
}

const statusColors: Record<TaskStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  "in-progress": "bg-blue-500/10 text-blue-600 border-blue-500/30",
  submitted: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  completed: "bg-green-500/10 text-green-600 border-green-500/30",
  overdue: "bg-red-500/10 text-red-600 border-red-500/30",
}

function AnimatedCounter({ value, duration = 2 }: { value: number | string, duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const isNumber = typeof value === "number"
  const target = isNumber ? value : parseFloat(value.toString().replace(/[^0-9.]/g, ""))

  useEffect(() => {
    const controls = animate(0, target, {
      duration,
      onUpdate: (latestValue) => setDisplayValue(latestValue)
    })
    return () => controls.stop()
  }, [target, duration])

  if (!isNumber && value.toString().includes("%")) {
    return <span>{Math.round(displayValue)}%</span>
  }
  if (!isNumber && value.toString().includes("/")) {
    return <span>{displayValue.toFixed(1)}/5</span>
  }
  if (!isNumber && value.toString().includes("h")) {
    return <span>{Math.round(displayValue)}h</span>
  }
  
  return <span>{isNumber ? Math.round(displayValue) : value}</span>
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 100 
    } 
  }
}

export function FacultyDashboardView() {
  const { getFacultyId } = useAuth()
  const facultyId = getFacultyId()
  const { data: faculty, loading: loadingFaculty } = useFacultyById(facultyId)
  const { data: locationAttendance, loading: loadingAttendance } = useLocationAttendance(facultyId || undefined)
  const { data: feedback, loading: loadingFeedback } = useFeedback(facultyId || undefined)
  const { data: subjects, loading: loadingSubjects } = useFacultyAssignedSubjects(facultyId)
  const { data: allSubjectsData } = useSubjects()
  const { data: tasks, loading: loadingTasks } = useTasks(facultyId || undefined)

  const loading = loadingFaculty || loadingAttendance || loadingFeedback || loadingSubjects || loadingTasks

  const totalClasses = locationAttendance.length
  const presentClasses = locationAttendance.filter(a => a.status === "present").length
  const attendancePercent = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0

  const enrichedSubjects = subjects.map(s => {
    const full = allSubjectsData.find(fs => fs.id === s.id)
    return {
      ...s,
      totalHours: full?.totalHours ?? 0,
      completedHours: full?.completedHours ?? 0,
    }
  })

  const today = new Date().toISOString().split("T")[0]

  const myTasks = useMemo(() =>
    tasks.map(t => {
      if (t.status !== "completed" && t.status !== "submitted" && t.deadline < today) {
        return { ...t, status: "overdue" as TaskStatus }
      }
      return t
    }).sort((a, b) => {
      const order: Record<TaskStatus, number> = { overdue: 0, pending: 1, "in-progress": 2, submitted: 3, completed: 4 }
      return order[a.status] - order[b.status]
    }),
    [tasks, today]
  )

  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)

  const handleUploadPDF = async (taskId: string, file: File) => {
    setUploadingTaskId(taskId)
    try {
      const pdfURL = await uploadTaskPDF(taskId, file)
      await submitTask(taskId, pdfURL)
    } catch (err) {
      console.error("Failed to upload PDF:", err)
    } finally {
      setUploadingTaskId(null)
    }
  }

  const avgFeedback = feedback.length > 0
    ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length
    : 0

  const attendanceChartData = useMemo(() => {
    if (!locationAttendance || locationAttendance.length === 0) return []
    const dateMap = new Map<string, number>()
    locationAttendance.filter(a => a.status === "present").forEach(a => {
      dateMap.set(a.date, (dateMap.get(a.date) || 0) + 1)
    })
    return Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, count]) => ({ date: date.slice(5), count }))
  }, [locationAttendance])

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing Intelligence...</p>
      </div>
    )
  }

  if (!faculty) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="border-white/5 bg-card/50 backdrop-blur-xl">
          <CardContent className="flex items-center justify-center p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <AlertTriangle className="h-12 w-12 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No faculty profile found.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-8 pb-12"
    >
      {/* Profile Section */}
      <motion.div variants={itemVariants}>
        <Card className="group relative overflow-hidden border-white/5 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-2xl">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <CardContent className="flex flex-col items-start gap-8 p-8 sm:flex-row sm:items-center">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary to-purple-600 opacity-20 blur group-hover:opacity-40 transition-opacity" />
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primary text-4xl font-bold text-white shadow-2xl">
                {faculty.name.charAt(0)}
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{faculty.name}</h2>
                <p className="text-muted-foreground font-medium">{faculty.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-3 py-1">
                  <Award className="mr-1.5 h-3.5 w-3.5" />
                  {faculty.department}
                </Badge>
                <Badge variant="secondary" className="bg-muted/50 backdrop-blur-md px-3 py-1">
                  {faculty.experience} Years Experience
                </Badge>
                {subjects.slice(0, 3).map(s => (
                  <Badge key={s.id} variant="outline" className="border-primary/20 bg-primary/5 px-3 py-1">
                    {s.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Performance", value: faculty.performanceScore, icon: TrendingUp, color: "from-blue-500 to-cyan-400" },
          { label: "Attendance", value: totalClasses > 0 ? `${attendancePercent}%` : "0%", icon: UserCircle, color: "from-purple-500 to-pink-400" },
          { label: "Avg Feedback", value: `${avgFeedback.toFixed(1)}/5`, icon: Star, color: "from-amber-500 to-orange-400" },
          { label: "Lecture Hours", value: `${faculty.lectureHours}h`, icon: Clock, color: "from-emerald-500 to-teal-400" },
        ].map((stat, idx) => (
          <motion.div key={stat.label} variants={itemVariants} whileHover={{ y: -5, scale: 1.02 }} className="h-full">
            <Card className="h-full group relative overflow-hidden border-white/5 bg-card/40 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20">
              <div className={cn("absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r", stat.color)} />
              <CardContent className="flex items-center gap-5 p-6">
                <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg", stat.color)}>
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">{stat.label}</p>
                  <p className="text-3xl font-black tracking-tight text-foreground">
                    <AnimatedCounter value={stat.value} />
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Tasks */}
        <motion.div variants={itemVariants} className="lg:col-span-7">
          <Card className="h-full border-white/5 bg-card/40 backdrop-blur-xl overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold">
                    <ClipboardList className="h-5 w-5 text-primary" /> Active Tasks
                  </CardTitle>
                  <CardDescription>System assigned responsibilities</CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {myTasks.filter(t => t.status !== "completed").length} Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ScrollArea className="h-[400px] pr-4">
                {myTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground opacity-50">
                    <Zap className="mb-2 h-8 w-8" />
                    <p>No active tasks at the moment.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {myTasks.map(task => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ x: 5 }}
                        className={cn(
                          "group relative flex flex-col gap-3 rounded-2xl border p-5 transition-all duration-300",
                          task.status === "overdue"
                            ? "border-red-500/20 bg-red-500/5 shadow-lg shadow-red-500/5"
                            : task.status === "completed"
                              ? "border-green-500/10 bg-green-500/5"
                              : "border-white/5 bg-muted/30 hover:bg-muted/50 hover:border-primary/20"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="bg-background/50 backdrop-blur-sm text-[10px] font-bold uppercase">{task.taskType}</Badge>
                              <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", statusColors[task.status])}>
                                {task.status === "overdue" && <AlertTriangle className="mr-1 h-3 w-3" />}
                                {task.status}
                              </Badge>
                            </div>
                            <h4 className="font-bold text-foreground truncate">{task.subjectName}</h4>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{task.description}</p>
                            )}
                          </div>
                          
                          {task.status !== "completed" && task.status !== "submitted" && (
                            <Button
                              size="sm"
                              className="shrink-0 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-9 px-4 rounded-xl transition-all hover:scale-105"
                              disabled={uploadingTaskId === task.id}
                              onClick={() => {
                                setPendingTaskId(task.id)
                                fileInputRef.current?.click()
                              }}
                            >
                              {uploadingTaskId === task.id ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /></>
                              ) : (
                                <><Upload className="h-4 w-4" /></>
                              )}
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                           <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <Clock className="h-3 w-3 text-primary" />
                            {task.deadline}
                          </div>
                          {task.pdfURL && (
                            <a href={task.pdfURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                              <FileText className="h-3.5 w-3.5" /> View Submission
                            </a>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column: Attendance & Analytics */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <motion.div variants={itemVariants}>
            <Card className="border-white/5 bg-card/40 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" /> Attendance Trend
                </CardTitle>
                <CardDescription>Presence analytics for the last 14 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] w-full pt-4">
                  {attendanceChartData.length > 0 ? (
                    <ChartContainer config={attendanceConfig} className="h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={attendanceChartData}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }} />
                          <YAxis hide />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorCount)"
                            animationDuration={2000}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground opacity-50">
                      No attendance trend data.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Syllabus Progress */}
          <motion.div variants={itemVariants}>
            <Card className="border-white/5 bg-card/40 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Syllabus Mastery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {enrichedSubjects.map(s => {
                  const pct = s.totalHours > 0 ? Math.round((s.completedHours / s.totalHours) * 100) : 0
                  return (
                    <div key={s.id} className="space-y-2 group">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">{s.name}</span>
                        <span className="font-black text-primary">{pct}%</span>
                      </div>
                      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-primary to-purple-600 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        <span>Modules Completed: {s.completedHours}</span>
                        <span>Target: {s.totalHours}</span>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Feedback Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-white/5 bg-card/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Student Voice
            </CardTitle>
            <CardDescription>Recent feedback and teaching performance insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feedback.slice(0, 6).map(fb => (
                <motion.div
                  key={fb.id}
                  whileHover={{ scale: 1.02 }}
                  className="relative flex flex-col gap-4 rounded-2xl border border-white/5 bg-muted/20 p-5 group hover:bg-muted/40 transition-all duration-300"
                >
                   <div className="absolute top-4 right-4 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={cn("h-3 w-3", i <= fb.rating ? "fill-amber-400 text-amber-400" : "text-white/10")} />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm">
                      {fb.studentName.charAt(0)}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-foreground">{fb.studentName}</h5>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">{fb.subject}</p>
                    </div>
                  </div>
                  <p className="text-xs italic text-muted-foreground/80 leading-relaxed">&quot;{fb.comment}&quot;</p>
                  <div className="text-[10px] font-bold text-muted-foreground/40 mt-auto">{fb.date}</div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Hidden file input for PDF upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && pendingTaskId) {
            handleUploadPDF(pendingTaskId, file)
            setPendingTaskId(null)
          }
          e.target.value = ""
        }}
      />
    </motion.div>
  )
}


