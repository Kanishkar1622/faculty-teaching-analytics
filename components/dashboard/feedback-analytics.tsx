"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useFaculty, useFeedback, useFacultyById } from "@/lib/api-service"
import { Star, MessageSquare, Users, Award, TrendingUp, Calendar, User } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { AnimatedCounter } from "./animated-counter"

const facultyChartConfig = {
  rating: { label: "Avg Rating", color: "hsl(var(--primary))" },
}

const deptChartConfig = {
  rating: { label: "Dept Avg Rating", color: "hsl(var(--chart-2))" },
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={cn("h-3.5 w-3.5 transition-all", 
            i <= Math.round(rating) 
              ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" 
              : "text-white/10"
          )}
        />
      ))}
    </div>
  )
}

export function FeedbackAnalytics() {
  const { user, getFacultyId } = useAuth()
  const isAdmin = user?.role === "admin"
  const facultyId = getFacultyId()

  const { data: allFaculty, loading: loadingFaculty } = useFaculty()
  const { data: myFacultyData, loading: loadingMyFaculty } = useFacultyById(isAdmin ? null : facultyId)
  const { data: allFeedback, loading: loadingAllFeedback } = useFeedback(isAdmin ? undefined : (facultyId || undefined))

  const loading = loadingFaculty || loadingAllFeedback || (!isAdmin && loadingMyFaculty)

  const feedback = allFeedback
  const faculty = isAdmin ? allFaculty : (myFacultyData ? [myFacultyData] : [])

  const facultyFeedbackData = useMemo(() => {
    if (isAdmin) {
      return allFaculty.map(f => {
        const facFeedback = allFeedback.filter(fb => fb.facultyId === f.id)
        const avg = facFeedback.length > 0
          ? Math.round((facFeedback.reduce((sum, fb) => sum + fb.rating, 0) / facFeedback.length) * 10) / 10
          : 0
        const lastName = f.name.split(" ").slice(-1)[0]
        return { name: lastName.length > 8 ? `${lastName.slice(0, 7)}…` : lastName, rating: avg }
      })
    }
    const subjects = [...new Set(feedback.map(fb => fb.subject))].filter(Boolean)
    return subjects.map(sub => {
      const subFeedback = feedback.filter(fb => fb.subject === sub)
      const avg = subFeedback.length > 0
        ? Math.round((subFeedback.reduce((sum, fb) => sum + fb.rating, 0) / subFeedback.length) * 10) / 10
        : 0
      const label = sub.length > 10 ? `${sub.slice(0, 9)}…` : sub
      return { name: label, rating: avg }
    })
  }, [isAdmin, allFaculty, allFeedback, feedback])

  const deptFeedback = useMemo(() => {
    if (!isAdmin) return []
    const depts = [...new Set(allFaculty.map(f => f.department))].filter(Boolean)
    return depts.map(dept => {
      const deptFac = allFaculty.filter(f => f.department === dept)
      const deptFb = allFeedback.filter(fb => deptFac.some(f => f.id === fb.facultyId))
      const avg = deptFb.length > 0
        ? Math.round((deptFb.reduce((sum, fb) => sum + fb.rating, 0) / deptFb.length) * 10) / 10
        : 0
      return { department: dept, rating: avg }
    })
  }, [isAdmin, allFaculty, allFeedback])

  const avgRating = useMemo(() => {
    if (feedback.length === 0) return 0
    return Math.round((feedback.reduce((sum, fb) => sum + fb.rating, 0) / feedback.length) * 10) / 10
  }, [feedback])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const stats = [
    { label: "Total Feedback", value: feedback.length, icon: MessageSquare, color: "bg-blue-500/10 text-blue-500", glow: "shadow-blue-500/20" },
    { label: "Aggregate Rating", value: avgRating, isRating: true, icon: Award, color: "bg-amber-500/10 text-amber-500", glow: "shadow-amber-500/20" },
    { 
      label: isAdmin ? "Active Faculty" : "Modules Covered", 
      value: isAdmin ? new Set(allFeedback.map(fb => fb.facultyId)).size : new Set(feedback.map(fb => fb.subject)).size, 
      icon: isAdmin ? Users : TrendingUp, 
      color: "bg-violet-500/10 text-violet-500", 
      glow: "shadow-violet-500/20" 
    },
  ]

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-8 pb-12"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-card-foreground">
          Sentiment <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Analysis</span>
        </h1>
        <p className="text-muted-foreground">Monitoring student satisfaction through granular feedback loops.</p>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(stat => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="relative overflow-hidden border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/60">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform", stat.color, stat.glow)}>
                  <stat.icon className={cn("h-6 w-6", stat.isRating && "fill-current")} />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-black text-card-foreground">
                      <AnimatedCounter value={stat.value} decimals={stat.isRating ? 1 : 0} />
                    </p>
                    {stat.isRating && <span className="text-xs font-black text-muted-foreground">/ 5.0</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Rating Breakdown Chart */}
        <motion.div variants={itemVariants}>
          <Card className="border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/50 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                {isAdmin ? "Institutional Rating Matrix" : "Individual Subject Scores"}
              </CardTitle>
              <CardDescription>
                {isAdmin ? "Comparative student appraisal across full faculty" : "Performance benchmarks across your assigned curriculum"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full pt-4">
                <ChartContainer config={facultyChartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={facultyFeedbackData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--white))" opacity={0.05} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="rating" radius={[6, 6, 0, 0]} barSize={24}>
                        {facultyFeedbackData.map((entry, index) => (
                          <Cell 
                             key={`cell-${index}`} 
                             fill={entry.rating >= 4.5 ? "hsl(var(--primary))" : entry.rating >= 3.5 ? "hsl(var(--chart-2))" : "hsl(var(--chart-4))"} 
                            fillOpacity={0.8}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dept Comparison or Distribution */}
        <motion.div variants={itemVariants}>
          {isAdmin ? (
            <Card className="border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/50 h-full">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-violet-500" /> Departmental Sentiment
                </CardTitle>
                <CardDescription>Aggregate student satisfaction by academic vertical</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full pt-4">
                  <ChartContainer config={deptChartConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptFeedback} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--white))" opacity={0.05} />
                        <XAxis type="number" domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <YAxis dataKey="department" type="category" width={80} axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: "bold" }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="rating" fill="url(#deptGradient)" radius={[0, 6, 6, 0]} barSize={32} />
                        <defs>
                          <linearGradient id="deptGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/50 h-full">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" /> Rating Distribution
                </CardTitle>
                <CardDescription>Granular breakdown of individual student appraisals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-6 pt-4">
                  {[5, 4, 3, 2, 1].map(r => {
                    const count = feedback.filter(fb => fb.rating === r).length
                    const pct = feedback.length > 0 ? Math.round((count / feedback.length) * 100) : 0
                    return (
                      <div key={r} className="group flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-card-foreground w-4">{r}</span>
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          </div>
                          <span className="text-[10px] font-black text-muted-foreground uppercase">{count} RESPONSES ({pct}%)</span>
                        </div>
                        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: "circOut" }}
                            className={cn("absolute inset-y-0 left-0 rounded-full",
                              r >= 4 ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]" :
                              r >= 3 ? "bg-gradient-to-r from-primary to-violet-500" :
                              "bg-gradient-to-r from-rose-500 to-orange-400"
                            )}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Feed Table */}
      <motion.div variants={itemVariants}>
        <Card className="border-white/5 bg-card/40 backdrop-blur-xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">{isAdmin ? "Omniscient Feed" : "Personal Insight Feed"}</CardTitle>
                <CardDescription>Real-time stream of student feedback and performance qualitative data.</CardDescription>
              </div>
              <Badge variant="outline" className="h-8 border-white/10 px-4 font-black text-[10px] uppercase">
                {feedback.length} ENTRIES TOTAL
              </Badge>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-left">
                  <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground">Origin</th>
                  {isAdmin && <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground">Target Faculty</th>}
                  <th className="hidden p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground sm:table-cell">Subject Domain</th>
                  <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground">Appraisal</th>
                  <th className="hidden p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground md:table-cell">Qualitative Data</th>
                  <th className="hidden p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground lg:table-cell">Timestamp</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                {[...feedback]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 15)
                  .map(fb => {
                    const fac = allFaculty.find(f => f.id === fb.facultyId)
                    return (
                      <motion.tr key={fb.id} variants={itemVariants} className="border-b border-white/10 transition-all hover:bg-white/[0.03] group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 font-black text-xs text-muted-foreground">
                              {fb.studentName.charAt(0)}
                            </div>
                            <span className="font-bold text-card-foreground">{fb.studentName}</span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="p-4">
                             <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-primary" />
                                <span className="font-bold text-sm">{fac?.name.split(" ").slice(-1)[0]}</span>
                             </div>
                          </td>
                        )}
                        <td className="hidden p-4 sm:table-cell">
                          <Badge variant="secondary" className="border-white/10 bg-white/5 text-[10px] font-black uppercase">{fb.subject}</Badge>
                        </td>
                        <td className="p-4">
                          <StarRating rating={fb.rating} />
                        </td>
                        <td className="hidden max-w-sm p-4 text-muted-foreground md:table-cell italic">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-3 w-3 mt-1 shrink-0 opacity-40" />
                            <span className="text-xs leading-relaxed">"{fb.comment || "No feedback content provided."}"</span>
                          </div>
                        </td>
                        <td className="hidden p-4 text-[10px] font-black text-muted-foreground uppercase lg:table-cell">
                          <div className="flex items-center gap-1.5 opacity-60">
                             <Calendar className="h-3 w-3" />
                             {fb.date}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                {feedback.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="py-20 text-center">
                      <p className="font-bold text-muted-foreground">Zero feedback records detected within current parameters.</p>
                    </td>
                  </tr>
                )}
              </motion.tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ")
}
