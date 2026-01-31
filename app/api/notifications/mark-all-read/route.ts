import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Notification from '@/lib/models/Notification';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await Notification.updateMany(
            { recipient: user._id, read: false },
            { $set: { read: true } }
        );

        return NextResponse.json({ message: 'All notifications marked as read' }, { status: 200 });
    } catch (error) {
        console.error('Mark all read error:', error);
        return NextResponse.json({ message: 'Failed to mark notifications as read' }, { status: 500 });
    }
}
