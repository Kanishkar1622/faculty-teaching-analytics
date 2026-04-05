"use client"

import { useParams, useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { Role } from "@/lib/types"
import { ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const params = useParams()
  const router = useRouter()
  const role = params.role as Role

  // Simple validation for the role
  const validRoles: Role[] = ["admin", "faculty", "student"]
  if (!validRoles.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-4">Invalid Portal Role</h1>
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

      {/* Login Form Wrapper */}
      <div className="flex min-h-screen items-center justify-center">
        <LoginForm 
          role={role} 
          onSwitch={() => router.push(`/register/${role}`)}
          onSuccess={() => router.push("/")}
        />
      </div>
    </main>
  )
}
