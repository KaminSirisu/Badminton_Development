import { databases, ID, Query, appwriteConfig } from '../appwrite/client.js';
import { getPlayerByLineUserId } from './players.js';
import {
    findTodayBookingByLineUserId,
    markBookingCheckedIn,
} from './bookings.js';
const { databaseId, checkinCollectionId } = appwriteConfig;

function assertCheckinsConfig() {
    if (!databaseId) throw new Error('APPWRITE_DATABASE_ID is missing in .env');
    if (!checkinCollectionId) throw new Error('APPWRITE_CHECKIN_COLLECTION_ID is missing in .env');
}

function getBangkokToday() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
}

async function findTodayCheckInByLineUserId({ lineUserId, clubId }) {
    if (!lineUserId) throw new Error('lineUserId is required');
    if (!clubId) throw new Error('clubId is required');

    assertCheckinsConfig();

    const result = await databases.listDocuments(
        databaseId,
        checkinCollectionId,
        [
            Query.equal('lineUserId', lineUserId),
            Query.equal('clubId', clubId),
            Query.equal('checkInDate', getBangkokToday()),
            Query.orderDesc('$createdAt'),
            Query.limit(1),
        ]
    );

    return result.documents[0] || null;
}

async function createQrCheckIn({ clubId, lineUserId, lineDisplayName }) {
    if (!clubId) throw new Error('clubId is required');
    if (!lineUserId) throw new Error('lineUserId is required');
    if (!lineDisplayName) throw new Error('lineDisplayName is required');

    assertCheckinsConfig();

    const existingCheckIn = await findTodayCheckInByLineUserId({
        lineUserId,
        clubId,
    });

    if (existingCheckIn) {
        return {
            ok: true,
            duplicate: true,
            message: 'You are already checked in today.',
            checkIn: existingCheckIn,
        };
    }

    const [player, booking] = await Promise.all([
        getPlayerByLineUserId(lineUserId),
        findTodayBookingByLineUserId({ lineUserId, clubId }),
    ]);

    const now = new Date();
    const status = player ? 'ready_for_matchmaking' : 'pending_profile';

    const payload = {
        lineUserId,
        lineDisplayName,
        clubId,
        name: player?.name || lineDisplayName,
        checkInTime: now.toLocaleTimeString('en-GB', {
            timeZone: 'Asia/Bangkok',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }),
        checkInDate: getBangkokToday(),
        createAt: now.toISOString(),
        source: 'qr',
        status,
    };

    if (player) {
        payload.playerId = player.$id;
        
        if (player.skillLevel) {
            payload.skillLevel = player.skillLevel;
        }
    }

    if (booking) {
        payload.bookingId = booking.$id;
    }

    const checkIn = await databases.createDocument(
        databaseId,
        checkinCollectionId,
        ID.unique(),
        payload
    );

    if (booking) {
        await markBookingCheckedIn({
            bookingId: booking.$id,
            checkInId: checkIn.$id,
        });
    }

    return {
        ok: true,
        status,
        message: player
            ? 'Check-in successful. Ready for matchmaking.'
            : 'Check-in successful. Waiting for admin setup.',
        checkIn,
    };
}

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

    assertCheckinsConfig();

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
    createQrCheckIn,
    findTodayCheckInByLineUserId,
}
