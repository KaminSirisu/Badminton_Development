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