import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { StoredFile } from "@/models"
import mongoose from "mongoose"

export async function POST(req: NextRequest) {
    try {
        await dbConnect()
        const formData = await req.formData()
        const file = formData.get("file") as File
        const taskId = formData.get("taskId") as string

        if (!file || !taskId) {
            return NextResponse.json({ error: "Missing file or taskId" }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Use the taskId as part of the ID for the file record
        // We can have multiple versions or just one per task
        const fileId = `file_${taskId}_${Date.now()}`

        await StoredFile.create({
            _id: fileId,
            name: file.name,
            data: buffer,
            contentType: file.type || "application/pdf",
            size: file.size
        })

        console.log(`[upload-task-pdf] Saved to MongoDB: ${fileId} (${file.name})`)

        // Return a proxy URL that points to our internal pdf-view API
        const proxyUrl = `/api/pdf-view?id=${fileId}`
        
        return NextResponse.json({ url: proxyUrl })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed"
        console.error("[upload-task-pdf] ERROR:", message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
