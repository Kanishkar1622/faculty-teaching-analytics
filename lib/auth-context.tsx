"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import type { Role, UserProfile } from "@/lib/types"

interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string, role: Role, department?: string, regno?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  getFacultyId: () => string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

// Helper: resolve facultyId by querying the MongoDB faculty collection by email
async function resolveFacultyId(email: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/db/faculty?email=${encodeURIComponent(email)}`)
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) return data[0].id
    return null
  } catch (err) {
    console.error("resolveFacultyId error:", err)
    return null
  }
}

// Helper: fetch profile from MongoDB with timeout
async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000) // 8s timeout

  try {
    const res = await fetch(`/api/db/users?id=${uid}`, { signal: controller.signal })
    clearTimeout(timeoutId)
    
    if (!res.ok) {
        if (res.status === 404) return null
        throw new Error(`Profile fetch failed: ${res.status}`)
    }
    return await res.json()
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      console.error("fetchUserProfile: Request timed out after 8s")
    } else {
      console.error("fetchUserProfile error:", err)
    }
    return null
  }
}

// Helper: save profile to MongoDB
async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await fetch("/api/db/users", {
        method: "POST",
        body: JSON.stringify({
            ...profile,
            _id: profile.uid // Ensure MongoDB _id matches Firebase uid
        })
    })
  } catch (err) {
    console.error("saveUserProfile error:", err)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from MongoDB by UID
        let profile = await fetchUserProfile(firebaseUser.uid)
        let placeholderInfo: Partial<UserProfile> = {}
        
        // If not found by UID, check if there's a placeholder user with this email (from seed data)
        if (!profile && firebaseUser.email) {
          try {
            const emailRes = await fetch(`/api/db/users?email=${encodeURIComponent(firebaseUser.email)}`)
            const existingUsers = await emailRes.json()
            if (Array.isArray(existingUsers) && existingUsers.length > 0) {
              const placeholder = existingUsers[0]
              console.log(`[auth] Clearing placeholder user for email: ${firebaseUser.email}`)
              // Capture its role and facultyId before deletion
              placeholderInfo = { 
                role: placeholder.role, 
                facultyId: placeholder.facultyId 
              }
              await fetch(`/api/db/users?id=${placeholder.id}`, { method: "DELETE" })
            }
          } catch (err) {
            console.error("[auth] Error checking for placeholder:", err)
          }
        }

        if (profile) {
          // Auto-resolve missing facultyId for faculty users
          if (!profile.facultyId && profile.role === "faculty" && profile.email) {
            const resolvedId = await resolveFacultyId(profile.email)
            if (resolvedId) {
              profile = { ...profile, facultyId: resolvedId }
              // Update in MongoDB
              await fetch(`/api/db/users?id=${firebaseUser.uid}`, {
                  method: "PUT",
                  body: JSON.stringify({ facultyId: resolvedId })
              })
            }
          }
          setUser(profile)
        } else {
          // No MongoDB record yet — create one (e.g. first-time Google sign-in)
          const email = firebaseUser.email || ""
          const resolvedFacultyId = await resolveFacultyId(email)
          
          // Determine initial role: preserve from placeholder if available, else check if it's admin email
          const initialRole: Role = (placeholderInfo.role as Role) || (email === "admin@college.edu" ? "admin" : "faculty")
          
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || email || "User",
            email,
            role: initialRole,
            photoURL: firebaseUser.photoURL || "",
            facultyId: placeholderInfo.facultyId || resolvedFacultyId || undefined
          }
          // saveUserProfile now includes _id: profile.uid
          await saveUserProfile(newProfile)
          setUser(newProfile)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log(`[auth] Attempting login for: ${email}`)
      const credential = await signInWithEmailAndPassword(auth, email, password)
      console.log(`[auth] Firebase login success for UID: ${credential.user.uid}`)
      
      const profile = await fetchUserProfile(credential.user.uid)
      if (profile) {
        console.log(`[auth] MongoDB profile found: ${profile.role}`)
        setUser(profile)
      } else {
        console.warn(`[auth] No MongoDB profile found for UID: ${credential.user.uid}`)
      }
      
      return { success: true }
    } catch (err: any) {
      console.error("[auth] Login error:", err.code || err.message)
      let message = "Login failed"
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        message = "Invalid email or password. Please check your credentials and try again."
      } else if (err.code === "auth/too-many-requests") {
        message = "Account temporarily disabled due to many failed attempts. Please try again later."
      } else if (err.code === "auth/user-disabled") {
        message = "This account has been disabled by an administrator."
      } else if (err.code === "auth/network-request-failed") {
        message = "Network error. Please check your internet connection."
      } else {
        message = err.message || "An unexpected error occurred during sign-in."
      }
      return { success: false, error: message }
    }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider()
      const credential = await signInWithPopup(auth, provider)
      const profile = await fetchUserProfile(credential.user.uid)
      
      if (profile) {
        setUser(profile)
      } else {
        // First-time Google user — create profile in MongoDB
        const email = credential.user.email || ""
        const resolvedFacultyId = await resolveFacultyId(email)
        const newProfile: UserProfile = {
          uid: credential.user.uid,
          name: credential.user.displayName || email || "User",
          email,
          role: "faculty",
          photoURL: credential.user.photoURL || "",
          ...(resolvedFacultyId ? { facultyId: resolvedFacultyId } : {}),
        }
        await saveUserProfile(newProfile)
        setUser(newProfile)
      }
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign-in failed"
      return { success: false, error: message }
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string, role: Role, department?: string, regno?: string) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      const profile: UserProfile = {
        uid: credential.user.uid,
        name,
        email,
        role,
        department,
        regno,
      }
      // Store user profile in MongoDB
      await saveUserProfile(profile)
      setUser(profile)
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed"
      return { success: false, error: message }
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
    setUser(null)
  }, [])

  const getFacultyId = useCallback(() => {
    return user?.facultyId || null
  }, [user])

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user || !!auth.currentUser, 
      loading, 
      login, 
      loginWithGoogle, 
      register, 
      logout, 
      getFacultyId 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
