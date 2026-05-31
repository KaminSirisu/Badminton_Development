import { Client, Databases, Storage, ID, Query } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const appwriteConfig = {
    databaseId: process.env.APPWRITE_DATABASE_ID,
    playersCollectionId: process.env.APPWRITE_PLAYERS_COLLECTION_ID,
    clubsCollectionId: process.env.APPWRITE_CLUBS_COLLECTION_ID,
    checkinCollectionId: process.env.APPWRITE_CHECKIN_COLLECTION_ID,
    bookingsCollectionId: process.env.APPWRITE_BOOKINGS_COLLECTION_ID,
    moneySlipCollectionId: process.env.APPWRITE_MONEYSLIP_COLLECTION_ID,
    slipStorageId: process.env.APPWRITE_SLIP_STORAGE_ID,
}

export {
    client,
    databases,
    storage,
    ID,
    Query,
    appwriteConfig,
};
