let lastCapturedConversation = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CONVERSATION_CAPTURED') {
        chrome.storage.session.set({ 
            lastCapturedConversation: message.payload 
        });
        console.log('Lore: conversation captured');
    }

    if (message.type === 'GET_LAST_CONVERSATION') {
        chrome.storage.session.get(['lastCapturedConversation'], (result) => {
            sendResponse({ 
                conversation: result.lastCapturedConversation || null 
            });
        });
        return true; // keep channel open for async response
    }

    return true;
});
