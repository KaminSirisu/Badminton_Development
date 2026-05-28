import 'dotenv/config';
import express from 'express';
import * as line from '@line/bot-sdk';
import { lineWebhook } from './webhook/lineWebhook.js';
import path from 'path';

// 1. Explicitly point dotenv to your backend folder's .env file
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PORT = process.env.PORT || 3001;

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
    lineWebhook(req, res, client);
});

app.listen(PORT, () => {
    console.log(`LINE bot server running on port ${PORT}`);
});