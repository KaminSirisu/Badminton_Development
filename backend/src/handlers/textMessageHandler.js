// import { getLineProfile } from '../services/lineProfile.js';
import { linkLineUserToPlayer, getPlayerByLineUserId } from '../services/players.js';
import { getClubById } from '../services/clubs.js';
import { createLineCheckIn } from '../services/checkins.js';
import { generateCheckInSlots } from '../utils/timeSlots.js';
import { 
    setSession, 
    getSession, 
    clearSession, 
} from '../state/userSessions.js';

const FRONTEND_URL = process.env.FRONTEND_URL;
const DEFAULT_CLUB_ID = process.env.DEFAULT_CLUB_ID;

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

    const linkedPlayer = await getPlayerByLineUserId(lineUserId);

    if (!linkedPlayer) {
        return `กรุณาเชื่อม LINE กับชื่อผู้เล่นในก๊วนก่อนเช็คอิน

พิมพ์:
link ชื่อผู้เล่น

ตัวอย่าง:
link GuyGam`;
    }

    const club = await getClubById(clubId);
    const slots = generateCheckInSlots(club.startTime);

    setSession(lineUserId, {
        action: 'select_checkin_slot',
        clubId,
        clubName: club.clubName || club.name || 'Club',
        playerId: linkedPlayer.$id,
        playerName: linkedPlayer.name,
        slots,
    })

    return `เลือกเวลาเช็คอินสำหรับ ${linkedPlayer.name}:
กรุณาเลือกเป็นตัวเลข 1, 2, 3 หรือ 4
1) ${slots[0]}
2) ${slots[1]}
3) ${slots[2]}
4) ${slots[3]}
            `
}

async function handleSelectedCheckInSlot({ text, lineUserId, session, client }) {
    const selectedIndex = Number(text) - 1;
    const selectedSlot = session.slots[selectedIndex];

    if (!selectedSlot) {
        return 'Invalid option. Please reply 1, 2, 3, or 4.';
    }

    const lineDisplayName = await getLineDisplayName(client, lineUserId);

    await createLineCheckIn({
        lineUserId,
        lineDisplayName,
        clubId: session.clubId,
        checkInTime: selectedSlot,
        playerId: session.playerId,
        playerName: session.playerName,
    });

    clearSession(lineUserId);

    return `เช็คอินเรียบร้อย
ชื่อ: ${session.playerName}
ก๊วน: ${session.clubName}
เวลา: ${selectedSlot}`;
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

        let reply = 'ไม่พบคำสั่ง กรุณาพิมพ์ help หรือ เมนู เพื่อดูคำสั่ง';

        if (text === 'hello' || text === 'สวัสดี') {
            reply = 'Hello 👋';
        }

        if (text === 'help' || text === 'menu' || text === 'เมนู') {
            reply = `ผู้ช่วยก๊วนแบตมินตัน
            
คำสั่ง:
- เช็คอิน / checkin
  เลือกเวลาเช็คอินเข้าก๊วน

- สถานะแมตซ์ / dashboard
  ติดตามการจับคู่บนเว็บไซต์

- แปะสลิป / slip
  แนบสลิปโอนเงินให้กับเจ้าของก๊วน
        
ข้อจำกัด:
สามารถแปะสลิปได้สูงสุด 3 รูปต่อวัน
        `;
        }

        if (text === 'link') {
            reply `กรุณาพิมพ์ชื่อผู้เล่นตามที่เจ้าของก๊วนสร้่างไว้\nตัวอย่าง\nlink GamGuy`
        }

        if (text.startsWith('link ')) {
            const playerName = event.message.text.replace(/^link\s+/i, '').trim();
            const lineDisplayName = await getLineDisplayName(client, lineUserId);

            const result = await linkLineUserToPlayer({
                playerName,
                lineUserId,
                lineDisplayName,
            });

            reply = result.message;
        }

        if (text === 'dashboard') {
            const frontendUrl = process.env.FRONTEND_URL;
            const clubId = process.env.DEFAULT_CLUB_ID;

            reply = `ติดตามสถานะแมตซ์: ${frontendUrl}`;
        }

        if (text === 'slip' || text === 'สลิป') {
            setSession(lineUserId, {
                action: 'waiting_for_slip',
                clubId: process.env.DEFAULT_CLUB_ID,
            });
            
            reply = `กรุณาส่งสลิปหลักฐานการชำระเงิน
ข้อจำกัด: 3 รูปต่อวัน`
        }

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
