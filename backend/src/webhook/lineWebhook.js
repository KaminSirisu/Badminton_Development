import { handleTextMessage } from '../handlers/textMessageHandler.js';
import { handleImageMessage } from '../handlers/imageMessageHandler.js';

async function lineWebhook(req, res, client) {
    try {
        const events = req.body.events || [];

        await Promise.all(events.map(async (event) => {
            if (event.type !== 'message') return;
            if (event.message.type === 'text') {
                await handleTextMessage(event, client);
                return;
            }

            if (event.message.type === 'image') {
                await handleImageMessage(event, client);
                return;
            }
        }));

        res.status(200).send('OK');
    } catch (e) {
        console.error(e);
        res.status(500).send('Error');
    }
}

export {
    lineWebhook,
}