async function handleTextMessage(event, client) {
    const text = event.message.text.toLowerCase();

    let reply = "Unknown command";

    if (text === "hello") {
        reply = 'Hello 👋';
    }

    if (text === "help") {
        reply = `
            Commands:
            - hello
            - help
            - clubs
        `
    }

    await replyMessage({
        replyToken: event.replyToken,
        messages: [
            {
                type: 'text',
                text: reply
            }
        ]
    })
}

export default {
  handleTextMessage,
};