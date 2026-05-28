const sessions = new Map();

function setSession(lineUserId, sessionData) {
    sessions.set(lineUserId, sessionData);
}

function getSession(lineUserId) {
    return sessions.get(lineUserId);
}

function clearSession(lineUserId) {
    sessions.delete(lineUserId);
}

export {
    setSession,
    getSession,
    clearSession,
};
