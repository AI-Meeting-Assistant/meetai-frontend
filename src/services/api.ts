import type { ApiEnvelope } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
}

function forceLogout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth:logout'));
  window.location.assign('/login');
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const token = options.token ?? localStorage.getItem('token');
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    forceLogout();
    throw new Error('Unauthorized');
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;
  if (!envelope.success) {
    const message = envelope.error?.message ?? 'Unexpected API error';
    window.dispatchEvent(new CustomEvent('api:error', { detail: message }));
    throw new Error(message);
  }

  return envelope.data;
}
