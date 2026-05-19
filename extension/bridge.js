// Copyright (c) 2026 mxrtins04
// https://github.com/mxrtins04
window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    if (event.data?.source !== 'LORE_EXTENSION') return;
    if (event.data?.type !== 'CONVERSATION_CAPTURED') return;

    try {
        const payload = event.data.payload;
        const messages = payload.body?.messages || [];
        const CHUNK_SIZE = 100;
        const totalChunks = Math.max(1, Math.ceil(messages.length / CHUNK_SIZE));
        const sessionId = Date.now().toString();

        for (let i = 0; i < totalChunks; i++) {
            const chunk = messages.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            await chrome.runtime.sendMessage({
                type: 'CONVERSATION_CHUNK',
                sessionId,
                chunkIndex: i,
                totalChunks,
                chunk,
                meta: i === 0 ? {
                    url: payload.url,
                    timestamp: payload.timestamp,
                    pageUrl: payload.pageUrl,
                    title: payload.body?.title,
                    conversationId: payload.body?.conversationId
                } : null
            });
        }

        console.log(`Lore bridge: sent ${totalChunks} chunks for ${messages.length} messages`);
    } catch(e) {
        console.log('Lore bridge: chunked send failed', e);
    }
});
