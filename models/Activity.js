const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                'file_upload',
                'file_download',
                'file_delete',
                'file_restore',
                'file_permanent_delete',
                'file_rename',
                'file_move',
                'file_copy',
                'file_star',
                'file_unstar',
                'folder_create',
                'folder_delete',
                'share_link_create',
                'share_link_revoke',
                'profile_update',
                'password_change',
                'avatar_update',
            ],
        },
        targetType: {
            type: String,
            enum: ['file', 'folder', 'user', 'share'],
            required: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        targetName: {
            type: String,
            required: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

// Index for efficient queries
ActivitySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', ActivitySchema);
