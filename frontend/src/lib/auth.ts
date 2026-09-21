import { apiRequest } from './api';

export interface UserSession {
  id: string;
  email: string;
  role: 'ADMIN' | 'AGENT' | 'CUSTOMER';
  firstName: string;
  lastName: string;
  agentId?: string;
  customerId?: string;
}

export const getStoredUser = (): UserSession | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('userSession');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredSession = (user: UserSession, accessToken: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userSession', JSON.stringify(user));
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('demoRole', user.role);
};

export const clearStoredSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('userSession');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('demoRole');
};

export const loginDemoAccount = async (role: 'ADMIN' | 'AGENT' | 'CUSTOMER') => {
  const res = await apiRequest<{ user: UserSession; accessToken: string }>('/auth/demo-login', {
    method: 'POST',
    body: JSON.stringify({ role }),
  });

  if (res.success && res.data) {
    setStoredSession(res.data.user, res.data.accessToken);
  }
  return res;
};
