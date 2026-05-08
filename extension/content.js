console.log('Lore content script loaded');
(function() {
    const originalFetch = window.fetch.bind(window);

    const descriptor = {
        value: async function(...args) {
            const [url, options] = args;
            const urlString = typeof url === 'string' ? url : (url?.url || '');

            // Filter out noise from logs (telemetry, stats, heartbeats, etc.)
            const isTelemetry = urlString.includes('datadoghq.com') || 
                               urlString.includes('ces/') || 
                               urlString.includes('sentinel/') ||
                               urlString.includes('list_accessible') ||
                               urlString.includes('celsius/') ||
                               urlString.includes('/lat/r');
            
            if (!isTelemetry) {
                console.log('Lore: fetch intercepted:', urlString);
            }


            // Handle ChatGPT specially: Intercept its own GET request for conversation history
            if (urlString.includes('/backend-api/conversation/') && 
                !urlString.includes('/stream_status') && 
                !urlString.includes('/textdocs') &&
                !urlString.includes('/init') &&
                !urlString.includes('/f/conversation')) {
                
                const result = originalFetch.apply(this, args);
                
                result.then(async (response) => {
                    const method = options?.method || (typeof url === 'object' ? url.method : 'GET');
                    if (response.ok && method === 'GET') {
                        try {
                            const clonedResponse = response.clone();
                            const data = await clonedResponse.json();
                            
                            if (data && data.mapping && data.current_node) {
                                console.log('Lore: ChatGPT conversation history intercepted via GET');
                                
                                // Tree-walking logic to find visible path
                                const mapping = data.mapping;
                                let currentNodeId = data.current_node;
                                const path = [];

                                while (currentNodeId && mapping[currentNodeId]) {
                                    const node = mapping[currentNodeId];
                                    if (node.message) {
                                        path.push(node.message);
                                    }
                                    currentNodeId = node.parent;
                                }

                                // Reverse to get chronological order and filter out system messages
                                const messages = path.reverse()
                                    .filter(msg => msg.author && msg.author.role !== "system")
                                    .map((msg, index) => {
                                        let content = "";
                                        if (msg.content && Array.isArray(msg.content.parts)) {
                                            content = msg.content.parts.join("\n");
                                        } else if (typeof msg.content === 'string') {
                                            content = msg.content;
                                        }

                                        return {
                                            role: msg.author.role.toUpperCase(),
                                            content: content,
                                            orderIndex: index
                                        };
                                    });

                                const convoId = urlString.split('/').pop().split('?')[0];

                                try {
                                    if (typeof chrome !== 'undefined' && chrome.runtime) {
                                        chrome.runtime.sendMessage({
                                            type: 'CONVERSATION_CAPTURED',
                                            payload: {
                                                url: urlString,
                                                body: {
                                                    title: data.title,
                                                    messages: messages,
                                                    conversationId: convoId
                                                },
                                                timestamp: new Date().toISOString(),
                                                pageUrl: window.location.href
                                            }
                                        });
                                    }
                                } catch (e) {
                                    console.log('Lore: sendMessage failed', e);
                                }
                                console.log('Lore: ChatGPT conversation processed and sent');
                            }
                        } catch (err) {
                            console.error('Lore: Error processing ChatGPT GET response', err);
                        }
                    }
                }).catch(() => {});

                return result;
            }

            // Standard logic for Claude/Gemini/Other (Outgoing POST requests)
            try {
                const method = options?.method || (typeof url === 'object' ? url.method : 'GET');
                const body = options?.body || (typeof url === 'object' ? url.body : null);

                if (
                    (urlString.includes('api.anthropic.com') ||
                     urlString.includes('api.openai.com') ||
                     urlString.includes('generativelanguage.googleapis.com')) &&
                    method === 'POST' &&
                    body
                ) {

                    // Note: If body is a ReadableStream (ChatGPT), this will fail, which is fine 
                    // since we handle ChatGPT above. Claude usually sends a string.
                    const bodyText = typeof body === 'string' ? body : null;
                    if (bodyText) {
                        const parsedBody = JSON.parse(bodyText);
                        if (parsedBody.messages && parsedBody.messages.length > 0) {
                            console.log('Lore: conversation found (standard format)');
                        try {
                            if (typeof chrome !== 'undefined' && chrome.runtime) {
                                chrome.runtime.sendMessage({
                                    type: 'CONVERSATION_CAPTURED',
                                    payload: {
                                        url: urlString,
                                        body: parsedBody,
                                        timestamp: new Date().toISOString(),
                                        pageUrl: window.location.href
                                    }
                                });
                            }
                        } catch (e) {
                            console.log('Lore: sendMessage failed', e);
                        }
                        }
                    }
                }
            } catch (e) {
                // Fail silently
            }


            return originalFetch.apply(this, args);
        },
        writable: true,
        configurable: true
    };

    Object.defineProperty(window, 'fetch', descriptor);
})();