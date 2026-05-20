import { apiRequest } from './api';
import type { AuthUser, UserRole } from '../types';

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  organizationName: string;
}

export async function login(
  email: string,
  password: string,
  expectedRole: UserRole,
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password, expectedRole },
  });
}

export async function register(payload: RegisterPayload): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  });
}
