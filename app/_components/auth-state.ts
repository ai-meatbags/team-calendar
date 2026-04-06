export function buildAuthPopupUrl(pathname: string, search: string) {
  const next = `${pathname}${search}`;
  return `/auth/google?popup=1&next=${encodeURIComponent(next)}`;
}

export function buildLogoutUrl(pathname: string, search: string) {
  const next = `${pathname}${search}`;
  return `/auth/logout?next=${encodeURIComponent(next)}`;
}

export function shouldAcceptAuthMessage(params: {
  eventOrigin: string;
  windowOrigin: string;
  windowHostname: string;
}) {
  if (params.eventOrigin === params.windowOrigin) {
    return true;
  }

  try {
    return new URL(params.eventOrigin).hostname === params.windowHostname;
  } catch {
    return false;
  }
}
