import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Notification from '@/lib/models/Notification';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const notifications = await Notification.find({ recipient: user._id })
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50 notifications

        return NextResponse.json({ notifications }, { status: 200 });
    } catch (error) {
        console.error('Fetch notifications error:', error);
        return NextResponse.json({ message: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// Optional: Internal endpoint if we wanted client-side creation, 
// but we'll mostly use backend triggers. 
// Adding it for completeness or debugging if needed.
export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { type, title, message, relatedId } = await request.json();

        const notification = await Notification.create({
            recipient: user._id,
            type: type || 'info',
            title,
            message,
            relatedId,
        });

        return NextResponse.json({ notification }, { status: 201 });
    } catch (error) {
        console.error('Create notification error:', error);
        return NextResponse.json({ message: 'Failed to create notification' }, { status: 500 });
    }
}
