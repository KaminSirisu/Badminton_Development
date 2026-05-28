import { databases } from "../appwrite/client.js";

async function getClubById(clubId) {
    if (!clubId) throw new Error('clubId is required');
    
    return databases.getDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_CLUBS_COLLECTION_ID,
        clubId
    );
}

export {
    getClubById,
}
