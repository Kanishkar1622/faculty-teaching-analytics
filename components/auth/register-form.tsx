"use client"

import React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import type { Role } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GraduationCap, AlertCircle } from "lucide-react"

interface RegisterFormProps {
  role: Role
  onSwitch: () => void
  onSuccess: () => void
}

export function RegisterForm({ role: initialRole, onSwitch, onSuccess }: RegisterFormProps) {
  const { register } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>(initialRole)
  const [department, setDepartment] = useState("")
  const [regno, setRegno] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const departments = [
    "Computer Science & Engineering",
    "Information Technology",
    "Electronics & Communication",
    "Electrical & Electronics",
    "Mechanical Engineering",
    "Civil Engineering",
    "Artificial Intelligence & Data Science",
    "Cyber Security",
    "Fashion Technology",
    "Biotechnology"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!department) {
      setError("Please select a department")
      return
    }

    if (role === "student" && !regno) {
      setError("Please provide your Registration Number")
      return
    }

    setLoading(true)

    try {
      const result = await register(name, email, password, role, department, regno)
      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || "Registration failed")
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
          <GraduationCap className="h-7 w-7 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">Create Account</CardTitle>
        <CardDescription className="text-muted-foreground">Register for Faculty Analytics Dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-foreground">Full Name</Label>
            <Input
              id="name"
              placeholder="Dr. John Smith"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="bg-card text-foreground"
            />
          </div>

          {role === "student" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="regno" className="text-foreground">Registration Number</Label>
              <Input
                id="regno"
                placeholder="e.g. 2024CS001"
                value={regno}
                onChange={e => setRegno(e.target.value)}
                required
                className="bg-card text-foreground"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="department" className="text-foreground">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="bg-card text-foreground">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="reg-email" className="text-foreground">Email</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="john@college.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-card text-foreground"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reg-password" className="text-foreground">Password</Label>
            <Input
              id="reg-password"
              type="password"
              placeholder="Create a password (min 6 chars)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-card text-foreground"
            />
          </div>
          {/* Role is pre-set based on portal selection */}
          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button type="button" onClick={onSwitch} className="font-medium text-primary hover:underline">
              Sign In
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
