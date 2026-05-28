import { getClubById } from '../services/clubs.js';
import { createCheckIn } from '../services/checkins.js';
import { generateCheckInSlots } from '../utils/timeSlots.js';
import { 
    setSession, 
    getSession, 
    clearSession, 
} from '../state/userSessions.js';

async function getLineDisplayName(client, lineUserId) {
    try {
        const profile = await client.getProfile(lineUserId);
        return profile.displayName;
    } catch (err) {
        console.error('Failed to get LINE profile:', err);
        return null;
    }
}

async function replyText(client, replyToken, text) {
    await client.replyMessage({
        replyToken,
        messages: [
            {
                type: 'text',
                text,
            }
        ]
    });
}

async function handleCheckInCommand({ lineUserId }) {
    const clubId = process.env.DEFAULT_CLUB_ID;

    if (!clubId) throw new Error('DEFAULT_CLUB_ID is missing in .env');

    const club = await getClubById(clubId);
    const slots = generateCheckInSlots(club.startTime);

    setSession(lineUserId, {
        action: 'select_checkin_slot',
        clubId,
        clubName: club.clubName || club.name || 'Club',
        slots,
    })

    return `Select check-in time:
            1) ${slots[0]}
            2) ${slots[1]}
            3) ${slots[2]}
            `
}

async function handleSelectedCheckInSlot({ text, lineUserId, session, client }) {
    const selectedIndex = Number(text) - 1;
    const selectedSlot = session.slots[selectedIndex];

    if (!selectedSlot) {
        return 'Invalid option. Please reply 1, 2, or 3.';
    }

    const lineDisplayName = await getLineDisplayName(client, lineUserId);

    await createCheckIn({
        lineUserId,
        lineDisplayName,
        clubId: session.clubId,
        checkInTime: selectedSlot,
    });

    clearSession(lineUserId);

    return `Check-in successful
Name: ${lineDisplayName || 'LINE User'}
Club: ${session.clubName}
Time: ${selectedSlot}`;
}


async function handleTextMessage(event, client) {
    const text = event.message.text.trim().toLowerCase();
    const lineUserId = event.source.userId;
    const replyToken = event.replyToken;

    try {
        const session = getSession(lineUserId);

        if (session?.action === 'select_checkin_slot') {
            const reply = await handleSelectedCheckInSlot({
                text,
                lineUserId,
                session,
                client,
            });

            await replyText(client, replyToken, reply);
            return;
        }

        let reply = 'Unknown command. Type "help" to see commands.';

        if (text === 'hello') {
            reply = 'Hello 👋';
        }

        if (text === 'help') {
            reply = `Commands:
        - hello
        - help
        - dashboard
        - checkin/เช็คอิน
        `;
        }

        if (text === 'dashboard') {
            const frontendUrl = process.env.FRONTEND_URL;
            const clubId = process.env.DEFAULT_CLUB_ID;

            reply = `Live dashboard: ${frontendUrl}`;
        }

        // if (text === 'appwrite-test') {
        //     const result = await databases.listDocuments(
        //         process.env.APPWRITE_DATABASE_ID,
        //         process.env.APPWRITE_CLUBS_COLLECTION_ID
        //     );

        //     reply = `Appwrite connected Clubs found: ${result.total}`
        // }

        if (text === 'checkin' || text === 'เช็คอิน') {
            reply = await handleCheckInCommand({ lineUserId });
        }
        await replyText(client, replyToken, reply);
    } catch (err) {
        console.error('Text message handler error:', err);

        await replyText(
            client,
            replyToken,
            'Something went wrong. Please try again later.'
        );
    }
    
}

export {
    handleTextMessage,
}
