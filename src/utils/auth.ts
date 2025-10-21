/**
 * Shared authentication utilities for Dashboard and Test pages
 * Uses sessionStorage for session-based authentication
 */

const AUTH_KEY = 'aquarium-auth-session';
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'admin';

export interface AuthCredentials {
  username: string;
  password: string;
}

/**
 * Validate credentials
 */
export function validateCredentials(username: string, password: string): boolean {
  return username === VALID_USERNAME && password === VALID_PASSWORD;
}

/**
 * Login - sets session storage
 */
export function login(username: string, password: string): boolean {
  if (validateCredentials(username, password)) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(AUTH_KEY, 'true');
      sessionStorage.setItem('aquarium-auth-user', username);
    }
    return true;
  }
  return false;
}

/**
 * Logout - clears session storage
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem('aquarium-auth-user');
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('aquarium-auth-user');
}
