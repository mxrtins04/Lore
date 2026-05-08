window.addEventListener('LORE_CONVERSATION_CAPTURED', (event) => {
    try {
        chrome.runtime.sendMessage(event.detail);
    } catch(e) {
        console.log('Lore bridge: sendMessage failed', e);
    }
});
