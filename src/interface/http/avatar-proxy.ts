const GOOGLE_AVATAR_HOST_SUFFIXES = ['googleusercontent.com', 'gstatic.com'];

function parseAbsoluteUrl(rawValue: string) {
  try {
    const url = new URL(rawValue);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export function isProxyableAvatarUrl(rawValue: string | null | undefined) {
  const normalized = String(rawValue || '').trim();
  if (!normalized) {
    return false;
  }

  const url = parseAbsoluteUrl(normalized);
  if (!url) {
    return false;
  }

  return GOOGLE_AVATAR_HOST_SUFFIXES.some(
    (suffix) => url.hostname === suffix || url.hostname.endsWith(`.${suffix}`)
  );
}

export function toAvatarProxyUrl(rawValue: string | null | undefined) {
  const normalized = String(rawValue || '').trim();
  if (!isProxyableAvatarUrl(normalized)) {
    return normalized || null;
  }

  return `/api/avatar?src=${encodeURIComponent(normalized)}`;
}

export function resolveAvatarProxySource(rawValue: string | null | undefined) {
  const normalized = String(rawValue || '').trim();
  if (!isProxyableAvatarUrl(normalized)) {
    return null;
  }
  return normalized;
}
