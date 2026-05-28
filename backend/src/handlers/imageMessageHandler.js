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

    try {
        const lineDisplayName = await getLineDisplayName(client, lineUserId);

        const result = await uploadSlipFromLine({
            lineUserId,
            lineDisplayName,
            messageId,
            clubId,
        });

        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
                {
                    type: 'text',
                    text: `Payment slip uploaded successfully
                Name: ${lineDisplayName || 'LINE User'}
                File ID: ${result.uploadedFile.$id}
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
                        text: 'You can upload payment slips only 3 times per day. Please try again tomorrow.',
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
