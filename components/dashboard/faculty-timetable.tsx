"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useTimetable } from "@/lib/api-service"
import { Clock, Calendar, Coffee, UtensilsCrossed } from "lucide-react"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

// Fixed template for display ordering
const ROW_TEMPLATE = [
    { periodNumber: 1, type: "period" as const, label: "Period 1", startTime: "09:00", endTime: "09:50" },
    { periodNumber: 2, type: "period" as const, label: "Period 2", startTime: "09:50", endTime: "10:40" },
    { periodNumber: 0, type: "break" as const, label: "Short Break", startTime: "10:40", endTime: "10:55" },
    { periodNumber: 3, type: "period" as const, label: "Period 3", startTime: "10:55", endTime: "11:45" },
    { periodNumber: 4, type: "period" as const, label: "Period 4", startTime: "11:45", endTime: "12:35" },
    { periodNumber: 0, type: "lunch" as const, label: "Lunch Break", startTime: "12:35", endTime: "13:15" },
    { periodNumber: 5, type: "period" as const, label: "Period 5", startTime: "13:15", endTime: "14:05" },
    { periodNumber: 6, type: "period" as const, label: "Period 6", startTime: "14:05", endTime: "14:55" },
    { periodNumber: 0, type: "break" as const, label: "Short Break", startTime: "14:55", endTime: "15:00" },
]

export function FacultyTimetableView() {
    const { getFacultyId } = useAuth()
    const facultyId = getFacultyId()

    // Fetch ALL timetable data (needed to show breaks/lunch for days that have timetables)
    const { data: allPeriods, loading } = useTimetable()

    const [selectedDay, setSelectedDay] = useState(() => {
        const today = new Date().getDay()
        return DAYS[today >= 1 && today <= 6 ? today - 1 : 0]
    })

    // Build full day schedule: my periods + breaks/lunch + free hours
    const myDaySchedule = useMemo(() => {
        // Check if this day has any timetable data at all
        const dayPeriods = allPeriods.filter(p => p.day === selectedDay)
        if (dayPeriods.length === 0) return [] // No timetable for this day

        return ROW_TEMPLATE.map(tmpl => {
            if (tmpl.type !== "period") {
                // Break/lunch — always show
                return { ...tmpl, isMyClass: false, subject: "", classSection: "", classroom: "", department: "", section: "" }
            }
            const match = dayPeriods.find(p => p.type === "period" && p.periodNumber === tmpl.periodNumber && p.facultyId === facultyId)
            if (match) {
                return { ...tmpl, isMyClass: true, subject: match.subject, classSection: match.classSection, classroom: match.classroom, department: match.department, section: match.section }
            }
            // Unassigned or another faculty's period → "Free Hour"
            return { ...tmpl, isMyClass: false, subject: "", classSection: "", classroom: "", department: "", section: "" }
        })
    }, [allPeriods, selectedDay, facultyId])

    // Count my periods per day
    const weeklySummary = useMemo(() =>
        DAYS.map(day => {
            const count = allPeriods.filter(p => p.day === day && p.type === "period" && p.facultyId === facultyId).length
            return { day, count }
        }), [allPeriods, facultyId])

    const todayPeriods = weeklySummary.find(w => w.day === selectedDay)?.count || 0
    const totalWeekPeriods = weeklySummary.reduce((s, w) => s + w.count, 0)

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Weekly Summary */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Card className="border-border bg-card">
                    <CardContent className="flex flex-col items-center justify-center p-4">
                        <p className="text-xs text-muted-foreground">Today&apos;s Periods</p>
                        <p className="text-2xl font-bold text-card-foreground">{todayPeriods}</p>
                    </CardContent>
                </Card>
                <Card className="border-border bg-card">
                    <CardContent className="flex flex-col items-center justify-center p-4">
                        <p className="text-xs text-muted-foreground">Weekly Periods</p>
                        <p className="text-2xl font-bold text-card-foreground">{totalWeekPeriods}</p>
                    </CardContent>
                </Card>
                <Card className="border-border bg-card sm:col-span-1 col-span-2">
                    <CardContent className="flex flex-col items-center justify-center p-4">
                        <p className="text-xs text-muted-foreground">Weekly Load</p>
                        <p className="text-2xl font-bold text-card-foreground">{totalWeekPeriods * 50} min</p>
                    </CardContent>
                </Card>
            </div>

            {/* Day Selector */}
            <div className="flex flex-wrap items-center gap-2">
                {DAYS.map(day => {
                    const count = weeklySummary.find(w => w.day === day)?.count || 0
                    return (
                        <Button
                            key={day}
                            variant={selectedDay === day ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedDay(day)}
                            className="gap-1.5"
                        >
                            {day.slice(0, 3)}
                            {count > 0 && (
                                <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">{count}</Badge>
                            )}
                        </Button>
                    )
                })}
            </div>

            {/* Day Schedule */}
            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-card-foreground">
                        <Calendar className="h-5 w-5" /> {selectedDay}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {myDaySchedule.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">No timetable configured for {selectedDay}</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {myDaySchedule.map((slot, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center gap-4 rounded-lg border p-3 ${slot.type === "break" ? "border-amber-500/30 bg-amber-500/5" :
                                            slot.type === "lunch" ? "border-orange-500/30 bg-orange-500/5" :
                                                slot.isMyClass ? "border-primary/30 bg-primary/5" :
                                                    "border-border/50 bg-background"
                                        }`}
                                >
                                    {/* Time */}
                                    <div className="flex flex-col items-center text-xs text-muted-foreground w-16 shrink-0">
                                        <span className="font-medium">{slot.startTime}</span>
                                        <span className="text-[10px]">to</span>
                                        <span className="font-medium">{slot.endTime}</span>
                                    </div>

                                    {/* Icon */}
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${slot.type === "break" ? "bg-amber-500/10 text-amber-500" :
                                            slot.type === "lunch" ? "bg-orange-500/10 text-orange-500" :
                                                slot.isMyClass ? "bg-primary/10 text-primary" :
                                                    "bg-muted text-muted-foreground"
                                        }`}>
                                        {slot.type === "break" ? <Coffee className="h-5 w-5" /> :
                                            slot.type === "lunch" ? <UtensilsCrossed className="h-5 w-5" /> :
                                                <Clock className="h-5 w-5" />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-card-foreground text-sm">{slot.label}</p>
                                            {slot.isMyClass && (
                                                <Badge className="text-[10px]">Your Class</Badge>
                                            )}
                                        </div>
                                        {slot.type === "break" ? (
                                            <p className="text-xs text-muted-foreground">☕ Short Break</p>
                                        ) : slot.type === "lunch" ? (
                                            <p className="text-xs text-muted-foreground">🍽 Lunch Break</p>
                                        ) : slot.isMyClass ? (
                                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                <Badge variant="outline" className="text-[10px]">{slot.subject}</Badge>
                                                {slot.department && slot.section ? (
                                                    <span className="text-xs text-muted-foreground">{slot.department} - {slot.section}</span>
                                                ) : slot.classSection ? (
                                                    <span className="text-xs text-muted-foreground">{slot.classSection}</span>
                                                ) : null}
                                                {slot.classroom && <span className="text-xs text-muted-foreground">· {slot.classroom}</span>}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">Free Hour</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
