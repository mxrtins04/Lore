// Copyright (c) 2026 mxrtins04
// https://github.com/mxrtins04
window.addEventListener('LORE_CONVERSATION_CAPTURED', (event) => {
    try {
        chrome.runtime.sendMessage(event.detail);
    } catch(e) {
        console.log('Lore bridge: sendMessage failed', e);
    }
});
