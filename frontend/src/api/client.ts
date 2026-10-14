/**
 * API client for TeamMatch.
 *
 * All functions send the Bearer token from sessionStorage.
 * On 401 responses a UnauthorizedError is thrown so screens can
 * clear the session and redirect to the login page.
 */

const BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// Token helpers ----------------------------------------------------------

export function getToken(): string | null {
  return sessionStorage.getItem('token');
}

export function setToken(token: string): void {
  sessionStorage.setItem('token', token);
}

export function clearToken(): void {
  sessionStorage.removeItem('token');
}

// Error types ------------------------------------------------------------

export class UnauthorizedError extends Error {
  constructor(message = 'Session expired. Please log in again.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// Internal fetch wrapper -------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    let message = 'Session expired. Please try again.';
    try {
      const errBody = await response.json();
      if (errBody.detail) message = errBody.detail;
    } catch { /* ignore */ }
    throw new UnauthorizedError(message);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errBody = await response.json();
      if (errBody.detail) message = errBody.detail;
    } catch { /* ignore parse failure */ }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

// Auth endpoints ---------------------------------------------------------

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: Record<string, unknown>;
}

export function signup(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: { email, password, first_name: '', last_name: '' },
  });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', { method: 'POST' });
}

// Data endpoints (camelCase keys match backend teammatch.py) -------------

export interface MeResponse {
  profile: {
    id: string;
    email: string;
    name: string;
    course: string;
    skills: string[];
    studyPreference: string;
    commitment: string;
    createdAt: string | null;
    updatedAt: string | null;
  } | null;
  availability: {
    userId: string;
    slots: Record<string, string[]>;
    meetingFrequency: string;
    updatedAt: string | null;
  } | null;
  latestAssignment: {
    id: number;
    userId: string;
    unitCode: string;
    projectName: string;
    groupSize: number;
    dueDate: string;
    requiredSkills: string[];
    meetingPreference: string;
    minimumCommitment: string;
    createdAt: string | null;
  } | null;
  groupMembers: {
    id: number;
    userId: string;
    assignmentId: number;
    memberId: string;
    memberName: string;
    createdAt: string | null;
  }[];
}

export function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/data/me');
}

export function updateProfile(data: {
  name: string;
  course: string;
  skills: string[];
  studyPreference: string;
  commitment: string;
}): Promise<Record<string, unknown>> {
  return apiFetch('/data/profile', { method: 'PUT', body: data });
}

export function updateAvailability(data: {
  slots: Record<string, string[]>;
  meetingFrequency: string;
}): Promise<Record<string, unknown>> {
  return apiFetch('/data/availability', { method: 'PUT', body: data });
}

export function createAssignment(data: {
  unitCode: string;
  projectName: string;
  groupSize: number;
  dueDate: string;
  requiredSkills: string[];
  meetingPreference: string;
  minimumCommitment: string;
}): Promise<{ id: number; [key: string]: unknown }> {
  return apiFetch('/data/assignments', { method: 'POST', body: data });
}

export function createGroupMembers(data: {
  assignmentId?: number;
  members: { memberId: string; memberName: string }[];
}): Promise<Record<string, unknown>> {
  return apiFetch('/data/group-members', { method: 'POST', body: data });
}