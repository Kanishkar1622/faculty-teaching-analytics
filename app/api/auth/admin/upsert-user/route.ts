import { NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, facultyId } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    let userRecord
    try {
      // Check if user exists
      userRecord = await adminAuth.getUserByEmail(email)
      
      // Update existing user if found
      userRecord = await adminAuth.updateUser(userRecord.uid, {
        password,
        displayName: name,
      })
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create new user if not found
        userRecord = await adminAuth.createUser({
          email,
          password,
          displayName: name,
        })
      } else {
        throw error
      }
    }

    // Set custom claims if needed (role, facultyId)
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role,
      facultyId,
    })

    return NextResponse.json({
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName,
    })
  } catch (error: any) {
    console.error("[UPSERT_USER_ERROR]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
