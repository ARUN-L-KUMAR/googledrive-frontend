import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IShareLink extends Document {
    fileId: Types.ObjectId;
    userId: Types.ObjectId;
    token: string;
    expiresAt: Date;
    maxDownloads?: number;
    downloadCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const ShareLinkSchema = new Schema<IShareLink>(
    {
        fileId: {
            type: Schema.Types.ObjectId,
            ref: 'File',
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        maxDownloads: {
            type: Number,
            default: null,
        },
        downloadCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Index for efficient cleanup of expired links
ShareLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.ShareLink || mongoose.model<IShareLink>('ShareLink', ShareLinkSchema);
