export class AppError extends Error {
  status: number;
  code: string;

  constructor(params: { message: string; status: number; code: string }) {
    super(params.message);
    this.name = 'AppError';
    this.status = params.status;
    this.code = params.code;
  }
}

export function isAppError(error: unknown): error is AppError {
  if (error instanceof AppError) {
    return true;
  }

  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { status?: unknown; message?: unknown; code?: unknown; name?: unknown };
  return (
    typeof candidate.status === 'number' &&
    typeof candidate.message === 'string' &&
    (typeof candidate.code === 'string' || candidate.name === 'AppError')
  );
}

export function createAppError(status: number, message: string, code: string) {
  return new AppError({ status, message, code });
}

export function badRequestError(message: string, code = 'bad_request') {
  return createAppError(400, message, code);
}

export function unauthorizedError(message = 'Not authenticated', code = 'unauthorized') {
  return createAppError(401, message, code);
}

export function forbiddenError(message: string, code = 'forbidden') {
  return createAppError(403, message, code);
}

export function notFoundError(message: string, code = 'not_found') {
  return createAppError(404, message, code);
}

export function internalError(message: string, code = 'internal_error') {
  return createAppError(500, message, code);
}
