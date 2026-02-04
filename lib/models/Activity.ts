import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IActivity extends Document {
    userId: Types.ObjectId;
    action: string;
    targetType: 'file' | 'folder' | 'user';
    targetId?: Types.ObjectId;
    targetName?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                'file_upload',
                'file_delete',
                'file_trash',
                'file_restore',
                'file_permanent_delete',
                'file_star',
                'file_unstar',
                'file_rename',
                'file_move',
                'file_copy',
                'folder_create',
                'folder_delete',
                'folder_trash',
                'share_link_create',
                'share_link_revoke',
                'password_change',
                'avatar_change',
            ],
        },
        targetType: {
            type: String,
            enum: ['file', 'folder', 'user'],
            required: true,
        },
        targetId: {
            type: Schema.Types.ObjectId,
            default: null,
        },
        targetName: {
            type: String,
            default: null,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: null,
        },
    },
    { timestamps: true }
);

// Index for efficient querying by user and time
ActivitySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);
