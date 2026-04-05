import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import { 
    Faculty as FacultyModel, 
    Subject as SubjectModel, 
    Attendance, 
    LocationAttendance,
    SessionAttendance, 
    Feedback, 
    SyllabusUpdate, 
    Timetable, 
    Task, 
    User, 
    Settings 
} from '@/models'

const models: Record<string, any> = {
    faculty: FacultyModel,
    subjects: SubjectModel,
    attendance: Attendance,
    locationAttendance: LocationAttendance,
    sessionAttendance: SessionAttendance,
    feedback: Feedback,
    syllabusUpdates: SyllabusUpdate,
    timetables: Timetable,
    tasks: Task,
    users: User,
    settings: Settings
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ collection: string }> }
) {
    const { collection } = await params
    const model = models[collection]

    if (!model) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    try {
        await dbConnect()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (id) {
            const data = await model.findById(id).lean()
            if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
            
            return NextResponse.json({
                ...data,
                id: data._id.toString(),
                _id: undefined,
                __v: undefined
            })
        }

        // Handle filtering
        const filters: Record<string, any> = {}
        searchParams.forEach((val, key) => {
            if (key !== 'id' && key !== 'limit' && key !== 'sort') {
                // Handle basic equality filters
                filters[key] = val
            }
        })

        const limit = parseInt(searchParams.get('limit') || '1000')
        const data = await model.find(filters).limit(limit).lean()
        
        // Transform _id to id for each item manually if lean is used
        const transformed = data.map((item: any) => ({
            ...item,
            id: item._id.toString(),
            _id: undefined,
            __v: undefined
        }))

        return NextResponse.json(transformed)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ collection: string }> }
) {
    const { collection } = await params
    const model = models[collection]

    if (!model) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    try {
        await dbConnect()
        let body = await request.json()
        
        // Handle batch insert if body is array
        if (Array.isArray(body)) {
            const prepared = body.map(item => ({
                _id: item._id || item.id || new mongoose.Types.ObjectId().toString(),
                ...item,
                id: undefined
            }))
            const data = await model.insertMany(prepared)
            return NextResponse.json(data)
        }

        // Generate ID if missing (needed for our String _id models)
        if (!body._id && !body.id) {
            body._id = new mongoose.Types.ObjectId().toString()
        } else if (body.id && !body._id) {
            body._id = body.id
        }
        delete body.id

        const data = await model.create(body)
        const result = data.toObject ? data.toObject() : data
        return NextResponse.json({
            ...result,
            id: result._id.toString(),
            _id: undefined,
            __v: undefined
        })
    } catch (error: any) {
        console.error(`[POST /api/db/${collection}] Error:`, error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ collection: string }> }
) {
    const { collection } = await params
    const model = models[collection]

    if (!model) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    try {
        await dbConnect()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const body = await request.json()

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 })
        }

        const data = await model.findByIdAndUpdate(id, body, { new: true }).lean()
        if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        return NextResponse.json({
            ...data,
            id: data._id.toString(),
            _id: undefined,
            __v: undefined
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ collection: string }> }
) {
    const { collection } = await params
    const model = models[collection]

    if (!model) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    try {
        await dbConnect()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const deleteMany = searchParams.get('deleteMany') === 'true'

        if (id) {
            await model.findByIdAndDelete(id)
            return NextResponse.json({ success: true })
        } else if (deleteMany) {
            // Bulk delete based on filters
            const filters: Record<string, any> = {}
            searchParams.forEach((val, key) => {
                if (key !== 'deleteMany') filters[key] = val
            })
            await model.deleteMany(filters)
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'ID or deleteMany required' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
