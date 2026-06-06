import 'dotenv/config';
import express from 'express';
import * as line from '@line/bot-sdk';
import cors from 'cors';
import { lineWebhook } from './webhook/lineWebhook.js';
import { createQrCheckIn } from './services/checkins.js';
import { exportSessionToGoogleSheets } from './services/googleSheetsExport.js';
import path from 'path';

// 1. Explicitly point dotenv to your backend folder's .env file
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PORT = process.env.PORT || 3001;

const app = express();

const allowedOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS || '').split(','),
    'http://localhost:5173',
    'http://127.0.0.1:5173',
].filter(Boolean).map((origin) => origin.trim()).filter(Boolean);

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

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error(`CORS blocked origin: ${origin}`));
    },
    methods: ['POST', 'OPTIONS'],
}));

app.post('/api/line/qr-checkin', express.json(), async (req, res) => {
    try {
        const { clubId, lineUserId, lineDisplayName } = req.body;

        const result = await createQrCheckIn({
            clubId,
            lineUserId,
            lineDisplayName,
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('QR check-in failed:', error);

        const isValidationError =
            error.message.includes('is required');

        res.status(isValidationError ? 400 : 500).json({
            ok: false,
            message: isValidationError
                ? error.message
                : 'Unable to check in. Please try again later.',
        });
    }
})

app.post('/api/export/google-sheets', express.json(), async (req, res) => {
    try {
        const {
            targetDate,
            playerRows,
            expenseRow,
            overwrite = false,
        } = req.body;

        if (!targetDate) {
            return res.status(400).json({
                ok: false,
                message: 'targetDate is required',
            });
        }

        if (!Array.isArray(playerRows)) {
            return res.status(400).json({
                ok: false,
                message: 'playerRows must be an array',
            });
        }

        const result = await exportSessionToGoogleSheets({
            targetDate,
            playerRows,
            expenseRow,
            overwrite,
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('Google Sheets export failed:', error);

        return res.status(500).json({
            ok: false,
            message: error?.message || 'Google Sheets export failed',
        });
    }
})

app.post('/webhook', line.middleware(config), async (req, res) => {
    lineWebhook(req, res, client);
});

app.listen(PORT, () => {
    console.log(`LINE bot server running on port ${PORT}`);
});
