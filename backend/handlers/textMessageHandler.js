async function handleTextMessage(event, client) {
    const text = event.message.text.trim().toLowerCase();

    let reply = 'Unknown command. Type "help" to see commands.';

    if (text === "hello") {
        reply = 'Hello 👋';
    }

    if (text === "help") {
        reply = 
        `
        Commands:
            - hello
            - help
            - dashboard
            - clubs
        `
    }

    if (text === 'dashboard') {
        const frontendUrl = process.env.FRONTEND_URL
        const clubId = process.env.DEFAULT_CLUB_ID;

        reply = `Live Dashboard: ${frontendUrl}`;
    }

    await client.replyMessage({
        replyToken: event.replyToken,
        messages: [
            {
                type: 'text',
                text: reply
            }
        ]
    })
}

export {
  handleTextMessage,
};