export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const badRequest = (message = 'Bad request', code = 'BAD_REQUEST') =>
  new AppError(400, code, message);

export const unauthorized = (message = 'Unauthorized', code = 'UNAUTHORIZED') =>
  new AppError(401, code, message);

export const forbidden = (message = 'Forbidden', code = 'FORBIDDEN') =>
  new AppError(403, code, message);

export const notFound = (message = 'Not found', code = 'NOT_FOUND') =>
  new AppError(404, code, message);

export const conflict = (message = 'Conflict', code = 'CONFLICT') =>
  new AppError(409, code, message);

export const limitReached = (message = 'Limit reached', code = 'LIMIT_REACHED') =>
  new AppError(429, code, message);

export const internalError = (message = 'Internal server error', code = 'INTERNAL_ERROR') =>
  new AppError(500, code, message);

export function handleApiError(error: any): Response {
  if (error?.digest?.startsWith('NEXT_') || error?.digest === 'DYNAMIC_SERVER_USAGE') {
    throw error;
  }
  if (error instanceof AppError) {
    const errPayload: Record<string, any> = { code: error.code, message: error.message };
    if ('retryAfterSeconds' in error && (error as any).retryAfterSeconds !== undefined) {
      errPayload.retryAfterSeconds = (error as any).retryAfterSeconds;
    }
    return Response.json(
      { ok: false, error: errPayload },
      { status: error.statusCode }
    );
  }
  if (error && error.name === 'ZodError') {
    const message = error.issues
      ? error.issues.map((i: any) => i.message).join('; ')
      : error.message;
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message } },
      { status: 400 }
    );
  }
  console.error('Unhandled API Error:', error);
  return Response.json(
    {
      ok: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'An unexpected error occurred',
      },
    },
    { status: 500 }
  );
}
