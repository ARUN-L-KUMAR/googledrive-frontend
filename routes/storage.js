const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/storage
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            storageUsed: user.storageUsed,
            storageLimit: user.storageLimit,
            percentageUsed: (user.storageUsed / user.storageLimit) * 100,
        });
    } catch (error) {
        console.error('Get storage error:', error);
        res.status(500).json({ message: 'Failed to get storage info' });
    }
});

module.exports = router;
