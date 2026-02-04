const Activity = require('../models/Activity');

async function logActivity(userId, action, targetType, targetId, targetName, metadata = {}) {
    try {
        await Activity.create({
            userId,
            action,
            targetType,
            targetId,
            targetName,
            metadata,
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}

// Non-blocking version
function logActivityAsync(userId, action, targetType, targetId, targetName, metadata = {}) {
    logActivity(userId, action, targetType, targetId, targetName, metadata).catch(console.error);
}

module.exports = { logActivity, logActivityAsync };
