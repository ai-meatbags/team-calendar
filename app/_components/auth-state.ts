export const AUTH_SUCCESS_REDIRECT_PATH = '/teams';

export function buildAuthPopupUrl(pathname: string, search: string) {
  void pathname;
  void search;
  return `/auth/google?popup=1&next=${encodeURIComponent(AUTH_SUCCESS_REDIRECT_PATH)}`;
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
