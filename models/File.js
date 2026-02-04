const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
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
                    type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model('File', FileSchema);
