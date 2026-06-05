import { google } from "googleapis";

const PLAYER_LEDGER_TAB = 'Player_Ledger';
const SESSION_EXPENSES_TAB = 'Session_Expenses';

function normalizePrivateKey(value) {
    if (!value) return '';

    const trimmed = value.trim();
    const unquoted = (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    )
        ? trimmed.slice(1, -1)
        : trimmed;

    return unquoted
        .replace(/\\\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .trim();
}

function getSheetsClient() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!email) throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL is missing');
    if (!privateKey) throw new Error('GOOGLE_PRIVATE_KEY is missing');
    if (!spreadsheetId) throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is missing');
    if (
        !privateKey.includes('-----BEGIN PRIVATE KEY-----') ||
        !privateKey.includes('-----END PRIVATE KEY-----')
    ) {
        throw new Error('GOOGLE_PRIVATE_KEY must be the service account private_key value, including BEGIN/END PRIVATE KEY lines');
    }

    const auth = new google.auth.JWT({
        email,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return {
        spreadsheetId,
        sheets: google.sheets({ version: "v4", auth }),
    };
}

async function getRowsForDate({ sheets, spreadsheetId, tabName, targetDate }) {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${tabName}!A:A`,
    })

    const values = response.data.values || [];

    return values
        .map((row, index) => ({
            rowNumber: index + 1,
            date: row[0],
        }))
        .filter((row) => row.rowNumber !== 1 && row.date === targetDate);
}

async function getSheetIdByTitle({ sheets, spreadsheetId, tabName }) {
    const response = await sheets.spreadsheets.get({ spreadsheetId });

    const sheet = response.data.sheets.find(
        (item) => item.properties.title === tabName
    );

    if (!sheet) throw new Error(`Sheet tab not found: ${tabName}`);

    return sheet.properties.sheetId;
}

async function deleteRows({ sheets, spreadsheetId, sheetId, rowNumbers }) {
    if (rowNumbers.length === 0) return;

    const requests = [...rowNumbers]
        .sort((a, b) => b - a)
        .map((rowNumber) => ({
            deleteDimension: {
                range: {
                    sheetId,
                    dimension: 'ROWS',
                    startIndex: rowNumber - 1,
                    endIndex: rowNumber,
                },
            },
        }));

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests,
        },
    });
}

async function appendRows({ sheets, spreadsheetId, tabName, rows }) {
    if (rows.length === 0) return;

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${tabName}!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
            values: rows,
        },
    });
}

export async function exportSessionToGoogleSheets({
    targetDate,
    playerRows,
    expenseRow,
    overwrite = false,
}) {
    const { sheets, spreadsheetId } = getSheetsClient();

    const playerMatches = await getRowsForDate({
        sheets,
        spreadsheetId,
        tabName: PLAYER_LEDGER_TAB,
        targetDate,
    });

    const expenseMatches = await getRowsForDate({
        sheets,
        spreadsheetId,
        tabName: SESSION_EXPENSES_TAB,
        targetDate,
    });

    const alreadyExported = playerMatches.length > 0 || expenseMatches.length > 0;

    if (alreadyExported && !overwrite) {
        return {
        ok: false,
        alreadyExported: true,
        message: 'Data for this date has already been exported.',
        };
    }

    if (alreadyExported && overwrite) {
        const playerSheetId = await getSheetIdByTitle({
            sheets,
            spreadsheetId,
            tabName: PLAYER_LEDGER_TAB,
        });

        const expenseSheetId = await getSheetIdByTitle({
            sheets,
            spreadsheetId,
            tabName: SESSION_EXPENSES_TAB,
        });

        await deleteRows({
            sheets,
            spreadsheetId,
            sheetId: playerSheetId,
            rowNumbers: playerMatches.map((row) => row.rowNumber),
        });

        await deleteRows({
            sheets,
            spreadsheetId,
            sheetId: expenseSheetId,
            rowNumbers: expenseMatches.map((row) => row.rowNumber),
        });
    }

    await appendRows({
        sheets,
        spreadsheetId,
        tabName: PLAYER_LEDGER_TAB,
        rows: playerRows,
    });

    if (expenseRow) {
        await appendRows({
            sheets,
            spreadsheetId,
            tabName: SESSION_EXPENSES_TAB,
            rows: [expenseRow],
        })
    }

    return {
        ok: true,
        alreadyExported: false,
        exportedPlayerRows: playerRows.length,
        exportedExpenseRows: expenseRow ? 1 : 0,
    };
}
