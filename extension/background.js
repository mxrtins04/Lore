// Copyright (c) 2026 mxrtins04
// https://github.com/mxrtins04
chrome.runtime.onInstalled.addListener(() => {});
chrome.runtime.onStartup.addListener(() => {});
let lastCapturedConversation = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CONVERSATION_CHUNK') {
        const { sessionId, chunkIndex, totalChunks, chunk, meta } = message;

        chrome.storage.session.get(['pendingChunks'], (data) => {
            const pending = data.pendingChunks || {};

            if (!pending[sessionId]) {
                pending[sessionId] = { 
                    meta: null, 
                    chunks: {}, 
                    received: 0, 
                    total: totalChunks 
                };
            }

            pending[sessionId].chunks[chunkIndex] = chunk;
            pending[sessionId].received++;
            if (meta) pending[sessionId].meta = meta;

            const session = pending[sessionId];

            if (session.received === session.total) {
                // All chunks received — assemble full conversation
                const allMessages = Object.keys(session.chunks)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .flatMap(k => session.chunks[k]);

                const fullPayload = {
                    url: session.meta.url,
                    timestamp: session.meta.timestamp,
                    pageUrl: session.meta.pageUrl,
                    body: {
                        title: session.meta.title,
                        conversationId: session.meta.conversationId,
                        messages: allMessages
                    }
                };

                delete pending[sessionId];

                chrome.storage.session.set({ 
                    pendingChunks: pending,
                    lastCapturedConversation: fullPayload
                }, () => {
                    console.log('Lore: assembled and stored', allMessages.length, 'messages');
                });
            } else {
                chrome.storage.session.set({ pendingChunks: pending });
            }
        });

        return false;
    }

    if (message.type === 'CONVERSATION_STORED') {
        return false;
    }

    if (message.type === 'GET_LAST_CONVERSATION') {
        chrome.storage.session.get(['lastCapturedConversation'], (result) => {
            sendResponse({ 
                conversation: result.lastCapturedConversation || null 
            });
        });
        return true; // keep channel open for async response
    }

    return false;
});
