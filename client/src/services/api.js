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
