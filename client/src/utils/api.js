const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export async function apiRequest(endpoint, options = {}) {
  try {
    const savedUser = localStorage.getItem('keuangan_user');
    const user = savedUser ? JSON.parse(savedUser) : null;

    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': user?.id || 'default-user-id',
      ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.message || `HTTP Error ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    // Kembalikan null saat server offline agar aplikasi tetap berjalan lancar dengan localStorage
    return { success: false, offline: true, error: err.message };
  }
}

