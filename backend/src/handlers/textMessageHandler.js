import { databases } from '../appwrite/client.js';

async function handleTextMessage(event, client) {
    const text = event.message.text.trim().toLowerCase();

    let reply = 'Unknown command. Type "help" to see commands.';

    if (text === 'hello') {
        reply = 'Hello 👋';
    }

    if (text === 'help') {
        reply = `Commands:
    - hello
    - help
    - dashboard
    - checkin`;
    }

    if (text === 'dashboard') {
        const frontendUrl = process.env.FRONTEND_URL;
        const clubId = process.env.DEFAULT_CLUB_ID;

        reply = `Live dashboard: ${frontendUrl}`;
    }

    if (text === 'appwrite-test') {
        const result = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_CLUBS_COLLECTION_ID
        );

        reply = `Appwrite connected Clubs found: ${result.total}`
    }

    await client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: reply }],
    });

}

export {
    handleTextMessage,
}