const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '';
const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '');

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export const SESSION_EXPIRED_EVENT = 'vekan:session-expired';

export async function apiFetch(path, options = {}) {
  const { sessionAware = true, ...fetchOptions } = options;
  const response = await fetch(apiUrl(path), {
    ...fetchOptions,
    credentials: 'include',
  });

  if (response.status === 401 && sessionAware) {
    const body = await response.clone().json().catch(() => ({}));
    if (body.code === 'SESSION_EXPIRED') {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
  }

  return response;
}
