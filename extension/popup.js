// Copyright (c) 2026 mxrtins04
// https://github.com/mxrtins04
const BACKEND_URL = "http://localhost:8080";
let capturedConversation = null;

document.addEventListener("DOMContentLoaded", () => {
  loadBuckets();
  loadCapturedConversation();

  document.getElementById("save-btn").addEventListener("click", saveConversation);
});

async function loadBuckets() {
  const statusEl = document.getElementById("status");
  const selectEl = document.getElementById("bucket-select");

  try {
    const response = await fetch(`${BACKEND_URL}/api/buckets/standard`);
    if (!response.ok) throw new Error("Failed to fetch buckets");
    
    const buckets = await response.json();
    buckets.forEach(bucket => {
      const option = document.createElement("option");
      option.value = bucket.id;
      option.textContent = bucket.name;
      selectEl.appendChild(option);
    });
  } catch (err) {
    statusEl.textContent = "Could not load buckets";
    statusEl.style.color = "#ef4444";
    console.error(err);
  }
}

function loadCapturedConversation() {
  chrome.runtime.sendMessage({ type: "GET_LAST_CONVERSATION" }, (response) => {
    if (response && response.conversation) {
      capturedConversation = response.conversation;
      const titleEl = document.getElementById("convo-title");
      
      let title = "Untitled Conversation";
      const body = capturedConversation.body;

      if (body.title) {
        title = body.title;
      } else if (body.metadata && body.metadata.title) {
        title = body.metadata.title;
      } else if (detectPlatform(capturedConversation.url, capturedConversation.pageUrl) === "CLAUDE") {
        title = "Claude Conversation";
      } else if (detectPlatform(capturedConversation.url, capturedConversation.pageUrl) === "NOTEBOOKLM") {
        title = "NotebookLM Conversation";
      }

      titleEl.textContent = title;
      titleEl.style.color = "#f0f0f0";
    }
  });
}

function detectPlatform(url, pageUrl) {
  if (url.includes('anthropic.com') || 
      (pageUrl && pageUrl.includes('claude.ai'))) return 'CLAUDE';
  if (url.includes('openai.com') || 
      url.includes('chatgpt.com') || 
      (pageUrl && pageUrl.includes('chatgpt.com'))) return 'CHATGPT';
  if (url.includes('googleapis.com') || 
      (pageUrl && pageUrl.includes('gemini.google.com'))) return 'GEMINI';
  if ((pageUrl && pageUrl.includes('notebooklm.google.com'))) return 'NOTEBOOKLM';
  return 'CLAUDE';
}

function detectPlatformConvoId(pageUrl) {
  try {
    const url = new URL(pageUrl);
    if (url.hostname.includes("claude.ai")) {
      const parts = url.pathname.split("/");
      // Pattern: /chat/{convoId}
      if (parts[1] === "chat") return parts[2];
    }
    if (url.hostname.includes("chatgpt.com")) {
      const parts = url.pathname.split("/");
      // Pattern: /c/{convoId}
      if (parts[1] === "c") return parts[2];
    }
  } catch (e) {}
  return null;
}

function detectProjectId(pageUrl) {
  try {
    const url = new URL(pageUrl);
    if (url.hostname.includes("claude.ai")) {
      const parts = url.pathname.split("/");
      // Pattern: /project/{projectId}/...
      if (parts[1] === "project") return parts[2];
    }
  } catch (e) {}
  return null;
}

async function saveConversation() {
  const bucketId = document.getElementById("bucket-select").value;
  const statusEl = document.getElementById("status");
  const saveBtn = document.getElementById("save-btn");

  if (!bucketId) {
    statusEl.textContent = "Please select a bucket";
    statusEl.style.color = "#f59e0b";
    return;
  }

  if (!capturedConversation) {
    statusEl.textContent = "No conversation to save";
    statusEl.style.color = "#ef4444";
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";
  statusEl.textContent = "";

  try {
    const platform = detectPlatform(capturedConversation.url, capturedConversation.pageUrl);
    const messages = capturedConversation.body.messages.map((msg, index) => {
      let content = "";
      if (typeof msg.content === "string") {
        content = msg.content;
      } else if (Array.isArray(msg.content)) {
        content = msg.content
          .filter(part => part.type === "text")
          .map(part => part.text)
          .join("\n");
      }

      return {
        role: msg.role.toUpperCase(),
        content: content,
        timestamp: null,
        orderIndex: msg.orderIndex !== undefined ? msg.orderIndex : index
      };
    });

    const requestBody = {
      platform: platform,
      platformConvoId: capturedConversation.body.conversationId || detectPlatformConvoId(capturedConversation.pageUrl),
      projectId: detectProjectId(capturedConversation.pageUrl),
      projectName: null,
      title: document.getElementById("convo-title").textContent,
      messages: messages,
      inputTokens: 0,
      outputTokens: 0
    };

    const response = await fetch(`${BACKEND_URL}/api/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        if (response.status === 400) {
            const errBody = await response.json();
            if (errBody.error && errBody.error.includes("already exists")) {
                // Conversation exists — fetch it by platformConvoId to get its ID
                const searchResponse = await fetch(
                    `${BACKEND_URL}/api/conversations/by-platform-id?platformConvoId=${encodeURIComponent(requestBody.platformConvoId)}` 
                );
                if (!searchResponse.ok) throw new Error("Failed to fetch existing conversation");
                const existingConvo = await searchResponse.json();
                
                // Skip creation, go straight to bucket assignment using existing ID
                const patchResponse = await fetch(
                    `${BACKEND_URL}/api/conversations/${existingConvo.id}/bucket`,
                    {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ bucketId: bucketId })
                    }
                );
                if (!patchResponse.ok) {
                    const errBody = await patchResponse.text();
                    throw new Error(`Failed to assign bucket: ${patchResponse.status} - ${errBody}`);
                }
                statusEl.textContent = "Saved to Lore!";
                statusEl.style.color = "#22c55e";
                return;
            }
        }
        const errBody = await response.text();
        throw new Error(`Failed to save conversation: ${response.status} - ${errBody}`);
    }

    const newConvo = await response.json();

    // Patch to assign bucket
    const patchResponse = await fetch(`${BACKEND_URL}/api/conversations/${newConvo.id}/bucket`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucketId: bucketId })
    });

    if (!patchResponse.ok) {
        const errBody = await patchResponse.text();
        throw new Error(`Failed to assign bucket: ${patchResponse.status} - ${errBody}`);
    }

    statusEl.textContent = "Saved to Lore!";
    statusEl.style.color = "#22c55e";
  } catch (err) {
    statusEl.textContent = "Failed to save. Try again.";
    statusEl.style.color = "#ef4444";
    console.error(err);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save to Lore";
  }
}
