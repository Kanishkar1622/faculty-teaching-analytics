import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { StoredFile } from "@/models"

export async function GET(req: NextRequest) {
    try {
        await dbConnect()
        const id = req.nextUrl.searchParams.get("id")

        if (!id) {
            return new NextResponse("Missing id parameter", { status: 400 })
        }

        console.log(`[pdf-view] Fetching file from MongoDB: ${id}`)
        const file = await StoredFile.findById(id)

        if (!file) {
            console.error(`[pdf-view] File not found: ${id}`)
            return new NextResponse(`File not found: ${id}`, { status: 404 })
        }

        // Return the binary data as a response with the correct headers
        return new NextResponse(file.data, {
            headers: {
                "Content-Type": file.contentType || "application/pdf",
                "Content-Disposition": `inline; filename="${file.name}"`,
                "Content-Length": file.size.toString(),
                "Cache-Control": "private, max-age=3600",
            },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Internal Server Error"
        console.error("[pdf-view] ERROR:", message)
        return new NextResponse(message, { status: 500 })
    }
}
