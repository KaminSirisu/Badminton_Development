import { getSession, clearSession } from '../state/userSessions.js';
import { uploadSlipFromLine } from '../services/payments.js';

async function getLineDisplayName(client, lineUserId) {
    try {
        const profile = await client.getProfile(lineUserId);
        return profile.displayName;
    } catch (err) {
        console.error('Failed to get LINE profile:', err);
        return null;
    }
}
 
async function handleImageMessage(event, client) {
    const lineUserId = event.source.userId;
    const messageId = event.message.id;
    const clubId = process.env.DEFAULT_CLUB_ID;

    const session = getSession(lineUserId);

    if(session?.action !== 'waiting_for_slip') {
        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
                {
                    type: 'text',
                    text: 'กรุณากดปุ่มแปะสลิปที่เมนูหรือพิมพ์ "เมนู" ก่อนสลิปหลักฐานการชำระเงิน',
                }
            ]
        })
    }

    if (!session.playerId || !session.playerName) {
        clearSession(lineUserId);

        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
                {
                    type: 'text',
                    text: `กรุณา link LINE กับชื่อผู้เล่นก่อนส่งสลิป

พิมพ์:
link ชื่อผู้เล่น

ตัวอย่าง:
link GuyGam`,
                }
            ]
        });

        return;
    }

    try {
        const lineDisplayName = await getLineDisplayName(client, lineUserId);

        const result = await uploadSlipFromLine({
            lineUserId,
            lineDisplayName,
            messageId,
            clubId,
            playerId: session.playerId,
            playerName: session.playerName,
        });

        clearSession(lineUserId);

        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
                {
                    type: 'text',
                    text: `อัปโหลดสลิปเรียบร้อย
                ชื่อ: ${session.playerName}
                ไอดีไฟล์: ${result.uploadedFile.$id}
                `,
                },
            ],
        });
    } catch (err) {
        console.error('Image upload error:', err);

        if (err.code === 'DAILY_SLIP_LIMIT_EXCEEDED') {
            await client.replyMessage({
                replyToken: event.replyToken,
                messages: [
                    {
                        type: 'text',
                        text: 'ผู้ใช้สามารถแปะสลิปได้แค่ 3 ครั้งต่อวัน กรุณาลองใหม่พรุ่งนี้',
                    },
                ],
            });
            return;
        }

        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
                {
                    type: 'text',
                    text: 'Sorry, I could not upload the payment slip. Please try again.',
                },
            ],
        });
    }
    
}
export {
    handleImageMessage,
}
