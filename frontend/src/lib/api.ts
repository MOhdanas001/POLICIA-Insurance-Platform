export const API_BASE = '/api/v1';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; code?: string }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const demoRole = typeof window !== 'undefined' ? localStorage.getItem('demoRole') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (demoRole) {
    headers['X-Demo-Role'] = demoRole;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('API Request failed:', endpoint, err);
    return {
      success: false,
      message: err.message || 'Network request failed',
      code: 'NETWORK_ERROR',
    };
  }
}
