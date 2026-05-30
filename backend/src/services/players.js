import { Query } from 'node-appwrite';
import { databases } from '../appwrite/client.js';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const PLAYERS_COLLECTION_ID = process.env.APPWRITE_PLAYERS_COLLECTION_ID;

function assertPlayersConfig() {
    if (!DATABASE_ID) {
        throw new Error('APPWRITE_DATABASE_ID is missing in .env');
    }

    if (!PLAYERS_COLLECTION_ID) {
        throw new Error('APPWRITE_PLAYERS_COLLECTION_ID is missing in .env');
    }
}

async function findPlayersByName(playerName) {
    const cleanName = String(playerName || '').trim();

    if (!cleanName) return [];

    assertPlayersConfig();

    const result = await databases.listDocuments(
        DATABASE_ID,
        PLAYERS_COLLECTION_ID,
        [
            Query.equal('name', cleanName),
            Query.limit(2),
        ]
    );

    return result.documents;
}

async function getPlayerByLineUserId(lineUserId) {
    if (!lineUserId) return null;

    assertPlayersConfig();

    const result = await databases.listDocuments(
        DATABASE_ID,
        PLAYERS_COLLECTION_ID,
        [
            Query.equal('lineUserId', lineUserId),
            Query.limit(1),
        ]
    );

    return result.documents[0] || null;
}

async function linkLineUserToPlayer({ playerName, lineUserId, lineDisplayName }) {
    assertPlayersConfig();

    const players = await findPlayersByName(playerName);

    if (players.length === 0) {
        return {
            ok: false,
            message: 'ไม่พบชื่อผู้เล่น กรุณาติดต่อเจ้าของก๊วน',
        };
    }

    if (players.length > 1) {
        return {
            ok: false,
            message: 'พบชื่อผู้เล่นหลายคน กรุณาติดต่อเจ้าของก๊วน',
        };
    }

    const player = players[0];

    if (player.lineUserId && player.lineUserId !== lineUserId) {
        return {
            ok: false,
            message: 'ชื่อผู้เล่นนี้ได้เชื่อมต่อกับบัญชีไลน์อื่นแล้ว กรุณาติดต่อเจ้าของก๊วน',
        };
    }

    const alreadyLinkedPlayer = await getPlayerByLineUserId(lineUserId);

    if (alreadyLinkedPlayer && alreadyLinkedPlayer.$id !== player.$id) {
        return {
            ok: false,
            message: `บัญชีไลน์ของผู้ใช้ได้เชื่อมกับชื่อผู้เล่น: ${alreadyLinkedPlayer.name}`,
        };
    }

    const updatedPlayer = await databases.updateDocument(
        DATABASE_ID,
        PLAYERS_COLLECTION_ID,
        player.$id,
        {
            lineUserId,
            lineDisplayName: lineDisplayName || 'LINE User',
        }
    );

    return {
        ok: true,
        player: updatedPlayer,
        message: `เชื่อมต่อเรียบร้อย ✅\nชื่อผู้เล่น: ${updatedPlayer.name}`,
    };
}

export {
    findPlayersByName,
    getPlayerByLineUserId,
    linkLineUserToPlayer,
};
