const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

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
    const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${cleanEndpoint}`;

    const res = await fetch(url, {
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
