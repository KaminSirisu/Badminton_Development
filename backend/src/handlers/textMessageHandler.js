// import { getLineProfile } from '../services/lineProfile.js';
import { getPlayerByLineUserId } from '../services/players.js';
import { getClubById } from '../services/clubs.js';
import { createLineBooking } from '../services/bookings.js';
import { generateCheckInSlots } from '../utils/timeSlots.js';
import { 
    setSession, 
    getSession, 
    clearSession, 
} from '../state/userSessions.js';

const FRONTEND_URL = process.env.FRONTEND_URL;
const DEFAULT_CLUB_ID = process.env.DEFAULT_CLUB_ID;
const BOOKING_COMMANDS = new Set(['checkin', 'booking', 'เช็คอิน', 'จองเวลา']);

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

async function handleBookingCommand({ lineUserId, client }) {
    const clubId = DEFAULT_CLUB_ID;

    if (!clubId) throw new Error('DEFAULT_CLUB_ID is missing in .env');

    const linkedPlayer = await getPlayerByLineUserId(lineUserId);
    const club = await getClubById(clubId);
    const slots = generateCheckInSlots(club.startTime);
    const lineDisplayName = await getLineDisplayName(client, lineUserId);
    const displayName = linkedPlayer?.name || lineDisplayName || 'ผู้เล่น';

    setSession(lineUserId, {
        action: 'select_booking_slot',
        clubId,
        clubName: club.clubName || club.name || 'Club',
        playerName: linkedPlayer?.name || null,
        slots,
    });

    return `เลือกเวลาจองสำหรับ ${displayName}:
กรุณาเลือกเป็นตัวเลข 1, 2, 3 หรือ 4
1) ${slots[0]}
2) ${slots[1]}
3) ${slots[2]}
4) ${slots[3]}
            `;
}

async function handleSelectedBookingSlot({ text, lineUserId, session, client }) {
    const selectedIndex = Number(text) - 1;
    const selectedSlot = session.slots[selectedIndex];

    if (!selectedSlot) {
        return 'Invalid option. Please reply 1, 2, 3, or 4.';
    }

    const lineDisplayName = await getLineDisplayName(client, lineUserId);

    const booking = await createLineBooking({
        lineUserId,
        lineDisplayName,
        clubId: session.clubId,
        bookingTime: selectedSlot,
    });

    clearSession(lineUserId);

    const bookedName = booking.playerName || lineDisplayName || session.playerName || 'LINE User';

    return `จองเวลาเรียบร้อย
ชื่อ: ${bookedName}
ก๊วน: ${session.clubName}
เวลา: ${selectedSlot}`;
}


async function handleTextMessage(event, client) {
    const text = event.message.text.trim().toLowerCase();
    const lineUserId = event.source.userId;
    const replyToken = event.replyToken;

    try {
        const session = getSession(lineUserId);

        if (session?.action === 'select_booking_slot') {
            const reply = await handleSelectedBookingSlot({
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
- เช็คอิน / checkin / booking / จองเวลา
  เลือกเวลาที่คาดว่าจะเข้าก๊วน

- สถานะแมตซ์ / dashboard
  ติดตามการจับคู่บนเว็บไซต์

- แปะสลิป / slip
  แนบสลิปโอนเงินให้กับเจ้าของก๊วน
        
ข้อจำกัด:
สามารถแปะสลิปได้สูงสุด 3 รูปต่อวัน
        `;
        }

        if (text === 'dashboard') {
            const frontendUrl = process.env.FRONTEND_URL;
            const clubId = process.env.DEFAULT_CLUB_ID;

            reply = `ติดตามสถานะแมตซ์: ${frontendUrl}/dashboard`;
        }

        if (text === 'slip' || text === 'สลิป') {
            const linkedPlayer = await getPlayerByLineUserId(lineUserId);

            if (!linkedPlayer) {
                reply = `ยังไม่พบข้อมูลผู้เล่นสำหรับบัญชี LINE นี้
กรุณาแจ้งแอดมินให้ยืนยันชื่อผู้เล่นก่อนส่งสลิป`;
            } else {
                setSession(lineUserId, {
                    action: 'waiting_for_slip',
                    clubId: process.env.DEFAULT_CLUB_ID,
                    playerId: linkedPlayer.$id,
                    playerName: linkedPlayer.name,
                });
                
                reply = `กรุณาส่งสลิปหลักฐานการชำระเงิน
    ชื่อผู้เล่น: ${linkedPlayer.name}
    ข้อจำกัด: 3 รูปต่อวัน`
            }
            
        }

        if (BOOKING_COMMANDS.has(text)) {
            reply = await handleBookingCommand({ lineUserId, client });
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
