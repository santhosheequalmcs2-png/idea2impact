const BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://idea2impact-g8fe.onrender.com/api' : 'http://localhost:4000/api');

export function getAuthToken() {
  return localStorage.getItem('i2i_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('i2i_token', token);
  } else {
    localStorage.removeItem('i2i_token');
  }
}

export async function api(path, options = {}) {
  const token = getAuthToken();
  const headers = { ...(options.headers || {}) };

  // Set Authorization header if token exists
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  // If body is NOT FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = path.startsWith('http') ? path : `${BASE}${path}`;

  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Something went wrong');
  }
  return data;
}

// Upload image file (supports up to 5MB)
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const data = await api('/upload', {
    method: 'POST',
    body: formData
  });
  // If backend returns relative URL, prefix with server origin if needed
  const fileUrl = data.url;
  if (fileUrl && fileUrl.startsWith('/uploads')) {
    const serverOrigin = BASE.replace(/\/api\/?$/, '');
    return `${serverOrigin}${fileUrl}`;
  }
  return fileUrl;
}

// AI Studio chat helper
export const demoAI = async (prompt, context = '') => {
  try {
    return await api('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, context })
    });
  } catch (err) {
    return {
      mode: 'demo',
      reply: `DEMO AI · Here's a practical next step for "${prompt.slice(0, 120)}":\n\n1. Define your target user and problem statement.\n2. Sketch the simplest functional prototype.\n3. Validate with 5 potential users before scaling.\n\nNote: This is an illustrative demo response, not legal, patent, investment or verified market advice.`
    };
  }
};

/**
 * AI Sana Real-Time SSE Streaming Client
 */
export async function streamAiChat({
  prompt,
  context,
  innovationId,
  mode = 'deep',
  fastMode = false,
  apiKey,
  imageBase64,
  imageMimeType,
  history = [],
  onPhase,
  onChunk,
  onMeta,
  onError,
  onDone,
  signal
}) {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${BASE}/ai/chat`;

  const body = JSON.stringify({
    prompt,
    context,
    innovationId,
    mode,
    fastMode,
    apiKey,
    customApiKey: apiKey,
    imageBase64,
    imageMimeType,
    history,
    stream: true
  });

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body,
    signal,
    credentials: 'include'
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData.message || errData.error || `HTTP ${res.status}`;
    const err = new Error(message);
    err.code = errData.error || 'SERVER_ERROR';
    if (onError) onError(err);
    return;
  }

  if (!res.body) {
    if (onDone) onDone();
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data:')) {
        const jsonStr = trimmed.slice(5).trim();
        if (jsonStr) {
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'phase' && onPhase) onPhase(event);
            else if (event.type === 'chunk' && onChunk) onChunk(event.text);
            else if (event.type === 'meta' && onMeta) onMeta(event);
            else if (event.type === 'error' && onError) onError(new Error(event.message || event.error));
            else if (event.type === 'done' && onDone) onDone(event.meta);
          } catch {}
        }
      }
    }
  }

  if (buffer.trim().startsWith('data:')) {
    const jsonStr = buffer.trim().slice(5).trim();
    try {
      const event = JSON.parse(jsonStr);
      if (event.type === 'phase' && onPhase) onPhase(event);
      else if (event.type === 'chunk' && onChunk) onChunk(event.text);
      else if (event.type === 'meta' && onMeta) onMeta(event);
      else if (event.type === 'error' && onError) onError(new Error(event.message || event.error));
      else if (event.type === 'done' && onDone) onDone(event.meta);
    } catch {}
  }
}
