import { textMessageHandler } from './handlers/textMessageHandler.js';

async function webhook(req, res, client) {
    try {
        const events = req.body.events;

        await Promise.all(events.map(async (event) => {
            if (event.type !== 'message') return;
            if (event.message.type !== 'text') return;

            await textMessageHandler(event, client);
        }));

        res.status(200).send('OK');
    } catch (e) {
        console.error(e);
        res.status(500).send('Error');
    }
}

export default {
    webhook,
}