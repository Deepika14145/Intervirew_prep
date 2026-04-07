const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const fetchProfile = async () => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${BACKEND}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
};

export const updateProfile = async (updates) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${BACKEND}/api/auth/me`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to save profile');
  return res.json();
};
