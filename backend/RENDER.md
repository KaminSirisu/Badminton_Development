# Render Deployment

This backend is ready to deploy as a Render Web Service.

## Manual Web Service

Use these settings:

- Root Directory: `backend`
- Runtime: `Node`
- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check Path: `/`
- Node Version: `20`

## Environment Variables

Copy the values from your local `backend/.env` into Render:

```text
FRONTEND_URL
FRONTEND_URLS
LINE_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET
APPWRITE_ENDPOINT
APPWRITE_PROJECT_ID
APPWRITE_API_KEY
APPWRITE_DATABASE_ID
APPWRITE_PLAYERS_COLLECTION_ID
APPWRITE_CLUBS_COLLECTION_ID
APPWRITE_CHECKIN_COLLECTION_ID
APPWRITE_BOOKINGS_COLLECTION_ID
APPWRITE_MONEYSLIP_COLLECTION_ID
APPWRITE_SLIP_STORAGE_ID
DEFAULT_CLUB_ID
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_SHEETS_SPREADSHEET_ID
```

`PORT` is provided automatically by Render. Do not set it manually.

For `GOOGLE_PRIVATE_KEY`, paste the full private key value from the Google service account. The backend accepts either real line breaks or escaped `\n` line breaks.

## After Deploy

1. Open the Render service URL. You should see:

```text
LINE Bot Server is running smoothly!
```

2. Set the LINE webhook URL to:

```text
https://YOUR-RENDER-SERVICE.onrender.com/webhook
```

3. If the frontend calls this backend, update the frontend API URL or environment variable to the Render service URL.
