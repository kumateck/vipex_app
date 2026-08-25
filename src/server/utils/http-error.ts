import { HttpStatus } from './http-status';
export type ErrorDetailsValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | boolean[]
  | Record<string, string | number | boolean | null>;

export type ErrorDetails = Record<string, ErrorDetailsValue | undefined>;

export class HttpError extends Error {
  status: number;
  details?: ErrorDetails;

  constructor(status: number, message: string, details?: ErrorDetails) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export function BadRequest(message = 'Bad Request', details?: ErrorDetails) {
  return new HttpError(HttpStatus.BAD_REQUEST, message, details);
}

export function Unauthorized(message = 'Unauthorized', details?: ErrorDetails) {
  return new HttpError(HttpStatus.UNAUTHORIZED, message, details);
}

export function Forbidden(message = 'Forbidden', details?: ErrorDetails) {
  return new HttpError(HttpStatus.FORBIDDEN, message, details);
}

export function NotFound(message = 'Not Found', details?: ErrorDetails) {
  return new HttpError(HttpStatus.NOT_FOUND, message, details);
}

export function Conflict(message = 'Conflict', details?: ErrorDetails) {
  return new HttpError(HttpStatus.CONFLICT, message, details);
}

export function Gone(message = 'Gone', details?: ErrorDetails) {
  return new HttpError(HttpStatus.GONE, message, details);
}

export function UnprocessableEntity(message = 'Unprocessable Entity', details?: ErrorDetails) {
  return new HttpError(HttpStatus.UNPROCESSABLE_ENTITY, message, details);
}

export function TooManyRequests(message = 'Too Many Requests', details?: ErrorDetails) {
  return new HttpError(HttpStatus.TOO_MANY_REQUESTS, message, details);
}

export function ServiceUnavailable(message = 'Service Unavailable', details?: ErrorDetails) {
  return new HttpError(HttpStatus.SERVICE_UNAVAILABLE, message, details);
}

// Type guard
export function isHttpError(err: object | null | undefined): err is HttpError {
  return !!err && typeof err === 'object' && 'status' in err && typeof err.status === 'number';
}
