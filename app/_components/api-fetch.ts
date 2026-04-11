'use client';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (
      response.status === 401 &&
      data &&
      typeof data === 'object' &&
      'code' in data &&
      String((data as { code?: unknown }).code) === 'reauth_required'
    ) {
      window.location.assign('/?auth=google-calendar-recovery');
    }
    const message =
      data && typeof data === 'object' && 'error' in data ? String((data as { error?: unknown }).error || 'Request failed') : 'Request failed';
    throw new Error(message);
  }

  return data;
}
