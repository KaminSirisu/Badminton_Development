import { databases, ID, Query, appwriteConfig } from '../appwrite/client.js';
import { getPlayerByLineUserId } from './players.js';

const { databaseId, bookingsCollectionId } = appwriteConfig;

function assertBookingsConfig() {
    if (!databaseId) throw new Error('APPWRITE_DATABASE_ID is missing in .env');
    if (!bookingsCollectionId) throw new Error('APPWRITE_BOOKINGS_COLLECTION_ID is missing in .env');
}

function getBangkokToday() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
}

async function createLineBooking({
    lineUserId,
    lineDisplayName,
    clubId,
    bookingTime,
}) {
    if (!lineUserId) throw new Error('lineUserId is required');
    if (!clubId) throw new Error('clubId is required');
    if (!bookingTime) throw new Error('bookingTime is required');

    assertBookingsConfig();

    const player = await getPlayerByLineUserId(lineUserId);
    const bookingDate = getBangkokToday();

    const payload = {
        lineUserId,
        lineDisplayName: lineDisplayName || 'LINE User',
        clubId,
        bookingTime,
        bookingDate,
        status: 'booked',
        // createdAt: new Date().toISOString(),
    };

    if (player) {
        payload.playerId = player.$id;
        payload.playerName = player.name || null;
    }

    return databases.createDocument(
        databaseId,
        bookingsCollectionId,
        ID.unique(),
        payload
    );
}

async function findTodayBookingByLineUserId({ lineUserId, clubId }) {
    if (!lineUserId) throw new Error('lineUserId is required');
    if (!clubId) throw new Error('clubId is required');
    
    assertBookingsConfig();

    const bookingDate = getBangkokToday();

    const result = await databases.listDocuments(
        databaseId,
        bookingsCollectionId,
        [
            Query.equal('lineUserId', lineUserId),
            Query.equal('clubId', clubId),
            Query.equal('bookingDate', bookingDate),
            Query.orderDesc('$createdAt'),
            Query.limit(1),
        ]
    )

    return result.documents[0] || null;
}

async function markBookingCheckedIn({ bookingId, checkInId }) {
    if (!bookingId) throw new Error('bookingId is required');

    assertBookingsConfig();

    const payload = {
        status: 'checked_in',
    };

    if (checkInId) {
        payload.checkInId = checkInId;
    }

    return databases.updateDocument(
        databaseId,
        bookingsCollectionId,
        bookingId,
        payload
    );
}

export {
    createLineBooking,
    findTodayBookingByLineUserId,
    markBookingCheckedIn,
};
