"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { AppSidebar, type PageKey } from "@/components/dashboard/app-sidebar"
import { TopNavbar } from "@/components/dashboard/top-navbar"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { FacultyManagement } from "@/components/dashboard/faculty-management"
import { TeachingAnalytics } from "@/components/dashboard/teaching-analytics"
import { FeedbackAnalytics } from "@/components/dashboard/feedback-analytics"
import { FacultyDashboardView } from "@/components/dashboard/faculty-dashboard"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"
import { SyllabusTracking } from "@/components/dashboard/syllabus-tracking"
import { SyllabusUpdateForm } from "@/components/dashboard/syllabus-update"
import { MarkAttendance } from "@/components/dashboard/mark-attendance"
import { AttendanceAnalytics } from "@/components/dashboard/attendance-analytics"
import { TimetableManagement } from "@/components/dashboard/timetable-management"
import { FacultyTimetableView } from "@/components/dashboard/faculty-timetable"
import { Reports } from "@/components/dashboard/reports"
import { TaskManagement } from "@/components/dashboard/task-management"

import { LandingPage } from "@/components/landing-page"


function DashboardPage() {
  const { user } = useAuth()
  const defaultPage: PageKey = user?.role === "admin" ? "admin-dashboard" : user?.role === "student" ? "student-dashboard" : "faculty-dashboard"
  const [activePage, setActivePage] = useState<PageKey>(defaultPage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const renderPage = () => {
    switch (activePage) {
      case "admin-dashboard":
        return <AdminDashboard />
      case "faculty-management":
        return <FacultyManagement />
      case "teaching-analytics":
        return <TeachingAnalytics />
      case "feedback-analytics":
        return <FeedbackAnalytics />
      case "reports":
        return <Reports />
      case "faculty-dashboard":
        return <FacultyDashboardView />
      case "student-dashboard":
        return <StudentDashboard />
      case "syllabus-tracking":
        return <SyllabusTracking />
      case "syllabus-update":
        return <SyllabusUpdateForm />
      case "mark-attendance":
        return <MarkAttendance />
      case "attendance-analytics":
        return <AttendanceAnalytics />
      case "timetable-management":
        return <TimetableManagement />
      case "faculty-timetable":
        return <FacultyTimetableView />
      case "task-management":
        return <TaskManagement />
      default:
        return <AdminDashboard />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        activePage={activePage}
        onNavigate={setActivePage}
        collapsed={sidebarCollapsed}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavbar
          activePage={activePage}
          onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
        />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default function ClientApp() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LandingPage onGetStarted={() => {}} />
  }

  return <DashboardPage />
}
