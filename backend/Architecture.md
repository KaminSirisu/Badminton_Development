# Backend Architecture

## Purpose

This backend is a small Node.js service that receives LINE Messaging API webhooks and translates them into badminton-club actions stored in Appwrite.

Today it mainly supports:

- linking a LINE account to an existing player
- starting a check-in flow and saving a selected check-in time
- starting a payment slip flow and uploading the slip image to Appwrite Storage

The backend is stateful only for short-lived chat flows. Persistent business data lives in Appwrite.

## Stack

- Node.js
- Express
- `@line/bot-sdk`
- `node-appwrite`
- `dotenv`

## High-Level Flow

1. LINE sends webhook events to `POST /webhook`.
2. Express applies LINE signature validation with `line.middleware(config)`.
3. `src/webhook/lineWebhook.js` iterates through events.
4. Events are dispatched by message type:
   - text -> `src/handlers/textMessageHandler.js`
   - image -> `src/handlers/imageMessageHandler.js`
5. Handlers call service modules to read/write Appwrite data.
6. The backend replies to the LINE user through the LINE Bot client.

## Main Entry Point

### `src/server.js`

Responsibilities:

- load environment variables
- create the Express app
- create the LINE Bot client
- expose health route `GET /`
- expose webhook route `POST /webhook`

Important details:

- Port defaults to `3001`
- The backend expects a local `.env` in the backend folder
- The LINE client is created from `LINE_CHANNEL_ACCESS_TOKEN`

## Folder Responsibilities

### `src/webhook/`

- `lineWebhook.js`
  - receives LINE events
  - ignores non-message events
  - routes text and image messages to the correct handler
  - processes all webhook events with `Promise.all`

### `src/handlers/`

- `textMessageHandler.js`
  - parses chat commands
  - manages short-lived session state
  - links LINE users to players
  - starts check-in flow
  - starts slip-upload flow
  - sends text replies

- `imageMessageHandler.js`
  - only handles image uploads during the slip-upload flow
  - verifies the current session
  - uploads the image to Appwrite through the payments service
  - enforces daily upload limits through the payments service

### `src/services/`

- `players.js`
  - query players by name
  - query player by `lineUserId`
  - link a LINE account to a single player record

- `clubs.js`
  - fetch a club document by ID

- `checkins.js`
  - create a check-in document sourced from LINE

- `payments.js`
  - enforce max 3 slips per LINE user per Bangkok day
  - download image content from LINE Data API
  - upload image file to Appwrite Storage
  - create a money slip document in Appwrite

- `lineProfile.js`
  - alternate direct LINE profile fetch helper
  - currently not used by the main flow

- `lineUsers.js`
  - currently duplicates the session-map pattern and does not appear to be used

### `src/state/`

- `userSessions.js`
  - in-memory `Map` keyed by `lineUserId`
  - stores temporary conversational state between messages
  - used for multi-step flows like check-in slot selection and waiting for slip upload

### `src/utils/`

- `timeSlots.js`
  - generates 4 half-hour check-in slots from a club `startTime`

### `src/appwrite/`

- `client.js`
  - creates shared Appwrite `Client`, `Databases`, and `Storage` instances
  - exports `ID`, `Query`, and `appwriteConfig`

## Runtime Conversation Flows

### 1. Link LINE Account

Command:

- `link <player name>`

Flow:

1. Read the player name from the original message text.
2. Fetch LINE display name from LINE profile API via the bot client.
3. Query Appwrite players collection by exact `name`.
4. Reject if no players or multiple players are found.
5. Reject if that player is already linked to another LINE user.
6. Reject if this LINE user is already linked to a different player.
7. Update the player document with:
   - `lineUserId`
   - `lineDisplayName`

### 2. Check-In Flow

Commands:

- `checkin`
- `เช็คอิน`

Flow:

1. Resolve the linked player from `lineUserId`.
2. Load the default club from `DEFAULT_CLUB_ID`.
3. Generate 4 slots from club `startTime`.
4. Save session:
   - `action: "select_checkin_slot"`
   - club info
   - player info
   - generated slots
5. Ask the user to reply with `1` to `4`.
6. On the next text message, create a check-in document with:
   - `name`
   - `playerId`
   - `clubId`
   - `checkInTime`
   - `createAt`
   - `source: "LINE"`
   - `lineUserId`
   - `lineDisplayName`
7. Clear the session.

### 3. Payment Slip Flow

Commands:

- `slip`
- `สลิป`

Flow:

1. Resolve the linked player from `lineUserId`.
2. Save session:
   - `action: "waiting_for_slip"`
   - `clubId`
   - player info
3. Ask the user to send an image.
4. When the next image arrives:
   - verify session action
   - enforce daily limit of 3 uploads
   - download the binary image from LINE using message ID
   - upload the image to Appwrite Storage
   - create a money slip document in Appwrite
5. Clear the session after successful upload.

## Session Model

The backend currently uses in-memory sessions only.

Current session actions:

- `select_checkin_slot`
- `waiting_for_slip`

Implications:

- sessions are lost on server restart
- sessions are not shared across multiple backend instances
- this is acceptable for lightweight chat flows, but not for horizontally scaled production without shared state

## Data Dependencies

Persistent data is stored in Appwrite.

### Players collection

Used fields:

- `name`
- `lineUserId`
- `lineDisplayName`

### Clubs collection

Used fields:

- `clubName` or `name`
- `startTime`

### Check-in collection

Created fields:

- `name`
- `playerId`
- `clubId`
- `checkInTime`
- `createAt`
- `source`
- `lineUserId`
- `lineDisplayName`

### Money slip collection

Created fields:

- `user`
- `club`
- `fileId`
- `timestamp`
- `playerId`
- `lineUserId`

### Slip storage bucket

Stores uploaded LINE image files for slips.

## Environment Contract

The backend depends on these environment variables:

- `PORT`
- `FRONTEND_URL`
- `DEFAULT_CLUB_ID`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID`
- `APPWRITE_PLAYERS_COLLECTION_ID`
- `APPWRITE_CLUBS_COLLECTION_ID`
- `APPWRITE_CHECKIN_COLLECTION_ID`
- `APPWRITE_MONEYSLIP_COLLECTION_ID`
- `APPWRITE_SLIP_STORAGE_ID`

## Command Surface

Implemented text commands in `textMessageHandler.js`:

- `hello`
- `สวัสดี`
- `help`
- `menu`
- `เมนู`
- `link <player name>`
- `dashboard`
- `slip`
- `สลิป`
- `checkin`
- `เช็คอิน`

## Error Handling

Current behavior:

- webhook-level failure returns HTTP 500
- handler-level failure replies with a generic error message
- payment flow has a specific reply for daily slip limit violations

There is minimal structured validation and minimal recovery for partial failures.

## Known Quirks And Technical Debt

- `src/state/userSessions.js` adds `updatedAt`, but that timestamp is not currently used for expiry or cleanup.
- `src/services/lineUsers.js` appears unused and overlaps conceptually with `src/state/userSessions.js`.
- `src/services/checkins.js` imports `getPlayerByLineUserId` but does not use it.
- `src/handlers/textMessageHandler.js` has a `text === "link"` branch that looks incomplete because it does not assign to `reply`.
- `dashboard` currently returns only `FRONTEND_URL` and does not append club-specific routing.
- there is no persistent session store, retry workflow, or idempotency protection
- there are no automated tests in the backend currently

## Suggested Mental Model For Future Work

If editing this backend later, treat it as 4 layers:

1. transport layer
   - Express + LINE webhook plumbing
2. conversation layer
   - message handlers + session transitions
3. domain service layer
   - Appwrite reads/writes and external API fetches
4. infrastructure layer
   - Appwrite client config and environment wiring

Most feature work will touch:

- handler logic for commands and replies
- service logic for Appwrite persistence
- session logic if the feature spans multiple messages
