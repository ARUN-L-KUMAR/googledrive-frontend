import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Notification from '@/lib/models/Notification';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        await connectToDatabase();
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const notification = await Notification.findOne({
            _id: resolvedParams.id,
            recipient: user._id,
        });

        if (!notification) {
            return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
        }

        notification.read = true;
        await notification.save();

        return NextResponse.json({ notification }, { status: 200 });
    } catch (error) {
        console.error('Update notification error:', error);
        return NextResponse.json({ message: 'Failed to update notification' }, { status: 500 });
    }
}
