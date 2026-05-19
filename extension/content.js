// Copyright (c) 2026 mxrtins04
// https://github.com/mxrtins04
console.log('Lore content script loaded');
(function() {
    const originalFetch = window.fetch.bind(window);

    let lastClaudeOrgId = null;
    let lastClaudeConversationId = null;
    let claudeNavCaptureTimer = null;

    const recentDispatches = new Set();

    const notebookLMHistory = new Map(); // notebookId -> messages[]

    const extractNotebookLMAssistantText = (inner) => {
        try {
            // Shape: [[[["<id>", <ts>, 2, null, [["<assistantText>", ...]] ]]]]
            if (Array.isArray(inner) && Array.isArray(inner[0]) && Array.isArray(inner[0][0])) {
                const payload = inner[0][0];

                if (payload && typeof payload[0] === 'string' && payload[0] === 'NoteGen') {
                    return '';
                }

                if (
                    Array.isArray(payload[4]) &&
                    Array.isArray(payload[4][0]) &&
                    typeof payload[4][0][0] === 'string'
                ) {
                    return payload[4][0][0];
                }

                // Shape: [[["<assistantText>", ...]]]
                if (typeof payload[0] === 'string') {
                    return payload[0];
                }

                // Shape: [[[ ["<assistantText>", ...] ]]]
                if (Array.isArray(payload[0]) && typeof payload[0][0] === 'string') {
                    return payload[0][0];
                }
            }

            // Shape: [[["<assistantText>", ...]]]
            if (Array.isArray(inner) && Array.isArray(inner[0]) && Array.isArray(inner[0][0]) && typeof inner[0][0][0] === 'string') {
                if (inner[0][0][0] === 'NoteGen') return '';
                return inner[0][0][0];
            }
        } catch (_) {
            // Fail silently
        }

        return '';
    };

    const extractNotebookLMUserText = (capturedRequestBody) => {
        try {
            if (!capturedRequestBody || typeof capturedRequestBody !== 'string') return '';

            const matches = [...capturedRequestBody.matchAll(/\"([^\"]{5,2000})\"/g)]
                .map(m => (m && m[1] ? m[1] : ''))
                .map(s => s.trim())
                .filter(Boolean)
                .filter(s => s.length >= 5)
                .filter(s => s.length <= 2000)
                .filter(s => !s.includes('rpcids='))
                .filter(s => !s.includes('source-path='))
                .filter(s => !s.startsWith('http'))
                .filter(s => s.split(' ').length >= 2);

            if (!matches.length) return '';

            // Prefer the longest human-looking string.
            matches.sort((a, b) => b.length - a.length);
            return matches[0];
        } catch (_) {
            return '';
        }
    };


    const dispatchCapturedConversation = (payload) => {
        // postMessage crosses MAIN → ISOLATED boundary
        window.postMessage({
            source: 'LORE_EXTENSION',
            type: 'CONVERSATION_CAPTURED',
            payload
        }, '*');
    };


    const processClaudeConversationData = (data, urlString) => {
        if (!data || !Array.isArray(data.chat_messages)) return false;

        const convoId = data.uuid;
        if (convoId) {
            if (recentDispatches.has(convoId)) return false;
            recentDispatches.add(convoId);
            setTimeout(() => recentDispatches.delete(convoId), 2000);
        }

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

        if (!history.pushState.__loreClaudePatched) {
            const originalPushState = history.pushState;
            history.pushState = function(...args) {
                const ret = originalPushState.apply(this, args);
                notify();
                return ret;
            };
            history.pushState.__loreClaudePatched = true;
        }

        if (!history.replaceState.__loreClaudePatched) {
            const originalReplaceState = history.replaceState;
            history.replaceState = function(...args) {
                const ret = originalReplaceState.apply(this, args);
                notify();
                return ret;
            };
            history.replaceState.__loreClaudePatched = true;
        }

        notify();
    };

    if (window.location.origin === 'https://claude.ai') { patchHistoryForClaudeNav(); }

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
                               urlString.includes('analytics.google.com') ||
                               urlString.includes('play.google.com') ||
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

                                if (convoId) {
                                    if (recentDispatches.has(convoId)) return;
                                    recentDispatches.add(convoId);
                                    setTimeout(() => recentDispatches.delete(convoId), 2000);
                                }

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

    const OriginalXHR = window.XMLHttpRequest;
    function PatchedXHR() {
        const xhr = new OriginalXHR();
        let capturedUrl = '';
        let capturedRequestBody = '';

        const originalOpen = xhr.open.bind(xhr);
        xhr.open = function(method, url, ...rest) {
            capturedUrl = typeof url === 'string' ? url : '';
            console.log('Lore: NLM XHR open called:', capturedUrl);
            return originalOpen(method, url, ...rest);
        };

        const originalSend = xhr.send.bind(xhr);
        xhr.send = function(body) {
            try {
                if (capturedUrl.includes('batchexecute')) {
                    capturedRequestBody = typeof body === 'string' ? body : '';
                }
            } catch (_) {
                // Fail silently
            }
            return originalSend(body);
        };

        xhr.addEventListener('readystatechange', function() {
            // Step 1: exit if not complete
            if (xhr.readyState !== 4) return;

            // Step 2: exit if not a batchexecute call
            if (!capturedUrl.includes('batchexecute')) return;

            const rpcid = capturedUrl.split('rpcids=')[1]?.split('&')[0];

            // Handle history rpcid (ub2Bae) - full conversation backfill
            if (rpcid === 'ub2Bae') {
                try {
                    const rawText = xhr.responseText;
                    const chunks = rawText.split('\n').filter(line => line.includes('wrb.fr'));
                    if (!chunks.length) return;

                    const lastChunk = chunks[chunks.length - 1].trim();
                    const jsonStart = lastChunk.indexOf('[');
                    if (jsonStart === -1) return;

                    const outer = JSON.parse(lastChunk.slice(jsonStart));
                    const innerStr = outer[0][2];
                    if (!innerStr) return;

                    const inner = JSON.parse(innerStr);

                    // DEBUG: log full structure to find current notebook messages
                    console.log('Lore: ub2Bae inner structure:', JSON.stringify(inner).slice(0, 2000));

                    const notebookIdMatch = window.location.pathname.match(/\/notebook\/([^/?]+)/);
                    const notebookId = notebookIdMatch ? notebookIdMatch[1] : 'unknown';
                    console.log('Lore: current notebookId:', notebookId);

                    return;
                } catch (err) {
                    console.error('Lore: Error processing NotebookLM history', err);
                }
                return;
            }

            // Step 3: exit if not the AI response rpcid
            if (rpcid !== 'khqZz') return;

            // Step 4: parse and dispatch streaming response
            try {
                const rawText = xhr.responseText;
                const chunks = rawText.split('\n').filter(line => line.includes('wrb.fr'));
                if (!chunks.length) return;

                const lastChunk = chunks[chunks.length - 1].trim();
                const jsonStart = lastChunk.indexOf('[');
                if (jsonStart === -1) return;

                const outer = JSON.parse(lastChunk.slice(jsonStart));
                const innerStr = outer[0][2];
                if (!innerStr) return;

                const inner = JSON.parse(innerStr);
                const assistantText = inner?.[0]?.[0]?.[4]?.[0]?.[0];
                if (!assistantText || typeof assistantText !== 'string') return;

                let userText = '';
                try {
                    const match = capturedRequestBody.match(/"([^"]{10,500})"/);
                    if (match) userText = match[1];
                } catch (_) {}

                const notebookIdMatch = window.location.pathname.match(/\/notebook\/([^/?]+)/);
                const notebookId = notebookIdMatch ? notebookIdMatch[1] : 'unknown';

                const rawTitle = document.title || 'NotebookLM Conversation';
                const title = rawTitle.replace(/\s*[-|]\s*NotebookLM\s*$/i, '').trim() || 'NotebookLM Conversation';

                const existingMessages = notebookLMHistory.get(notebookId) || [];

                const lastMsg = existingMessages[existingMessages.length - 1];
                if (lastMsg && lastMsg.role === 'ASSISTANT' && lastMsg.content === assistantText) return;

                const newMessages = [];
                if (userText) {
                    newMessages.push({ role: 'USER', content: userText, orderIndex: existingMessages.length });
                }
                newMessages.push({ role: 'ASSISTANT', content: assistantText, orderIndex: existingMessages.length + (userText ? 1 : 0) });

                const fullHistory = [...existingMessages, ...newMessages];
                notebookLMHistory.set(notebookId, fullHistory);

                dispatchCapturedConversation({
                    url: capturedUrl,
                    body: { title, messages: fullHistory, conversationId: notebookId },
                    timestamp: new Date().toISOString(),
                    pageUrl: window.location.href
                });

                console.log(`Lore: NotebookLM conversation captured (${fullHistory.length} messages)`);
            } catch (err) {
                console.error('Lore: Error processing NotebookLM response', err);
            }
        });

        return xhr;
    }
    PatchedXHR.prototype = OriginalXHR.prototype;
    window.XMLHttpRequest = PatchedXHR;

    Object.defineProperty(window, 'fetch', descriptor);
})();