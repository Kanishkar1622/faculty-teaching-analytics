"use client"

import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard,
  Users,
  BarChart3,
  MessageSquare,
  FileText,
  UserCircle,
  LogOut,
  GraduationCap,
  BookOpen,
  MapPin,
  Calendar,
  ClipboardList,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export type PageKey =
  | "admin-dashboard"
  | "faculty-management"
  | "teaching-analytics"
  | "feedback-analytics"
  | "reports"
  | "faculty-dashboard"
  | "student-dashboard"
  | "syllabus-tracking"
  | "syllabus-update"
  | "attendance-analytics"
  | "mark-attendance"
  | "timetable-management"
  | "faculty-timetable"
  | "task-management"

interface AppSidebarProps {
  activePage: PageKey
  onNavigate: (page: PageKey) => void
  collapsed?: boolean
}

const adminNav = [
  { key: "admin-dashboard" as PageKey, label: "Dashboard", icon: LayoutDashboard },
  { key: "faculty-management" as PageKey, label: "Faculty", icon: Users },
  { key: "task-management" as PageKey, label: "Tasks", icon: ClipboardList },
  { key: "timetable-management" as PageKey, label: "Timetable", icon: Calendar },
  { key: "attendance-analytics" as PageKey, label: "Attendance", icon: MapPin },
  { key: "syllabus-tracking" as PageKey, label: "Syllabus Tracking", icon: BookOpen },
  { key: "feedback-analytics" as PageKey, label: "Feedback", icon: MessageSquare },
  { key: "reports" as PageKey, label: "Reports", icon: FileText },
]

const facultyNav = [
  { key: "faculty-dashboard" as PageKey, label: "My Dashboard", icon: LayoutDashboard },
  { key: "faculty-timetable" as PageKey, label: "My Timetable", icon: Calendar },
  { key: "mark-attendance" as PageKey, label: "Mark Attendance", icon: MapPin },
  { key: "syllabus-update" as PageKey, label: "Syllabus Update", icon: BookOpen },
  { key: "feedback-analytics" as PageKey, label: "My Feedback", icon: MessageSquare },
  { key: "reports" as PageKey, label: "Reports", icon: FileText },
]

const studentNav = [
  { key: "student-dashboard" as PageKey, label: "My Dashboard", icon: LayoutDashboard },
  { key: "student-dashboard" as PageKey, label: "Daily Schedule", icon: Calendar },
  { key: "student-dashboard" as PageKey, label: "Assignments", icon: ClipboardList },
  { key: "student-dashboard" as PageKey, label: "Give Feedback", icon: MessageSquare },
]

export function AppSidebar({ activePage, onNavigate, collapsed }: AppSidebarProps) {
  const { user, logout } = useAuth()
  const navItems = user?.role === "admin" ? adminNav : user?.role === "student" ? studentNav : facultyNav

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "relative flex h-screen flex-col overflow-hidden border-r border-white/10 bg-sidebar/80 backdrop-blur-xl transition-colors duration-500",
        "dark:bg-[#050505]/80"
      )}
    >
      {/* Decorative Glow */}
      <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-primary/20 blur-[100px]" />
      <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-purple-500/10 blur-[100px]" />

      <div className="relative flex h-20 items-center gap-3 px-6">
        <motion.div 
          whileHover={{ rotate: 5, scale: 1.05 }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/20"
        >
          <GraduationCap className="h-6 w-6 text-white" />
        </motion.div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <span className="text-base font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Faculty Portal
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Intelligence Suite
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="relative flex-1 space-y-1 px-4 py-6 overflow-y-auto custom-scrollbar">
        {!collapsed && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="block mb-4 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50"
          >
            Menu
          </motion.span>
        )}
        {navItems.map((item) => {
          const isActive = activePage === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300",
                isActive 
                  ? user?.role === "student" 
                    ? "text-emerald-500 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    : "text-primary bg-primary/5 shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav-glow"
                  className={cn(
                    "absolute inset-0 rounded-xl border bg-transparent",
                    user?.role === "student" ? "border-emerald-500/20 bg-emerald-500/5" : "border-primary/20 bg-primary/5"
                  )}
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="active-nav-bar"
                  className={cn(
                    "absolute left-0 h-5 w-1 rounded-full",
                    user?.role === "student" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-primary"
                  )}
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                isActive 
                  ? user?.role === "student" ? "text-emerald-500" : "text-primary" 
                  : "text-muted-foreground/70 group-hover:text-foreground"
              )} />
              
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 text-left"
                >
                  {item.label}
                </motion.span>
              )}
              
              {!collapsed && isActive && (
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </motion.div>
              )}
            </button>
          )
        })}
      </nav>

      <div className="relative border-t border-white/5 p-4">
        <div className={cn(
          "flex items-center gap-3 rounded-2xl bg-muted/30 p-3 transition-all duration-300",
          collapsed ? "justify-center" : "hover:bg-muted/50"
        )}>
          <div className="relative shadow-xl">
             {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name || "User"}
                className="h-9 w-9 shrink-0 rounded-xl object-cover ring-2 ring-background"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary text-sm font-bold ring-2 ring-background">
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
          </div>
          
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <span className="truncate text-sm font-bold text-foreground">{user?.name || "User"}</span>
              <span className="truncate text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{user?.role || "Faculty"}</span>
            </motion.div>
          )}
          
          {!collapsed && (
            <motion.button
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={logout}
              className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.aside>
  )
}

