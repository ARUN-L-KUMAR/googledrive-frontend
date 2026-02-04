const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const authMiddleware = require('../middleware/auth');

// GET /api/activity
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { filter, limit = 50 } = req.query;

        const query = { userId: req.user._id };

        // Filter by action type if specified
        if (filter && filter !== 'all') {
            const actionMap = {
                uploads: ['file_upload'],
                deletions: ['file_delete', 'file_permanent_delete', 'folder_delete'],
                shares: ['share_link_create', 'share_link_revoke'],
                profile: ['profile_update', 'password_change', 'avatar_update'],
                starred: ['file_star', 'file_unstar'],
                moves: ['file_move', 'file_copy'],
            };

            if (actionMap[filter]) {
                query.action = { $in: actionMap[filter] };
            }
        }

        const activities = await Activity.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({ activities });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ message: 'Failed to get activity' });
    }
});

module.exports = router;
