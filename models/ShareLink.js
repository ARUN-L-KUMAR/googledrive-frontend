const mongoose = require('mongoose');

const ShareLinkSchema = new mongoose.Schema(
    {
        fileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'File',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model('ShareLink', ShareLinkSchema);
