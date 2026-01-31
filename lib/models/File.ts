import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFile extends Document {
  userId: Types.ObjectId;
  parentId?: Types.ObjectId;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size: number;
  s3Key?: string;
  s3Url?: string;
  thumbnailUrl?: string;
  thumbnailS3Key?: string;
  isStarred: boolean;
  isTrashed: boolean;
  trashedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  sharedWith: Array<{
    userId: Types.ObjectId;
    permission: 'view' | 'edit';
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['file', 'folder'],
      required: true,
    },
    mimeType: {
      type: String,
      default: null,
    },
    size: {
      type: Number,
      default: 0,
    },
    s3Key: {
      type: String,
      default: null,
    },
    s3Url: {
      type: String,
      default: null,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    thumbnailS3Key: {
      type: String,
      default: null,
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
    isTrashed: {
      type: Boolean,
      default: false,
    },
    trashedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    sharedWith: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        permission: {
          type: String,
          enum: ['view', 'edit'],
          default: 'view',
        },
      },
    ],
  },
  { timestamps: true }
);

// Index for faster queries
FileSchema.index({ userId: 1, parentId: 1, isTrashed: 1, isDeleted: 1 });
FileSchema.index({ userId: 1, isStarred: 1, isDeleted: 1 });

export default mongoose.models.File || mongoose.model<IFile>('File', FileSchema);
