import { databases, ID } from '../appwrite/client.js';

async function createCheckIn({ lineUserId, lineDisplayName, clubId, checkInTime }) {
    if (!lineUserId) {
        throw new Error('lineUserId is required');
    }

    if (!clubId) {
        throw new Error('clubId is required');
    }

    if (!checkInTime) {
        throw new Error('checkInTime is required');
    }

    const now = new Date();

    return databases.createDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_CHECKIN_COLLECTION_ID,
        ID.unique(),
        {
            name: lineDisplayName || `LINE User ${lineUserId}`,
            clubId,
            checkInTime,
            createAt: now.toISOString(),
            source: 'LINE'
        }
    );
}

export {
    createCheckIn,
}
