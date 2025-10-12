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

export const BadRequest = (message = 'Bad Request', details?: unknown) =>
  new HttpError(400, message, details);

export const Unauthorized = (message = 'Unauthorized') => new HttpError(401, message);
export const Forbidden = (message = 'Forbidden') => new HttpError(403, message);
export const NotFound = (message = 'Not Found') => new HttpError(404, message);
export const Conflict = (message = 'Conflict', details?: unknown) =>
  new HttpError(409, message, details);
export const Unprocessable = (message = 'Unprocessable Entity', details?: unknown) =>
  new HttpError(422, message, details);
export const Internal = (message = 'Internal Server Error', details?: unknown) =>
  new HttpError(500, message, details);
