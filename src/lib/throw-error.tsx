// import { toast } from 'sonner';

// interface ErrorDetail {
//   code: string;
//   description: string;
//   type: number;
//   message?: string;
// }
// export interface ErrorResponse {
//   type: string;
//   title: string;
//   status: number;
//   data?: {
//     errors: ErrorDetail[];
//   };
//   errors: ErrorDetail[];
// }
// export const isErrorResponse = (error: ErrorResponse) => {
//   const err = error.errors ?? error?.data?.errors;
//   const errorResponse = err[0];
//   return errorResponse;
// };

// const ThrowErrorMessage = (error: unknown) =>
//   toast.error(isErrorResponse(error as ErrorResponse)?.description);

// export default ThrowErrorMessage;

import { toast } from 'sonner';

/* =======================
   Error Shapes
======================= */

interface ErrorDetail {
  code?: string;
  description?: string;
  type?: number;
  message?: string;
}

export interface ErrorResponse {
  type?: string;
  title?: string;
  status?: number;
  errors?: ErrorDetail[];
  data?: {
    errors?: ErrorDetail[];
    error?: {
      message?: string;
      status?: number;
    };
  };
}

/* =======================
   Normalizer
======================= */

const extractErrorMessage = (error: unknown): string => {
  if (!error) return 'Something went wrong';

  const err = error as ErrorResponse;

  // 1️⃣ Your structured API errors
  const structured = err.errors?.[0] ?? err.data?.errors?.[0];

  if (structured) {
    return structured.description || structured.message || 'An unexpected error occurred';
  }

  // 2️⃣ Generic `{ data: { error: { message }}}`
  if (err.data?.error?.message) {
    return err.data.error.message;
  }

  // 3️⃣ Native JS Error
  if (error instanceof Error) {
    return error.message;
  }

  // 4️⃣ Fallback
  return 'Internal server error';
};

/* =======================
   Toast Wrapper
======================= */

const ThrowErrorMessage = (error: unknown) => {
  const message = extractErrorMessage(error);
  toast.error(message);
};

export default ThrowErrorMessage;
