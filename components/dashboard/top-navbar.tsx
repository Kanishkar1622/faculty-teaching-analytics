"use client"

import { useAuth } from "@/lib/auth-context"
import type { PageKey } from "@/components/dashboard/app-sidebar"
import { Menu, Bell, Search, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"

const pageTitles: Record<PageKey, string> = {
  "admin-dashboard": "Coordinator Dashboard",
  "faculty-management": "Faculty Management",
  "teaching-analytics": "Teaching Analytics",
  "feedback-analytics": "Feedback Analytics",
  "reports": "Reports",
  "faculty-dashboard": "Faculty Dashboard",
  "student-dashboard": "Student Dashboard",
  "syllabus-tracking": "Syllabus Tracking",
  "syllabus-update": "Syllabus Update",
  "attendance-analytics": "Attendance Analytics",
  "mark-attendance": "Mark Attendance",
  "timetable-management": "Timetable Management",
  "faculty-timetable": "My Timetable",
  "task-management": "Task Management",
}

interface TopNavbarProps {
  activePage: PageKey
  onToggleSidebar: () => void
}

export function TopNavbar({ activePage, onToggleSidebar }: TopNavbarProps) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/5 bg-background/60 px-8 backdrop-blur-xl transition-all duration-300">
      <div className="flex items-center gap-6">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleSidebar} 
            className="h-10 w-10 rounded-xl bg-muted/50 text-foreground hover:bg-primary/10 hover:text-primary transition-colors" 
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </motion.div>
        
        <div className="flex flex-col">
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={activePage}
            className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2"
          >
            {pageTitles[activePage]}
            {activePage === "faculty-dashboard" && <Sparkles className="h-4 w-4 text-primary animate-pulse" />}
          </motion.h1>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            {user?.role === "admin" ? "Institutional Oversight" : user?.role === "student" ? "Academic Portal" : `Session: ${new Date().getFullYear()}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden lg:block group">
          <div className="absolute inset-0 bg-primary/5 blur-xl group-focus-within:bg-primary/10 transition-all rounded-xl" />
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search analytics..." 
            className={cn(
                "h-10 w-72 border-white/10 bg-muted/40 pl-11 ring-offset-background transition-all hover:bg-muted/60 focus:bg-background focus:ring-1 rounded-xl",
                user?.role === "student" ? "focus:ring-emerald-500/30" : "focus:ring-primary/30"
            )}
          />
        </div>

        <div className="flex items-center gap-2 border-l border-white/10 pl-4 ml-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="icon" className={cn(
                "relative h-10 w-10 rounded-xl bg-muted/30 text-foreground transition-colors",
                user?.role === "student" ? "hover:bg-emerald-500/10" : "hover:bg-primary/10"
            )} aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className={cn(
                  "absolute right-2.5 top-2.5 h-2 w-2 rounded-full animate-pulse",
                  user?.role === "student" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              )} />
            </Button>
          </motion.div>

          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-xs font-bold text-foreground leading-tight">{user?.name || "Faculty Member"}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{user?.role || "Faculty"}</span>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} className="relative shadow-2xl">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name || "User"}
                className={cn(
                    "h-10 w-10 rounded-xl object-cover ring-2 p-0.5",
                    user?.role === "student" ? "ring-emerald-500/20" : "ring-primary/20"
                )}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-lg",
                  user?.role === "student" ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/20" : "bg-gradient-to-br from-primary to-purple-600 shadow-primary/20"
              )}>
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </header>
  )
}

