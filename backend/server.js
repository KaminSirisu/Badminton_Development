import 'dotenv/config';
import express from 'express';
import * as line from '@line/bot-sdk';
import path from 'path';

// 1. Explicitly point dotenv to your backend folder's .env file
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET
};

// 2. FIXED: Pass the token as a configuration object, not a raw string
const client = line.LineBotClient.fromChannelAccessToken({
    channelAccessToken: config.channelAccessToken
});

app.get('/', (req, res) => {
    res.send('LINE Bot Server is running smoothly!');
});

app.post('/webhook', line.middleware(config), async (req, res) => {
    try {
        const events = req.body.events;

        await Promise.all(events.map(async (event) => {
            if (event.type !== 'message') return;
            if (event.message.type !== 'text') return;

            const userMessage = event.message.text;

            await client.replyMessage({
                replyToken: event.replyToken,
                messages: [{
                    type: 'text',
                    text: `You said ${userMessage}`,
                }]
            });
            
        }));

        res.status(200).send('OK');
    } catch (e) {
        console.error("Webhook Error: ", e);
        res.status(500).send('Error');
    }
});

app.listen(process.env.PORT || 3001, () => {
    console.log(`LINE bot server running on port ${process.env.PORT || 3001}`);
});