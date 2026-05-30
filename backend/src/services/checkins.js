import { databases, ID, appwriteConfig } from '../appwrite/client.js';
import { getPlayerByLineUserId } from './players.js';
const { databaseId, checkinCollectionId } = appwriteConfig;

async function createLineCheckIn({
    lineUserId, 
    lineDisplayName, 
    clubId, 
    checkInTime,
    playerId,
    playerName, 
}) {
    if (!lineUserId) throw new Error('lineUserId is required');
    if (!clubId) throw new Error('clubId is required');
    if (!checkInTime) throw new Error('checkInTime is required');
    if (!playerId) throw new Error('playerId is required');
    if (!playerName) throw new Error('playerName is required');

    return await databases.createDocument(
        databaseId,
        checkinCollectionId,
        ID.unique(),
        {
            name: playerName,
            playerId,
            clubId,
            checkInTime,
            createAt: new Date().toISOString(),
            source: 'LINE',
            lineUserId,
            lineDisplayName: lineDisplayName || 'LINE User',
        }
    );
}

export {
    createLineCheckIn,
}
