"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useFaculty, useFacultyById, useFeedback, useLocationAttendance, useSubjects, useFacultyAssignedSubjects } from "@/lib/api-service"
import { FileText, Download, Calendar, BarChart3, ShieldCheck, AlertTriangle, FileSpreadsheet, ChevronRight, Layout, Printer, Share2, ClipboardList, Users, TrendingUp, Award } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedCounter } from "./animated-counter"

// ── CSV Export ───────────────────────────────────────────────────────
function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")),
  ].join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── PDF Export ───────────────────────────────────────────────────────
async function downloadPDF(
  title: string,
  subtitle: string,
  headers: string[],
  rows: string[][],
  summaryLines: string[],
  filename: string
) {
  const { default: jsPDF } = await import("jspdf")
  const autoTable = (await import("jspdf-autotable")).default

  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text(title, 14, 20)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(subtitle, 14, 28)
  doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 14, 34)

  let y = 44
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Summary", 14, y)
  y += 7
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  for (const line of summaryLines) {
    doc.text(line, 14, y)
    y += 6
  }

  autoTable(doc, {
    startY: y + 4,
    head: [headers],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  })

  doc.save(filename)
}

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

export function Reports() {
  const { user, getFacultyId } = useAuth()
  const isAdmin = user?.role === "admin"
  const myFacultyId = getFacultyId()

  const { data: allFaculty, loading: loadingFaculty } = useFaculty()
  const { data: myFaculty, loading: loadingMyFaculty } = useFacultyById(isAdmin ? null : myFacultyId)
  const { data: allFeedback } = useFeedback(isAdmin ? undefined : (myFacultyId || undefined))
  const { data: attendance } = useLocationAttendance(isAdmin ? undefined : (myFacultyId || undefined))
  const { data: allSubjects } = useSubjects()
  const { data: facultySubjects } = useFacultyAssignedSubjects(isAdmin ? null : myFacultyId)
  const subjects = isAdmin ? allSubjects : facultySubjects

  const [selectedReport, setSelectedReport] = useState("monthly")
  const [selectedPeriod, setSelectedPeriod] = useState("Feb")
  const [selectedFacultyId, setSelectedFacultyId] = useState("all")

  const loading = loadingFaculty || (!isAdmin && loadingMyFaculty)

  const visibleFaculty = useMemo(() => {
    if (isAdmin) {
      if (selectedFacultyId !== "all") {
        return allFaculty.filter(f => f.id === selectedFacultyId)
      }
      return allFaculty
    }
    return myFaculty ? [myFaculty] : []
  }, [isAdmin, allFaculty, myFaculty, selectedFacultyId])

  const reportTypes = useMemo(() => {
    const base = [
      { id: "monthly", label: "Monthly Analytics", description: "Periodic performance synthesis & variance", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
      { id: "semester", label: "Term Manifest", description: "Cumulative assessment of full academic term", icon: Layout, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    ]
    if (isAdmin) {
      base.push(
        { id: "faculty", label: "Personnel Audit", description: "Granular audit of individual faculty performance", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { id: "department", label: "Vertical Report", description: "Comparative analysis of departmental metrics", icon: BarChart3, color: "text-amber-500", bg: "bg-amber-500/10" },
      )
    }
    return base
  }, [isAdmin])

  const stats = useMemo(() => {
    if (visibleFaculty.length === 0) return { avgAttendance: 0, avgFeedback: 0, avgSyllabus: 0, totalAttendance: 0 }
    const avgAttendance = Math.round(visibleFaculty.reduce((s, f) => s + f.attendancePercent, 0) / visibleFaculty.length * 10) / 10
    const avgFeedback = Math.round(visibleFaculty.reduce((s, f) => s + f.feedbackScore, 0) / visibleFaculty.length * 10) / 10
    const avgSyllabus = Math.round(visibleFaculty.reduce((s, f) => s + f.syllabusCompletion, 0) / visibleFaculty.length * 10) / 10
    const totalAttendance = attendance.filter(a => a.status === "present").length
    return { avgAttendance, avgFeedback, avgSyllabus, totalAttendance }
  }, [visibleFaculty, attendance])

  const getReportTitle = () => {
    const rType = reportTypes.find(r => r.id === selectedReport)?.label || "Report"
    if (!isAdmin) return `FACULTY REPORT // ${myFaculty?.name?.toUpperCase()}`
    return `${rType.toUpperCase()} // ${selectedFacultyId === "all" ? "INSTITUTIONAL AGGREGATE" : visibleFaculty[0]?.name?.toUpperCase() || ""}`
  }

  const handleExportPDF = () => {
    const headers = ["Name", "Department", "Attendance %", "Feedback", "Syllabus %", "Score"]
    const rows = visibleFaculty.map(f => [f.name, f.department, `${f.attendancePercent}`, `${f.feedbackScore}/5`, `${f.syllabusCompletion}`, `${f.performanceScore}`])
    downloadPDF(getReportTitle(), selectedReport === "monthly" ? `Period: ${selectedPeriod} 2025` : `Period: ${selectedPeriod}`, headers, rows, [!isAdmin ? `Faculty: ${myFaculty?.name || "—"}` : `Scope: ${selectedFacultyId === "all" ? "All Faculty" : "Individual"}`, `Attendance: ${stats.avgAttendance}%`, `Feedback: ${stats.avgFeedback}/5`, `Syllabus: ${stats.avgSyllabus}%`], `report_${selectedReport}_${Date.now()}.pdf`)
  }

  const handleExportCSV = () => {
    const headers = ["Name", "Department", "Attendance %", "Feedback", "Syllabus %", "Score"]
    const rows = visibleFaculty.map(f => [f.name, f.department, `${f.attendancePercent}`, `${f.feedbackScore}/5`, `${f.syllabusCompletion}`, `${f.performanceScore}`])
    downloadCSV(`report_${selectedReport}_${Date.now()}.csv`, headers, rows)
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div variants={itemVariants} className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-card-foreground">
            Audit <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Nexus</span>
          </h1>
          <p className="text-muted-foreground">Orchestrate and deploy mission-critical performance manifests.</p>
        </motion.div>
        {!isAdmin && (
          <motion.div variants={itemVariants} className="flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-2 text-blue-500 border border-blue-500/20">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-widest">Isolated Environment</span>
          </motion.div>
        )}
      </div>

      {/* Report Types */}
      <div className={`grid grid-cols-1 gap-4 ${isAdmin ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"}`}>
        {reportTypes.map(report => (
          <motion.div 
            key={report.id} 
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={cn(
                "group relative cursor-pointer border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/60",
                selectedReport === report.id ? "ring-2 ring-primary bg-card/70" : ""
              )}
              onClick={() => setSelectedReport(report.id)}
            >
              <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110", report.bg, report.color)}>
                  <report.icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-card-foreground">{report.label}</p>
                  <p className="mt-2 text-xs font-medium text-muted-foreground leading-relaxed italic">{report.description}</p>
                </div>
                {selectedReport === report.id && (
                  <motion.div layoutId="activeReport" className="absolute -bottom-1 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Controls */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
          <Card className="border-white/5 bg-card/40 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-black">Parameter Matrix</CardTitle>
              <CardDescription>Configure the audit scope and temporal range.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(selectedReport === "monthly" || selectedReport === "semester") && (
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Temporal Range</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="h-12 bg-background/50 border-white/5 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card/90 backdrop-blur-xl border-white/10">
                      {selectedReport === "monthly"
                        ? ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"].map(m => (
                          <SelectItem key={m} value={m}>{m} 2025</SelectItem>
                        ))
                        : ["Fall 2025", "Spring 2026"].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {isAdmin && (selectedReport === "faculty" || selectedReport === "monthly") && (
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Target Personnel</Label>
                  <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                    <SelectTrigger className="h-12 bg-background/50 border-white/5 font-bold">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <SelectValue placeholder="Select faculty" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-card/90 backdrop-blur-xl border-white/10">
                      <SelectItem value="all">Institutional Aggregate</SelectItem>
                      {allFaculty.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Deploy Render</Label>
                <div className="grid grid-cols-1 gap-3">
                  <Button onClick={handleExportPDF} className="h-12 gap-2 font-black uppercase text-[11px] tracking-widest shadow-lg shadow-primary/20">
                    <Download className="h-4 w-4" /> Manifest as PDF
                  </Button>
                  <Button variant="outline" onClick={handleExportCSV} className="h-12 gap-2 border-white/10 bg-white/5 font-black uppercase text-[11px] tracking-widest hover:bg-white/10 hover:border-white/20">
                    <FileSpreadsheet className="h-4 w-4" /> Spreadsheet (CSV)
                  </Button>
                </div>
              </div>

              {!isAdmin && (
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  <p className="text-xs font-medium text-amber-500/80 leading-relaxed italic">Encryption active. Audit limited to individual performance vector only.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Preview */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <Card className="border-white/5 bg-background/40 backdrop-blur-3xl shadow-2xl overflow-hidden min-h-[600px]">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Layout className="h-48 w-48 rotate-12" />
             </div>
             
             <div className="p-8 md:p-12 space-y-12 relative z-10">
                {/* Simulated Document Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b border-white/10 pb-8">
                   <div className="space-y-4">
                      <Badge variant="outline" className="h-7 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 font-black uppercase tracking-[0.2em] text-[9px] px-4">OFFICIAL MANIFEST // INTERNAL ONLY</Badge>
                      <h2 className="text-3xl font-black tracking-tighter text-card-foreground leading-none">{getReportTitle()}</h2>
                      <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground opacity-60">
                         <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> OCT 2023 - FEB 2024</div>
                         <div className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> ENCRYPTED SYNC</div>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">System Timestamp</p>
                      <p className="text-sm font-bold text-card-foreground">{new Date().toLocaleTimeString()} // {new Date().toLocaleDateString()}</p>
                   </div>
                </div>

                {/* Analytical Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                   {[
                      { label: "Personnel Count", value: visibleFaculty.length, icon: Users },
                      { label: "Attendance Velocity", value: stats.avgAttendance, unit: "%", icon: TrendingUp },
                      { label: "Appraisal Value", value: stats.avgFeedback, unit: "/ 5", icon: Award },
                      { label: "Module Progress", value: stats.avgSyllabus, unit: "%", icon: ClipboardList },
                   ].map(stat => (
                      <div key={stat.label} className="space-y-2 group">
                         <div className="flex items-center gap-2 opacity-40 transition-opacity group-hover:opacity-100">
                            <stat.icon className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                         </div>
                         <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-card-foreground"><AnimatedCounter value={stat.value} decimals={stat.unit === "/ 5" ? 1 : 0} /></span>
                            <span className="text-[10px] font-black text-muted-foreground opacity-40">{stat.unit || ""}</span>
                         </div>
                      </div>
                   ))}
                </div>

                {/* Data Grid Preview */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Engagement Spreadsheet</h3>
                      <Badge variant="secondary" className="bg-white/5 font-black text-[9px] uppercase tracking-tighter">{visibleFaculty.length} Nodes Indexed</Badge>
                   </div>
                   <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-inner">
                      <table className="w-full text-xs">
                        <thead>
                           <tr className="border-b border-white/5 bg-white/5 text-left">
                              <th className="p-4 font-black uppercase tracking-tighter text-muted-foreground">Personnel Vector</th>
                              <th className="p-4 font-black uppercase tracking-tighter text-muted-foreground">Department</th>
                              <th className="p-4 font-black uppercase tracking-tighter text-muted-foreground">Validation</th>
                              <th className="p-4 font-black uppercase tracking-tighter text-right">Appraisal Score</th>
                           </tr>
                        </thead>
                        <tbody>
                           {visibleFaculty.slice(0, 8).map(f => (
                              <tr key={f.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                 <td className="p-4">
                                    <div className="flex items-center gap-2">
                                       <div className="h-6 w-6 rounded flex items-center justify-center bg-primary/10 text-primary font-black text-[9px] uppercase">ID</div>
                                       <span className="font-bold text-card-foreground">{f.name}</span>
                                    </div>
                                 </td>
                                 <td className="p-4"><Badge variant="outline" className="border-white/10 text-[9px] font-black uppercase tracking-tighter">{f.department}</Badge></td>
                                 <td className="p-4">
                                    <div className="flex items-center gap-2">
                                       <div className="h-1 w-12 rounded-full bg-white/5 overflow-hidden">
                                          <div className="h-full bg-primary" style={{ width: `${f.attendancePercent}%` }} />
                                       </div>
                                       <span className="font-black opacity-60">{f.attendancePercent}%</span>
                                    </div>
                                 </td>
                                 <td className="p-4 text-right">
                                    <Badge className={cn("font-black h-6 border-none", f.performanceScore >= 85 ? "bg-emerald-500/20 text-emerald-500" : "bg-white/10 text-muted-foreground")}>
                                       {f.performanceScore} V-PT
                                    </Badge>
                                 </td>
                              </tr>
                           ))}
                           {visibleFaculty.length > 8 && (
                              <tr>
                                 <td colSpan={4} className="p-4 text-center text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-[0.3em] bg-white/[0.01]">
                                    + {visibleFaculty.length - 8} Additional Nodes Truncated For Preview
                                 </td>
                              </tr>
                           )}
                           {visibleFaculty.length === 0 && (
                             <tr><td colSpan={4} className="py-20 text-center text-muted-foreground italic">Insufficient data to render manifest elements.</td></tr>
                           )}
                        </tbody>
                      </table>
                   </div>
                </div>

                {/* Document Footer */}
                <div className="pt-12 flex items-center justify-between opacity-30">
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em]">
                         <Printer className="h-3 w-3" /> Rendered Manifest
                      </div>
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em]">
                         <Share2 className="h-3 w-3" /> Distributed Sync
                      </div>
                   </div>
                   <div className="text-[9px] font-black tracking-widest">PAGE 01 // END OF MANIFEST</div>
                </div>
             </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ")
}
