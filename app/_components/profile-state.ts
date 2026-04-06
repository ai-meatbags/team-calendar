export function shouldRedirectProfile(params: { hasUser: boolean; isLoading: boolean }) {
  return !params.isLoading && !params.hasUser;
}
