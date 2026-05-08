(function() {
  const originalFetch = window.fetch;

  window.fetch = async function(...args) {
    const [url, options] = args;

    try {
      if (options && options.method === "POST" && options.body) {
        const urlStr = typeof url === "string" ? url : url.toString();
        
        const isClaude = urlStr.includes("api.anthropic.com");
        const isChatGPT = urlStr.includes("api.openai.com");
        const isGemini = urlStr.includes("generativelanguage.googleapis.com");

        if (isClaude || isChatGPT || isGemini) {
          let body;
          try {
            body = JSON.parse(options.body);
          } catch (e) {
            // Not JSON or can't parse
          }

          if (body && body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
            const payload = {
              url: urlStr,
              body: body,
              timestamp: new Date().toISOString(),
              pageUrl: window.location.href
            };

            chrome.runtime.sendMessage({
              type: "CONVERSATION_CAPTURED",
              payload: payload
            });
            console.log("Lore: conversation captured");
          }
        }
      }
    } catch (err) {
      // Fail silently
    }

    return originalFetch.apply(this, args);
  };
})();
