import { isSdk5AuthenticationError } from './sdk5ErrorInfo';

let redirectScheduled = false;

export function isImAuthFailedReason(reason) {
  return isSdk5AuthenticationError(reason);
}

export function redirectToLoginClearImSession() {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname || '';
  try {
    window.localStorage.removeItem('EASEIM_loginUser');
  } catch {
    /* ignore */
  }
  if (path === '/login' || path === '/') {
    return;
  }
  if (redirectScheduled) return;
  redirectScheduled = true;
  window.location.assign('/login');
}
