import { connectToDatabase } from '@/lib/db';

/**
 * Logs a user activity asynchronously (fire-and-forget)
 * This function does not throw errors to avoid disrupting the main operation
 */
export async function logActivity(
    userId: string,
    action: string,
    targetType: 'file' | 'folder' | 'user',
    targetId?: string,
    targetName?: string,
    metadata?: Record<string, any>
): Promise<void> {
    try {
        await connectToDatabase();
        const Activity = (await import('@/lib/models/Activity')).default;

        await Activity.create({
            userId,
            action,
            targetType,
            targetId: targetId || null,
            targetName: targetName || null,
            metadata: metadata || null,
        });
    } catch (error) {
        // Log error but don't throw to avoid disrupting the main operation
        console.error('Failed to log activity:', error);
    }
}

/**
 * Fire-and-forget version that doesn't await
 * Use this in API routes to avoid blocking the response
 */
export function logActivityAsync(
    userId: string,
    action: string,
    targetType: 'file' | 'folder' | 'user',
    targetId?: string,
    targetName?: string,
    metadata?: Record<string, any>
): void {
    // Don't await - fire and forget
    logActivity(userId, action, targetType, targetId, targetName, metadata);
}
