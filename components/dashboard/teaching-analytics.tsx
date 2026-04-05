"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useFaculty, useAttendance, useSubjects } from "@/lib/api-service"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { Activity, BookOpen, GraduationCap, TrendingUp, Users, Filter, Calendar } from "lucide-react"

const attendanceConfig = {
  percent: { label: "Attendance %", color: "hsl(var(--primary))" },
}

const workloadConfig = {
  totalHours: { label: "Total Hours", color: "hsl(var(--primary))" },
  completedHours: { label: "Completed", color: "hsl(var(--chart-2))" },
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export function TeachingAnalytics() {
  const { data: faculty, loading: loadingFaculty } = useFaculty()
  const { data: allAttendance, loading: loadingAttendance } = useAttendance()
  const { data: allSubjects, loading: loadingSubjects } = useSubjects()
  const [selectedFaculty, setSelectedFaculty] = useState("all")

  const loading = loadingFaculty || loadingAttendance || loadingSubjects

  const attendanceData = useMemo(() => {
    if (selectedFaculty === "all") {
      return ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"].map(month => {
        const records = allAttendance.filter(a => a.month === month)
        const avg = records.length > 0 ? records.reduce((sum, r) => sum + r.percent, 0) / records.length : 0
        return { month, percent: Math.round(avg * 10) / 10 }
      })
    }
    return allAttendance
      .filter(a => a.facultyId === selectedFaculty)
      .map(a => ({ month: a.month, percent: a.percent }))
  }, [allAttendance, selectedFaculty])

  const subjectsData = useMemo(() => {
    return selectedFaculty === "all"
      ? allSubjects
      : allSubjects.filter(s => (s.facultyIds || []).includes(selectedFaculty))
  }, [allSubjects, selectedFaculty])

  const workloadData = useMemo(() =>
    subjectsData.map(s => ({
      name: s.name.length > 10 ? `${s.name.slice(0, 9)}…` : s.name,
      totalHours: s.totalHours || 0,
      completedHours: s.completedHours || 0,
    })),
    [subjectsData])

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div variants={itemVariants} className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-card-foreground">
            Academic <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">Intelligence</span>
          </h1>
          <p className="text-muted-foreground">Deep analytical insights into teaching performance and syllabus tracking.</p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3">
            <Filter className="h-4 w-4 text-primary" />
            <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
              <SelectTrigger className="w-56 border-0 bg-transparent h-9 focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Select Faculty" />
              </SelectTrigger>
              <SelectContent className="bg-card/90 backdrop-blur-xl border-white/10">
                <SelectItem value="all">Institutional Aggregate</SelectItem>
                {faculty.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Attendance Trends */}
        <motion.div variants={itemVariants}>
          <Card className="border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl font-bold">
                    <TrendingUp className="h-5 w-5 text-primary" /> Attendance Velocity
                  </CardTitle>
                  <CardDescription>Monthly engagement variance across terms</CardDescription>
                </div>
                <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-500">
                  <Calendar className="mr-1 h-3 w-3" /> 2023-24
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full pt-4">
                <ChartContainer config={attendanceConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceData}>
                      <defs>
                        <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="percent" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorPercent)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Workload Scale */}
        <motion.div variants={itemVariants}>
          <Card className="border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Activity className="h-5 w-5 text-amber-500" /> Workload Equilibrium
              </CardTitle>
              <CardDescription>Target vs actual lecture hour distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full pt-4">
                <ChartContainer config={workloadConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workloadData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="totalHours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.8} />
                      <Bar dataKey="completedHours" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Syllabus Completion Vertical List */}
        <motion.div variants={itemVariants}>
          <Card className="border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/50 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <BookOpen className="h-5 w-5 text-indigo-500" /> Syllabus Momentum
              </CardTitle>
              <CardDescription>Real-time completion tracking per curriculum module</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 pt-2">
                {subjectsData.map(s => {
                  const pct = Math.round((s.completedHours / (s.totalHours || 1)) * 100)
                  return (
                    <div key={s.id} className="group flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs", 
                            pct >= 90 ? "bg-emerald-500/20 text-emerald-500" :
                            pct >= 60 ? "bg-primary/20 text-primary" :
                            "bg-amber-500/20 text-amber-500"
                          )}>
                            {pct}%
                          </div>
                          <span className="font-bold text-card-foreground group-hover:text-primary transition-colors">{s.name}</span>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{s.completedHours} / {s.totalHours}H</span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: "circOut" }}
                          className={cn("absolute inset-y-0 left-0 rounded-full", 
                            pct >= 90 ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
                            pct >= 60 ? "bg-gradient-to-r from-primary to-violet-500" :
                            "bg-gradient-to-r from-amber-500 to-orange-400"
                          )} 
                        />
                      </div>
                    </div>
                  )
                })}
                {subjectsData.length === 0 && (
                  <div className="py-20 text-center text-muted-foreground italic">No subjects assigned for this selection.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Global Performance Circular Metrics */}
        <motion.div variants={itemVariants}>
          <Card className="border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/50 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <GraduationCap className="h-5 w-5 text-violet-500" /> Quality Benchmarks
              </CardTitle>
              <CardDescription>Institutional efficiency across faculty departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 py-4 sm:grid-cols-3">
                {faculty.slice(0, 12).map(f => (
                  <motion.div 
                    key={f.id} 
                    className="flex flex-col items-center gap-3"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="relative h-24 w-24">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 filter drop-shadow-lg">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--white))" strokeOpacity="0.05" strokeWidth="8" />
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          initial={{ strokeDasharray: "0 264" }}
                          animate={{ strokeDasharray: `${(f.performanceScore / 100) * 264} 264` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          stroke={
                            f.performanceScore >= 90 ? "hsl(var(--chart-2))" : 
                            f.performanceScore >= 75 ? "hsl(var(--primary))" : 
                            "hsl(var(--chart-4))"
                          }
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-card-foreground leading-none">{f.performanceScore}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Score</span>
                      </div>
                    </div>
                      <div className="text-center">
                          <p className="max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold text-card-foreground">{f.name.split(" ").slice(-1)[0]}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-tighter">{f.department}</p>
                      </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ")
}
