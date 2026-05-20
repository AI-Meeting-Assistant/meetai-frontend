import { apiRequest } from './api';
import type { UserRole } from '../types';

export interface OrganizationUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export async function listUsers(): Promise<OrganizationUser[]> {
  return apiRequest<OrganizationUser[]>('/users');
}

export async function createUser(payload: CreateUserPayload): Promise<OrganizationUser> {
  return apiRequest<OrganizationUser>('/users', {
    method: 'POST',
    body: payload,
  });
}

export async function setUserActive(userId: string, isActive: boolean): Promise<OrganizationUser> {
  return apiRequest<OrganizationUser>(`/users/${userId}`, {
    method: 'PATCH',
    body: { isActive },
  });
}
