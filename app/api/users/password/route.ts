import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();

        const userFromSession = await getCurrentUser();
        if (!userFromSession) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user with password field
        const user = await User.findById(userFromSession._id).select('+password');
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { currentPassword, newPassword, confirmPassword } = await request.json();

        // Validate inputs
        if (!currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        return NextResponse.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
    }
}
