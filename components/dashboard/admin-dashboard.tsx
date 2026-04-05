"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useFaculty, useSubjects, useTasks } from "@/lib/api-service"
import { Users, BookOpen, TrendingUp, Star, ClipboardList, CheckCircle2, AlertTriangle, Clock, Activity, Zap } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { motion, Variants } from "framer-motion"
import { AnimatedCounter } from "./animated-counter"

const performanceChartConfig = {
  score: { label: "Performance", color: "hsl(var(--primary))" },
  attendance: { label: "Attendance", color: "hsl(var(--chart-2))" },
  feedback: { label: "Feedback (x20)", color: "hsl(var(--chart-3))" },
}

const taskChartConfig = {
  completed: { label: "Completed", color: "hsl(var(--chart-2))" },
  pending: { label: "Pending", color: "hsl(var(--chart-4))" },
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
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
}

export function AdminDashboard() {
  const { data: faculty, loading: loadingFaculty } = useFaculty()
  const { data: subjects, loading: loadingSubjects } = useSubjects()
  const { data: tasks, loading: loadingTasks } = useTasks()

  const loading = loadingFaculty || loadingSubjects || loadingTasks
  const today = new Date().toISOString().split("T")[0]

  const avgAttendance = useMemo(() => {
    if (faculty.length === 0) return 0
    return Math.round((faculty.reduce((sum, f) => sum + f.attendancePercent, 0) / faculty.length) * 10) / 10
  }, [faculty])

  const avgFeedback = useMemo(() => {
    if (faculty.length === 0) return 0
    return Math.round((faculty.reduce((sum, f) => sum + f.feedbackScore, 0) / faculty.length) * 10) / 10
  }, [faculty])

  const performanceData = useMemo(() =>
    faculty.map(f => {
      const lastName = f.name.split(" ").slice(-1)[0]
      return {
        name: lastName.length > 8 ? `${lastName.slice(0, 7)}…` : lastName,
        score: f.performanceScore || 0,
        attendance: f.attendancePercent || 0,
        feedback: (f.feedbackScore || 0) * 20,
      }
    }),
    [faculty])

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === "completed").length
  const overdueTasks = tasks.filter(t => t.status !== "completed" && t.deadline < today).length
  const pendingTasks = totalTasks - completedTasks - overdueTasks

  const tasksByFaculty = useMemo(() => {
    const map: Record<string, { name: string; completed: number; pending: number }> = {}
    for (const f of faculty) {
      const lastName = f.name.split(" ").slice(-1)[0]
      map[f.id] = { name: lastName.length > 8 ? `${lastName.slice(0, 7)}…` : lastName, completed: 0, pending: 0 }
    }
    for (const t of tasks) {
      if (!map[t.facultyId]) {
        const lastName = t.facultyName.split(" ").slice(-1)[0]
        map[t.facultyId] = { name: lastName.length > 8 ? `${lastName.slice(0, 7)}…` : lastName, completed: 0, pending: 0 }
      }
      if (t.status === "completed") map[t.facultyId].completed++
      else map[t.facultyId].pending++
    }
    return Object.values(map)
  }, [faculty, tasks])

  const stats = [
    { label: "Total Faculty", value: faculty.length, icon: Users, color: "bg-primary/10 text-primary", glow: "shadow-primary/20" },
    { label: "Total Subjects", value: subjects.length, icon: BookOpen, color: "bg-indigo-500/10 text-indigo-500", glow: "shadow-indigo-500/20" },
    { label: "Avg Attendance", value: avgAttendance, icon: TrendingUp, color: "bg-emerald-500/10 text-emerald-500", glow: "shadow-emerald-500/20", suffix: "%" },
    { label: "Avg Feedback", value: avgFeedback, icon: Star, color: "bg-amber-500/10 text-amber-500", glow: "shadow-amber-500/20", suffix: "/5", decimals: 1 },
  ]

  const taskStats = [
    { label: "Total Tasks", value: totalTasks, icon: ClipboardList, color: "bg-primary/20", glow: "shadow-primary/10" },
    { label: "Completed", value: completedTasks, icon: CheckCircle2, color: "bg-emerald-500/20", glow: "shadow-emerald-500/10" },
    { label: "Pending", value: pendingTasks, icon: Clock, color: "bg-amber-500/20", glow: "shadow-amber-500/10" },
    { label: "Overdue", value: overdueTasks, icon: AlertTriangle, color: "bg-rose-500/20", glow: "shadow-rose-500/10" },
  ]

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
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
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-card-foreground md:text-4xl">
          System <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">Overview</span>
        </h1>
        <p className="text-muted-foreground">Real-time institutional performance metrics and faculty analytics.</p>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="group relative overflow-hidden border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:scale-[1.02] hover:bg-card/60">
              <div className={cn("absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100", 
                stat.color.includes("primary") ? "from-primary to-violet-500" :
                stat.color.includes("indigo") ? "from-indigo-500 to-blue-500" :
                stat.color.includes("emerald") ? "from-emerald-500 to-teal-500" :
                "from-amber-500 to-orange-500"
              )} />
              <CardContent className="flex items-center gap-4 p-6">
                <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:scale-110", stat.color, stat.glow)}>
                  <stat.icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-black text-card-foreground">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Performance Chart */}
        <motion.div variants={itemVariants}>
          <Card className="border-white/5 bg-card/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Activity className="h-5 w-5 text-primary" /> Faculty Performance Comparison
              </CardTitle>
              <CardDescription>Multi-dimensional overview of faculty metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full pt-4">
                <ChartContainer config={performanceChartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="score" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} minPointSize={3} />
                      <Bar dataKey="attendance" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} minPointSize={3} />
                      <Bar dataKey="feedback" fill="hsl(var(--chart-3))" radius={[6, 6, 0, 0]} minPointSize={3} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Task Completion Chart */}
        {tasksByFaculty.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="border-white/5 bg-card/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <Zap className="h-5 w-5 text-amber-500" /> Task Completion Rate
                </CardTitle>
                <CardDescription>Completed vs pending tasks across departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full pt-4">
                  <ChartContainer config={taskChartConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tasksByFaculty} barGap={8}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="completed" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} minPointSize={3} />
                        <Bar dataKey="pending" fill="hsl(var(--chart-4))" radius={[6, 6, 0, 0]} minPointSize={3} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <motion.div variants={itemVariants}>
        <Card className="border-white/5 bg-card/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Star className="h-5 w-5 text-amber-400" /> Top Performing Faculty
            </CardTitle>
            <CardDescription>Faculty ranked by overall performance score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left bg-white/5">
                    <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Rank</th>
                    <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Faculty Name</th>
                    <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Department</th>
                    <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Score</th>
                    <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {[...faculty]
                    .sort((a, b) => b.performanceScore - a.performanceScore)
                    .slice(0, 5)
                    .map((f, i) => (
                      <tr key={f.id} className="border-b border-white/5 transition-colors hover:bg-white/5 last:border-0 group">
                        <td className="p-4">
                          <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full font-black text-xs shadow-inner", 
                            i === 0 ? "bg-amber-500/20 text-amber-500 shadow-amber-500/20" : 
                            i === 1 ? "bg-slate-400/20 text-slate-400" :
                            i === 2 ? "bg-orange-600/20 text-orange-600" : 
                            "bg-muted/30 text-muted-foreground")}>
                            #{i + 1}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-card-foreground group-hover:text-primary transition-colors">{f.name}</td>
                        <td className="p-4">
                          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{f.department}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-16 overflow-hidden rounded-full bg-muted/30">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-violet-500" 
                                style={{ width: `${f.performanceScore}%` }}
                              />
                            </span>
                            <span className="font-black text-primary">{f.performanceScore}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                            <span className="font-bold">{f.feedbackScore}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Task Summary Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {taskStats.map(stat => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/60">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg", stat.color, stat.glow)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">{stat.label}</p>
                  <p className="text-2xl font-black text-card-foreground">
                    <AnimatedCounter value={stat.value} />
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ")
}
