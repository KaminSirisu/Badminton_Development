import { storage, databases, ID, Query, appwriteConfig } from '../appwrite/client.js';
import { InputFile } from 'node-appwrite/file';

const DAILY_SLIP_LIMIT = 3;
const {
    databaseId,
    moneySlipCollectionId,
    slipStorageId,
} = appwriteConfig;

function getBangkokDayRange() {
    const now = new Date();

    const bangkokDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now);

    const start = new Date(`${bangkokDate}T00:00:00+07:00`);
    const end = new Date(`${bangkokDate}T23:59:59.999+07:00`);

    return {
        startIso: start.toISOString(),
        endIso: end.toISOString(),
    };
}

async function assertDailySlipLimit(lineUserId) {
    const { startIso, endIso } = getBangkokDayRange();

    const result = await databases.listDocuments(
        databaseId,
        moneySlipCollectionId,
        [
            Query.equal('lineUserId', lineUserId),
            Query.greaterThanEqual('timestamp', startIso),
            Query.lessThanEqual('timestamp', endIso),
            Query.limit(3),
        ]
    );

    if (result.total >= DAILY_SLIP_LIMIT) {
        const error = new Error('DAILY_SLIP_LIMIT_EXCEEDED');
        error.code = 'DAILY_SLIP_LIMIT_EXCEEDED';
        throw error;
    }

    return result.total;
}

async function downloadLineImage(messageId) {
    const response = await fetch(
        `https://api-data.line.me/v2/bot/message/${messageId}/content`,
        {
        headers: {
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to download LINE image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

async function uploadSlipFromLine({
    lineUserId,
    lineDisplayName,
    messageId,
    clubId,
    playerId,
    playerName,
}) {
    if (!lineUserId) throw new Error('lineUserId is required');
    if (!messageId) throw new Error('messageId is required');
    if (!clubId) throw new Error('clubId is required');
    if (!playerId) throw new Error('playerId is required');
    if (!playerName) throw new Error('playerName is required');

    await assertDailySlipLimit(lineUserId);

    const imageBuffer = await downloadLineImage(messageId);

    const filename = `line-slip-${lineUserId}-${Date.now()}.jpg`

    const file = InputFile.fromBuffer(imageBuffer, filename);

    const uploadedFile = await storage.createFile(
        slipStorageId,
        ID.unique(),
        file
    );

    const now = new Date();

    const slipDocument = await databases.createDocument(
        databaseId,
        moneySlipCollectionId,
        ID.unique(),
        {
            user: playerName,
            club: clubId,
            fileId: uploadedFile.$id,
            timestamp: now.toISOString(),
            playerId,
            // source: 'line',
            lineUserId,
            // status: 'pending'
        }
    )

    return {
        uploadedFile,
        slipDocument,
    };
}

export {
    uploadSlipFromLine,
}
