"use client"

import { useParams, useRouter } from "next/navigation"
import { RegisterForm } from "@/components/auth/register-form"
import { Role } from "@/lib/types"
import { ArrowLeft, ShieldAlert } from "lucide-react"

export default function RegisterPage() {
  const params = useParams()
  const router = useRouter()
  const role = params.role as Role

  // Admin registration is blocked by policy
  if (role === "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center bg-background">
        <div className="max-w-md p-8 rounded-3xl border border-destructive/20 bg-destructive/5">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Registration Restricted</h1>
          <p className="text-muted-foreground mb-8 text-sm">
            Admin/Coordinator accounts cannot be created via public registration. 
            Please contact the system administrator to obtain your credentials.
          </p>
          <button 
            onClick={() => router.push("/")}
            className="rounded-full bg-primary px-8 py-3 font-semibold text-white transition-all hover:scale-105"
          >
            Return to Landing Page
          </button>
        </div>
      </div>
    )
  }

  // Simple validation for other roles
  const validRoles: Role[] = ["faculty", "student"]
  if (!validRoles.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-4">Invalid Registration Role</h1>
          <button 
            onClick={() => router.push("/")}
            className="text-primary hover:underline"
          >
            Go back to Landing Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl opacity-50" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-accent/5 blur-3xl opacity-50" />
      </div>

      {/* Floating navigation */}
      <div className="absolute top-8 left-8 z-50">
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-2 rounded-full border border-border bg-background/50 backdrop-blur-sm px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-background hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
      </div>

      {/* Register Form Wrapper */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <RegisterForm 
          role={role} 
          onSwitch={() => router.push(`/login/${role}`)}
          onSuccess={() => router.push("/")}
        />
      </div>
    </main>
  )
}
