const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

async function getLineProfile(lineUserId) {
    if(!LINE_CHANNEL_ACCESS_TOKEN) throw new Error('Missing LINE_CHANNEL_ACCESS_TOKEN');
    
    const res = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to get LINE profile: ${res.status} ${text}`);
    }

    const profile = await res.json();

    return {
        userId: profile.userId,
        displayName: profile.displayName || 'LINE User',
        pictureUrl: profile.pictureUrl || null,
    };
}

export {
    getLineProfile,
}