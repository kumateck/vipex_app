export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export function BadRequest(message = 'Bad Request', details?: unknown) {
  return new HttpError(400, message, details);
}

export function Unauthorized(message = 'Unauthorized', details?: unknown) {
  return new HttpError(401, message, details);
}

export function Forbidden(message = 'Forbidden', details?: unknown) {
  return new HttpError(403, message, details);
}

export function NotFound(message = 'Not Found', details?: unknown) {
  return new HttpError(404, message, details);
}

export function Conflict(message = 'Conflict', details?: unknown) {
  return new HttpError(409, message, details);
}

export function UnprocessableEntity(message = 'Unprocessable Entity', details?: unknown) {
  return new HttpError(422, message, details);
}

export function TooManyRequests(message = 'Too Many Requests', details?: unknown) {
  return new HttpError(429, message, details);
}

export function ServiceUnavailable(message = 'Service Unavailable', details?: unknown) {
  return new HttpError(503, message, details);
}

// Type guard
export function isHttpError(err: unknown): err is HttpError {
  return !!err && typeof err === 'object' && 'status' in err && typeof err.status === 'number';
}
