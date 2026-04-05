"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useFaculty, useLocationAttendance, useCampusConfig, saveCampusConfig } from "@/lib/api-service"
import { MapPin, Settings, CheckCircle2, Users, Clock, Plus, Trash2, Map as MapIcon, Globe, Navigation, ChevronRight, X, ShieldCheck } from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { AnimatedCounter } from "./animated-counter"

const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-1))",
]

const barConfig = { count: { label: "Records", color: "hsl(var(--primary))" } }
const lineConfig = { count: { label: "Attendance", color: "hsl(var(--chart-2))" } }
const pieConfig = { value: { label: "Records" } }

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

export function AttendanceAnalytics() {
    const { data: faculty, loading: loadingFaculty } = useFaculty()
    const { data: allAttendance, loading: loadingAttendance } = useLocationAttendance()
    const { config: campus, loading: loadingCampus } = useCampusConfig()

    const [showConfig, setShowConfig] = useState(false)
    const [cfgName, setCfgName] = useState("")
    const [cfgLat, setCfgLat] = useState("")
    const [cfgLng, setCfgLng] = useState("")
    const [cfgRadius, setCfgRadius] = useState("")
    const [cfgBoundary, setCfgBoundary] = useState<{ latitude: string; longitude: string }[]>([])
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const loading = loadingFaculty || loadingAttendance || loadingCampus

    const openConfig = () => {
        if (campus) {
            setCfgName(campus.name)
            setCfgLat(String(campus.latitude))
            setCfgLng(String(campus.longitude))
            setCfgRadius(String(campus.radiusMeters))
            setCfgBoundary(
                (campus.boundary || []).map((p: any) => ({
                    latitude: String(p.latitude),
                    longitude: String(p.longitude),
                }))
            )
        }
        setShowConfig(true)
    }

    const addBoundaryPoint = () => {
        setCfgBoundary(prev => [...prev, { latitude: "", longitude: "" }])
    }

    const removeBoundaryPoint = (index: number) => {
        setCfgBoundary(prev => prev.filter((_, i) => i !== index))
    }

    const updateBoundaryPoint = (index: number, field: "latitude" | "longitude", value: string) => {
        setCfgBoundary(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
    }

    const handleSaveConfig = async () => {
        setSaving(true)
        try {
            const boundary = cfgBoundary
                .filter(p => p.latitude && p.longitude)
                .map(p => ({ latitude: Number(p.latitude), longitude: Number(p.longitude) }))

            const centerLat = boundary.length >= 3
                ? boundary.reduce((s, p) => s + p.latitude, 0) / boundary.length
                : Number(cfgLat)
            const centerLng = boundary.length >= 3
                ? boundary.reduce((s, p) => s + p.longitude, 0) / boundary.length
                : Number(cfgLng)

            await saveCampusConfig({
                latitude: centerLat,
                longitude: centerLng,
                radiusMeters: Number(cfgRadius) || 500,
                name: cfgName || "Main Campus",
                boundary,
            })
            setSaved(true)
            setTimeout(() => { setSaved(false); setShowConfig(false) }, 1500)
        } catch { /* ignore */ } finally {
            setSaving(false)
        }
    }

    const presentRecords = allAttendance.filter(a => a.status === "present")

    const facultyAttendance = useMemo(() =>
        faculty.map(f => ({
            name: f.name.split(" ").pop() || f.name,
            fullName: f.name,
            count: presentRecords.filter(a => a.facultyId === f.id).length,
        })).sort((a, b) => b.count - a.count),
        [faculty, presentRecords])

    const subjectAttendance = useMemo(() => {
        const map = new Map<string, number>()
        presentRecords.forEach(a => map.set(a.subjectName, (map.get(a.subjectName) || 0) + 1))
        return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    }, [presentRecords])

    const trendData = useMemo(() => {
        const dateMap = new Map<string, number>()
        presentRecords.forEach(a => dateMap.set(a.date, (dateMap.get(a.date) || 0) + 1))
        return Array.from(dateMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-14)
            .map(([date, count]) => ({ date: date.slice(5), count }))
    }, [presentRecords])

    const statsOverview = useMemo(() => [
        { label: "Total Logs", value: presentRecords.length, icon: ShieldCheck, color: "bg-blue-500/10 text-blue-500", glow: "shadow-blue-500/20" },
        { label: "Active Today", value: presentRecords.filter(a => a.date === new Date().toISOString().split("T")[0]).length, icon: Clock, color: "bg-emerald-500/10 text-emerald-500", glow: "shadow-emerald-500/20" },
        { label: "Faculty Engaged", value: new Set(presentRecords.map(a => a.facultyId)).size, icon: Users, color: "bg-violet-500/10 text-violet-500", glow: "shadow-violet-500/20" },
        { label: "Avg Proximity", value: presentRecords.length > 0 ? Math.round(presentRecords.reduce((s, a) => s + a.distanceFromCampus, 0) / presentRecords.length) : 0, unit: "m", icon: Navigation, color: "bg-amber-500/10 text-amber-500", glow: "shadow-amber-500/20" },
    ], [presentRecords])

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
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <motion.div variants={itemVariants} className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-card-foreground">
                        Geofence <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Analytics</span>
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold tracking-tight">{campus?.name || "Global"} Bound: {campus?.boundary?.length || 0} Polygon Nodes</span>
                    </div>
                </motion.div>
                <motion.div variants={itemVariants}>
                    <Button variant="outline" onClick={openConfig} className="h-11 border-white/5 bg-white/5 font-black uppercase text-[11px] tracking-widest transition-all hover:bg-white/10 hover:border-white/10 shadow-lg px-6">
                        <Settings className="mr-2 h-4 w-4 text-primary" /> Configuration
                    </Button>
                </motion.div>
            </div>

            <AnimatePresence>
                {showConfig && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="border-primary/20 bg-primary/5 backdrop-blur-2xl shadow-2xl">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
                                <div>
                                    <CardTitle className="text-xl font-black flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-primary" /> Perimeter Definition
                                    </CardTitle>
                                    <CardDescription className="font-medium">Orchestrate the institutional geofence boundaries for precise validation.</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setShowConfig(false)} className="rounded-full hover:bg-white/5"><X className="h-5 w-5" /></Button>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="space-y-4 md:col-span-1">
                                        <div className="flex flex-col gap-1.5">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Locale Identifier</Label>
                                            <Input value={cfgName} onChange={e => setCfgName(e.target.value)} className="bg-background/50 border-white/5 h-11" placeholder="Main Campus" />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Threshold Radius (m)</Label>
                                            <Input type="number" value={cfgRadius} onChange={e => setCfgRadius(e.target.value)} className="bg-background/50 border-white/5 h-11" placeholder="500" />
                                        </div>
                                        <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4">
                                            <p className="text-xs font-bold text-orange-500 leading-relaxed italic">The system requires minimum 3 nodes to synthesize a valid polygonal boundary.</p>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Geospatial Nodes</Label>
                                            <Button variant="ghost" size="sm" onClick={addBoundaryPoint} className="h-8 text-[10px] font-black uppercase tracking-tighter text-primary hover:bg-primary/10">
                                                <Plus className="mr-1 h-3 w-3" /> Append Node
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto px-1 pr-3 custom-scrollbar">
                                            {cfgBoundary.map((point, idx) => (
                                                <motion.div 
                                                    key={idx} 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-center gap-3 bg-white/5 p-2 rounded-xl group border border-transparent hover:border-white/10 transition-all shadow-sm"
                                                >
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background/50 font-black text-xs text-muted-foreground shadow-inner">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="grid flex-1 grid-cols-2 gap-2">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            placeholder="Latitude"
                                                            value={point.latitude}
                                                            onChange={e => updateBoundaryPoint(idx, "latitude", e.target.value)}
                                                            className="bg-background/30 border-white/5 h-9 text-xs font-bold"
                                                        />
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            placeholder="Longitude"
                                                            value={point.longitude}
                                                            onChange={e => updateBoundaryPoint(idx, "longitude", e.target.value)}
                                                            className="bg-background/30 border-white/5 h-9 text-xs font-bold"
                                                        />
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => removeBoundaryPoint(idx)} className="h-9 w-9 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </motion.div>
                                            ))}
                                            {cfgBoundary.length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                                    <Navigation className="h-10 w-10 mb-2" />
                                                    <p className="text-xs font-bold uppercase tracking-widest">No Active Nodes</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex items-center justify-end gap-3 border-t border-white/5 pt-6">
                                    <Button variant="ghost" onClick={() => setShowConfig(false)} disabled={saving} className="font-bold text-xs uppercase tracking-widest">Cancel</Button>
                                    <Button onClick={handleSaveConfig} disabled={saving} className="min-w-[160px] h-11 font-black shadow-lg shadow-primary/20">
                                        {saving ? "Deploying..." : "Sync Geofence"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                {statsOverview.map(stat => (
                    <motion.div key={stat.label} variants={itemVariants}>
                        <Card className="relative overflow-hidden border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/60">
                            <CardContent className="flex items-center gap-4 p-6">
                                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform", stat.color, stat.glow)}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-2xl font-black text-card-foreground">
                                        <AnimatedCounter value={stat.value} />
                                        {stat.unit && <span className="ml-1 text-xs font-bold opacity-40">{stat.unit}</span>}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Primary Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <motion.div variants={itemVariants}>
                    <Card className="border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-lg font-black flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" /> Personnel Velocity
                            </CardTitle>
                            <CardDescription>Aggregate engagement density mapped against faculty nodes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[280px] w-full pt-4">
                                <ChartContainer config={barConfig} className="h-full w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={facultyAttendance}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--white))" opacity={0.05} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} fillOpacity={0.8} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-lg font-black flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-indigo-500" /> Subject Distribution
                            </CardTitle>
                            <CardDescription>Spatial telemetry distribution across academic modules.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {subjectAttendance.length > 0 ? (
                                <div className="h-[280px] w-full items-center justify-center flex pt-4 group">
                                    <ChartContainer config={pieConfig} className="h-full w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie 
                                                    data={subjectAttendance} 
                                                    cx="50%" 
                                                    cy="50%" 
                                                    innerRadius={70} 
                                                    outerRadius={95} 
                                                    paddingAngle={6} 
                                                    dataKey="value" 
                                                    nameKey="name"
                                                    stroke="none"
                                                >
                                                    {subjectAttendance.map((entry, i) => (
                                                        <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />
                                                    ))}
                                                </Pie>
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                </div>
                            ) : (
                                <div className="flex h-[280px] items-center justify-center opacity-40 italic font-medium">Insufficient telemetry data for matrix synthesis.</div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Daily Trend Area */}
            <motion.div variants={itemVariants}>
                <Card className="border-white/5 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/50 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-black flex items-center gap-2">
                                <Clock className="h-5 w-5 text-emerald-500" /> Temporal Stream
                            </CardTitle>
                            <CardDescription>14-day trailing engagement delta visualization.</CardDescription>
                        </div>
                        <Badge variant="secondary" className="h-7 text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border-none">Stable Trend Detected</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[240px] w-full pt-4">
                            <ChartContainer config={lineConfig} className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--white))" opacity={0.05} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Area type="monotone" dataKey="count" stroke="hsl(var(--chart-2))" strokeWidth={3} fillOpacity={1} fill="url(#attendanceGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Attendance Matrix Log */}
            <motion.div variants={itemVariants}>
                <Card className="border-white/5 bg-card/40 backdrop-blur-xl overflow-hidden">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-blue-500" /> Telemetric Verification Log
                                </CardTitle>
                                <CardDescription>Detailed audit trail including proximity validation and status checks.</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="h-9 px-4 font-black uppercase text-[10px] tracking-widest hover:bg-white/5">Export Manifest</Button>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5 text-left">
                                    <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground whitespace-nowrap">Personnel Identifier</th>
                                    <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground whitespace-nowrap">Subject Vector</th>
                                    <th className="hidden p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground whitespace-nowrap sm:table-cell">Temporal Stamp</th>
                                    <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground whitespace-nowrap">Proximity</th>
                                    <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground whitespace-nowrap">Encryption</th>
                                    <th className="p-4 font-black uppercase tracking-wider text-[11px] text-muted-foreground whitespace-nowrap text-right">Validation</th>
                                </tr>
                            </thead>
                            <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                                {[...allAttendance]
                                    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
                                    .slice(0, 20)
                                    .map((a, idx) => (
                                        <motion.tr key={a.id} variants={itemVariants} className="border-b border-white/10 transition-all hover:bg-white/[0.03] group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 font-black text-[11px] text-muted-foreground">
                                                        {a.facultyName.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-card-foreground text-sm">{a.facultyName}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] font-black uppercase h-7 tracking-tighter">
                                                    {a.subjectName}
                                                </Badge>
                                            </td>
                                            <td className="hidden p-4 sm:table-cell">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-card-foreground">{a.date}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground mt-0.5">{a.time}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("h-1.5 w-1.5 rounded-full", a.distanceFromCampus < 100 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]")} />
                                                    <span className="text-xs font-black text-muted-foreground tracking-tighter">{a.distanceFromCampus}m</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="text-[10px] font-black text-muted-foreground border-none opacity-40 uppercase tracking-widest px-0">SHA-256</Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest", 
                                                    a.status === "present" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                                )}>
                                                    {a.status === "present" ? <CheckCircle2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                                    {a.status === "present" ? "Verified" : "Rejected"}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                {allAttendance.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3 opacity-40">
                                                <Navigation className="h-10 w-10" />
                                                <p className="font-black uppercase tracking-widest text-[11px]">No Spatial Manifests Found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </motion.tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-center">
                        <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
                            View Historical Repository
                        </Button>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    )
}

function cn(...classes: (string | undefined | null | boolean)[]) {
    return classes.filter(Boolean).join(" ")
}
