const configuredBaseUrl = import.meta.env?.VITE_API_BASE_URL?.trim() || '';
const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '');
const coldStartRetryMs = Number(import.meta.env?.VITE_COLD_START_RETRY_MS) || 1500;
const COLD_START_STATUSES = new Set([502, 503, 504]);
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export const SESSION_EXPIRED_EVENT = 'vekan:session-expired';

export function shouldRetryColdStart(method, status) {
  return IDEMPOTENT_METHODS.has(method.toUpperCase()) && COLD_START_STATUSES.has(status);
}

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function apiFetch(path, options = {}) {
  const { sessionAware = true, coldStartRetry = true, ...fetchOptions } = options;
  const method = (fetchOptions.method || 'GET').toUpperCase();
  const request = () => fetch(apiUrl(path), {
    ...fetchOptions,
    credentials: 'include',
  });
  let response = await request();

  if (coldStartRetry && shouldRetryColdStart(method, response.status)) {
    await wait(coldStartRetryMs);
    response = await request();
  }

  if (response.status === 401 && sessionAware) {
    const body = await response.clone().json().catch(() => ({}));
    if (body.code === 'SESSION_EXPIRED') {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
  }

  return response;
}
