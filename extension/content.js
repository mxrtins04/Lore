console.log('Lore content script loaded');
(function() {
    const originalFetch = window.fetch.bind(window);

    let lastClaudeOrgId = null;
    let lastClaudeConversationId = null;
    let claudeNavCaptureTimer = null;

    const dispatchCapturedConversation = (payload) => {
        window.dispatchEvent(new CustomEvent('LORE_CONVERSATION_CAPTURED', {
            detail: {
                type: 'CONVERSATION_CAPTURED',
                payload
            }
        }));
    };

    const processClaudeConversationData = (data, urlString) => {
        if (!data || !Array.isArray(data.chat_messages)) return false;

        const messages = data.chat_messages
            .map((msg, index) => {
                const parts = Array.isArray(msg.content) ? msg.content : [];
                const textParts = parts
                    .filter((part) => part && part.type === 'text' && typeof part.text === 'string')
                    .map((part) => part.text);
                const content = textParts.join('\n').trim();

                const sender = typeof msg.sender === 'string' ? msg.sender : '';
                const role = sender === 'human'
                    ? 'USER'
                    : sender === 'assistant'
                        ? 'ASSISTANT'
                        : sender.toUpperCase() || 'UNKNOWN';

                return {
                    role,
                    content,
                    orderIndex: index
                };
            })
            .filter((msg) => msg.content);

        dispatchCapturedConversation({
            url: urlString,
            body: {
                title: data.name || 'Claude Conversation',
                messages,
                conversationId: data.uuid
            },
            timestamp: new Date().toISOString(),
            pageUrl: window.location.href
        });

        return true;
    };

    const getClaudeConversationIdFromLocation = () => {
        try {
            const u = new URL(window.location.href);
            const parts = u.pathname.split('/').filter(Boolean);
            const chatIndex = parts.indexOf('chat');
            if (chatIndex === -1) return null;
            return parts[chatIndex + 1] || null;
        } catch (_) {
            return null;
        }
    };

    const maybeCaptureClaudeConversationFromNav = () => {
        if (window.location.origin !== 'https://claude.ai') return;

        const convoId = getClaudeConversationIdFromLocation();
        if (!convoId) return;
        if (!lastClaudeOrgId) return;
        if (convoId === lastClaudeConversationId) return;

        lastClaudeConversationId = convoId;

        if (claudeNavCaptureTimer) {
            clearTimeout(claudeNavCaptureTimer);
        }

        claudeNavCaptureTimer = setTimeout(async () => {
            try {
                const apiUrl = `https://claude.ai/api/organizations/${lastClaudeOrgId}/chat_conversations/${convoId}?tree=True&rendering_mode=messages&render_all_tools=true&consistency=strong`;
                const res = await originalFetch(apiUrl, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!res.ok) return;
                const data = await res.json();
                const ok = processClaudeConversationData(data, apiUrl);
                if (ok) {
                    console.log('Lore: Claude conversation captured via navigation');
                }
            } catch (_) {
                // Fail silently
            }
        }, 350);
    };

    const patchHistoryForClaudeNav = () => {
        const notify = () => maybeCaptureClaudeConversationFromNav();

        window.addEventListener('popstate', notify);

        const originalPushState = history.pushState;
        history.pushState = function(...args) {
            const ret = originalPushState.apply(this, args);
            notify();
            return ret;
        };

        const originalReplaceState = history.replaceState;
        history.replaceState = function(...args) {
            const ret = originalReplaceState.apply(this, args);
            notify();
            return ret;
        };

        notify();
    };

    patchHistoryForClaudeNav();

    const descriptor = {
        value: async function(...args) {
            const [url, options] = args;
            const rawUrlString = typeof url === 'string' ? url : (url?.url || '');
            const normalizedUrl = (() => {
                try {
                    return new URL(rawUrlString, window.location.origin);
                } catch (_) {
                    return null;
                }
            })();
            const urlString = normalizedUrl ? normalizedUrl.href : rawUrlString;
            const urlPathname = normalizedUrl ? normalizedUrl.pathname : '';
            const urlOrigin = normalizedUrl ? normalizedUrl.origin : '';

            if (urlOrigin === 'https://claude.ai' && urlPathname.includes('/api/organizations/')) {
                const match = urlPathname.match(/\/api\/organizations\/([^/]+)/);
                if (match && match[1]) {
                    lastClaudeOrgId = match[1];
                }
            }

            // Filter out noise from logs (telemetry, stats, heartbeats, etc.)
            const isTelemetry = urlString.includes('datadoghq.com') || 
                               urlString.includes('ces/') || 
                               urlString.includes('sentinel/') ||
                               urlString.includes('list_accessible') ||
                               urlString.includes('celsius/') ||
                               urlString.includes('/lat/r') ||
                               urlString.includes('/i18n/') ||
                               urlString.includes('/edge-api/bootstrap/') ||
                               urlString.includes('/api/bootstrap/');
            
            if (!isTelemetry) {
                console.log('Lore: fetch intercepted:', urlString);
            }


            // Handle ChatGPT specially: Intercept its own GET request for conversation history
            if ((urlString.includes('/backend-api/conversation/') || urlPathname.includes('/backend-api/conversation/')) && 
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

                                window.dispatchEvent(new CustomEvent('LORE_CONVERSATION_CAPTURED', {
                                    detail: {
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
                                    }
                                }));
                                console.log('Lore: ChatGPT conversation processed and dispatched');
                            }
                        } catch (err) {
                            console.error('Lore: Error processing ChatGPT GET response', err);
                        }
                    }
                }).catch(() => {});

                return result;
            }

            // Handle Claude specially: Intercept its own GET request for conversation history
            if (
                urlOrigin === 'https://claude.ai' &&
                urlPathname.includes('/api/organizations/') &&
                urlPathname.includes('/chat_conversations/')
            ) {
                const result = originalFetch.apply(this, args);

                result.then(async (response) => {
                    const method = options?.method || (typeof url === 'object' ? url.method : 'GET');
                    if (response.ok && method === 'GET') {
                        try {
                            const clonedResponse = response.clone();
                            const data = await clonedResponse.json();

                            if (data && Array.isArray(data.chat_messages)) {
                                console.log('Lore: Claude conversation history intercepted via GET');

                                const ok = processClaudeConversationData(data, urlString);
                                if (ok) {
                                    console.log('Lore: Claude conversation processed and dispatched');
                                }
                            }
                        } catch (err) {
                            console.error('Lore: Error processing Claude GET response', err);
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
                        window.dispatchEvent(new CustomEvent('LORE_CONVERSATION_CAPTURED', {
                            detail: {
                                type: 'CONVERSATION_CAPTURED',
                                payload: {
                                    url: urlString,
                                    body: parsedBody,
                                    timestamp: new Date().toISOString(),
                                    pageUrl: window.location.href
                                }
                            }
                        }));
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