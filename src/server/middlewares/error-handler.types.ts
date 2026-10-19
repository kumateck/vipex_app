import type { ErrorDetails } from '../utils/http-error';

export type ErrorBody = {
  error: {
    code: string;
    message: string;
    status: number;
    requestId: string;
    path: string;
    method: string;
    timestamp: string;
    details?: ErrorDetails;
  };
};
