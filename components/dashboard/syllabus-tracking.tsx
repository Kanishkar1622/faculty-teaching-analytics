"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useFaculty, useSubjects, useSyllabusUpdates } from "@/lib/api-service"
import { BookOpen, Clock, Users, TrendingUp, ChevronRight, Layers, Activity, Zap, CheckCircle2 } from "lucide-react"
import {
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { AnimatedCounter } from "./animated-counter"

const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(210, 70%, 55%)",
]

const donutConfig = {
    completion: { label: "Completion %" },
}

const lineConfig = {
    completion: { label: "Completion %", color: "hsl(var(--chart-1))" },
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

export function SyllabusTracking() {
    const { data: faculty, loading: loadingFaculty } = useFaculty()
    const { data: allSubjects, loading: loadingSubjects } = useSubjects()
    const { data: allUpdates, loading: loadingUpdates } = useSyllabusUpdates()
    const [selectedFaculty, setSelectedFaculty] = useState("all")

    const loading = loadingFaculty || loadingSubjects || loadingUpdates

    const subjectProgress = useMemo(() => {
        let subs = allSubjects
        if (selectedFaculty !== "all") {
            subs = subs.filter(s => (s.facultyIds || []).includes(selectedFaculty))
        }
        const mapped = subs.map(s => ({
            ...s,
            pct: s.totalHours > 0 ? Math.round((s.completedHours / s.totalHours) * 100) : 0,
            facultyName: faculty.filter(f => (s.facultyIds || []).includes(f.id)).map(f => f.name).join(", ") || "Unknown",
        }))
        const seen = new Map<string, typeof mapped[0]>()
        for (const s of mapped) {
            const existing = seen.get(s.name)
            if (!existing || s.completedHours > existing.completedHours) seen.set(s.name, s)
        }
        return Array.from(seen.values()).sort((a, b) => b.pct - a.pct)
    }, [allSubjects, faculty, selectedFaculty])

    const donutData = useMemo(() => {
        return faculty.map(f => {
            const fSubs = allSubjects.filter(s => (s.facultyIds || []).includes(f.id))
            const totalH = fSubs.reduce((sum, s) => sum + s.totalHours, 0)
            const completedH = fSubs.reduce((sum, s) => sum + s.completedHours, 0)
            return {
                name: f.name.split(" ").pop() || f.name,
                fullName: f.name,
                value: totalH > 0 ? Math.round((completedH / totalH) * 100) : 0,
                totalH,
                completedH,
            }
        }).sort((a, b) => b.value - a.value).slice(0, 6)
    }, [faculty, allSubjects])

    const trendData = useMemo(() => {
        if (allUpdates.length === 0) return []
        const updates = selectedFaculty !== "all" ? allUpdates.filter(u => u.facultyId === selectedFaculty) : allUpdates
        const dateMap = new Map<string, { pct: number; count: number }>()
        const sorted = [...updates].sort((a, b) => a.date.localeCompare(b.date))
        sorted.forEach(u => {
            const pct = u.totalHours > 0 ? Math.round((u.completedHoursAfter / u.totalHours) * 100) : 0
            const existing = dateMap.get(u.date)
            if (existing) { existing.pct += pct; existing.count += 1 }
            else dateMap.set(u.date, { pct, count: 1 })
        })
        return Array.from(dateMap.entries()).map(([date, { pct, count }]) => ({
            date: date.slice(5), 
            completion: Math.round(pct / count),
        }))
    }, [allUpdates, selectedFaculty])

    const updateHistory = useMemo(() => {
        let updates = allUpdates
        if (selectedFaculty !== "all") updates = updates.filter(u => u.facultyId === selectedFaculty)
        return [...updates].sort((a, b) => b.date.localeCompare(a.date))
    }, [allUpdates, selectedFaculty])

    const stats = useMemo(() => {
        const totalH = subjectProgress.reduce((sum, s) => sum + s.totalHours, 0)
        const completedH = subjectProgress.reduce((sum, s) => sum + s.completedHours, 0)
        const avgPct = subjectProgress.length > 0 ? Math.round(subjectProgress.reduce((sum, s) => sum + s.pct, 0) / subjectProgress.length) : 0
        return { totalH, completedH, avgPct, subjectCount: subjectProgress.length }
    }, [subjectProgress])

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
            {/* Header & Filter Area */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <motion.div variants={itemVariants} className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-card-foreground">
                        Syllabus <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Kinetics</span>
                    </h1>
                    <p className="text-muted-foreground italic font-medium">Monitoring academic velocity and curriculum saturation levels.</p>
                </motion.div>
                
                <motion.div variants={itemVariants} className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5 shadow-inner">
                    <div className="flex items-center gap-2 px-3 opacity-40">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Entity Probe</span>
                    </div>
                    <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                        <SelectTrigger className="w-56 h-10 bg-background/50 border-white/5 font-bold text-[10px] tracking-widest uppercase">
                            <SelectValue placeholder="GLOBAL VIEW" />
                        </SelectTrigger>
                        <SelectContent className="bg-card/90 backdrop-blur-2xl border-white/10">
                            <SelectItem value="all" className="font-black text-[10px]">GLOBAL VIEW</SelectItem>
                            {faculty.map(f => (
                                <SelectItem key={f.id} value={f.id} className="font-black text-[10px]">{f.name.toUpperCase()}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </motion.div>
            </div>

            {/* Summary Array */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                    { label: "Active Modules", value: stats.subjectCount, icon: BookOpen, color: "bg-blue-500/10 text-blue-500" },
                    { label: "Saturation Index", value: stats.avgPct, icon: Activity, color: "bg-emerald-500/10 text-emerald-500", suffix: "%" },
                    { label: "Processed Hours", value: stats.completedH, icon: Zap, color: "bg-amber-500/10 text-amber-500", suffix: "H" },
                    { label: "Total Capacity", value: stats.totalH, icon: Layers, color: "bg-fuchsia-500/10 text-fuchsia-500", suffix: "H" },
                ].map(stat => (
                    <motion.div key={stat.label} variants={itemVariants}>
                        <Card className="border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/60">
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-black/20", stat.color)}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                    <p className="text-2xl font-black text-card-foreground"><AnimatedCounter value={stat.value} />{stat.suffix}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Module-wise Saturation Bars */}
                <motion.div variants={itemVariants}>
                    <Card className="h-full border-white/5 bg-card/40 backdrop-blur-xl overflow-hidden shadow-2xl">
                        <CardHeader className="border-b border-white/5 bg-white/[0.02] py-6 px-8 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black">MODULE SATURATION</CardTitle>
                                <CardDescription className="font-bold opacity-60 italic">Real-time completion metrics per syllabus module.</CardDescription>
                            </div>
                            <Badge variant="outline" className="h-7 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/10">{subjectProgress.length} ACTIVE</Badge>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="flex flex-col gap-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                {subjectProgress.map((s, idx) => (
                                    <motion.div 
                                        key={s.id} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex flex-col gap-2 group"
                                    >
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-black text-card-foreground group-hover:text-primary transition-colors text-xs uppercase tracking-tight">{s.name}</span>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">{s.facultyName.split(",")[0]}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-muted-foreground text-[10px] font-black opacity-30">{s.completedHours} / {s.totalHours}H</span>
                                                <Badge className={cn("text-[10px] font-black px-2 h-6 border-none shadow-sm", 
                                                    s.pct >= 90 ? "bg-emerald-500/20 text-emerald-500" : 
                                                    s.pct >= 50 ? "bg-amber-500/20 text-amber-500" : 
                                                    "bg-rose-500/20 text-rose-500"
                                                )}>
                                                    {s.pct}%
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="relative h-2 w-full rounded-full bg-white/5 overflow-hidden border border-white/5">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${s.pct}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={cn("h-full rounded-full transition-all duration-1000", 
                                                    s.pct >= 90 ? "bg-emerald-500" : s.pct >= 50 ? "bg-amber-500" : "bg-rose-500"
                                                )}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Personnel Saturation Core */}
                <motion.div variants={itemVariants}>
                    <Card className="h-full border-white/5 bg-card/40 backdrop-blur-xl overflow-hidden shadow-2xl">
                        <CardHeader className="border-b border-white/5 bg-white/[0.02] py-6 px-8">
                            <CardTitle className="text-xl font-black">PERSONNEL SATURATION</CardTitle>
                            <CardDescription className="font-bold opacity-60 italic">Aggregated syllabus completion distribution by personnel.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            {donutData.length > 0 ? (
                                <div className="relative">
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-4xl font-black text-card-foreground tracking-tighter tabular-nums">{stats.avgPct}%</span>
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Global Avg</span>
                                    </div>
                                    <ChartContainer config={donutConfig} className="mx-auto h-[350px] w-full">
                                        <PieChart>
                                            <Pie
                                                data={donutData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={110}
                                                outerRadius={150}
                                                paddingAngle={5}
                                                dataKey="value"
                                                nameKey="name"
                                                stroke="none"
                                            >
                                                {donutData.map((entry, i) => (
                                                    <Cell 
                                                        key={i} 
                                                        fill={COLORS[i % COLORS.length]} 
                                                        className="hover:opacity-80 transition-opacity cursor-pointer drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                                                    />
                                                ))}
                                            </Pie>
                                            <ChartTooltip
                                                content={
                                                    <ChartTooltipContent
                                                        className="bg-card/90 backdrop-blur-2xl border-white/10 font-black p-3"
                                                        formatter={(value, name) => [`${value}%`, name.toString().toUpperCase()]}
                                                    />
                                                }
                                            />
                                        </PieChart>
                                    </ChartContainer>
                                </div>
                            ) : (
                                <div className="h-[350px] flex flex-center items-center justify-center opacity-20">
                                    <Activity className="h-24 w-24 animate-pulse" />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Velocity Trend Line Graph */}
                <motion.div variants={itemVariants} className="lg:col-span-3">
                    <Card className="border-white/5 bg-card/40 backdrop-blur-xl overflow-hidden shadow-2xl">
                        <CardHeader className="border-b border-white/5 bg-white/[0.02] py-6 px-8">
                            <CardTitle className="text-xl font-black">VELOCITY TREND</CardTitle>
                            <CardDescription className="font-bold opacity-60 italic">Temporal analysis of syllabus saturation growth.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            {trendData.length > 0 ? (
                                <ChartContainer config={lineConfig} className="h-[300px] w-full">
                                    <LineChart data={trendData}>
                                        <defs>
                                            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-white/5" />
                                        <XAxis 
                                            dataKey="date" 
                                            className="text-[10px] font-black uppercase" 
                                            tick={{ fill: "hsl(var(--muted-foreground))" }} 
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            domain={[0, 100]} 
                                            className="text-[10px] font-black" 
                                            tick={{ fill: "hsl(var(--muted-foreground))" }} 
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(val) => `${val}%`}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent className="bg-card/90 backdrop-blur-2xl border-white/10 font-black" />} />
                                        <Line 
                                            type="monotone" 
                                            dataKey="completion" 
                                            stroke="hsl(var(--primary))" 
                                            strokeWidth={4} 
                                            dot={false} 
                                            activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "white", strokeWidth: 2 }} 
                                        />
                                    </LineChart>
                                </ChartContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center opacity-20 italic font-black uppercase text-xs tracking-widest">Temporal data link inactive</div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Artifact Logs - Update History */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="h-full border-white/5 bg-card/40 backdrop-blur-xl overflow-hidden shadow-2xl">
                        <CardHeader className="border-b border-white/5 bg-white/[0.02] py-6 px-8">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <CardTitle className="text-xl font-black uppercase">ARTIFACT LOGS</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="flex flex-col divide-y divide-white/[0.03] max-h-[360px] overflow-y-auto custom-scrollbar">
                                {updateHistory.slice(0, 20).map((u, idx) => (
                                    <motion.div 
                                        key={u.id} 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 font-bold text-[10px] text-muted-foreground uppercase opacity-60 shadow-inner">
                                            {u.facultyName.charAt(0)}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-black uppercase text-card-foreground tracking-tight">{u.facultyName}</span>
                                                <span className="text-[9px] font-black text-muted-foreground opacity-30 tabular-nums">{u.date}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="outline" className="h-6 text-[9px] font-black uppercase bg-primary/5 text-primary border-primary/20 rounded-md">{u.subjectName}</Badge>
                                                <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shadow-sm">
                                                    <TrendingUp className="h-2.5 w-2.5" /> +{u.hoursCovered}H
                                                </div>
                                            </div>
                                            {u.topicsCovered && (
                                                <div className="text-[10px] font-medium text-muted-foreground/60 p-2 bg-black/10 rounded-md border border-white/5 italic line-clamp-2">
                                                    {u.topicsCovered}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {updateHistory.length === 0 && (
                                    <div className="py-24 text-center text-[10px] font-black uppercase text-muted-foreground opacity-20 tracking-[0.3em]">Temporal log vacant</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    )
}

function cn(...classes: (string | undefined | null | boolean)[]) { return classes.filter(Boolean).join(" ") }
