async function handleImageMessage(event, client) {
    await client.replyMessage({
        replyToken: event.replyToken,
        messages: [
            {
                type: 'text',
                text: 'Payment slip image received \nNext step: upload to Appwrite storage.',
            },
        ],
    });
}
export {
    handleImageMessage,
}
