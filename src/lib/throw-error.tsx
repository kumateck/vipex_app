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

import { TheAduseiErrorResponse } from './TheAduseiErrorResponse';

const ThrowErrorMessage = (error: unknown) => TheAduseiErrorResponse(error);

export default ThrowErrorMessage;
