let lastCapturedConversation = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CONVERSATION_CAPTURED") {
    lastCapturedConversation = message.payload;
    console.log("Lore: conversation captured");
  } else if (message.type === "GET_LAST_CONVERSATION") {
    sendResponse({ conversation: lastCapturedConversation });
  }
  return true; // Keep message channel open for async responses
});
