import cors from '@elysiajs/cors';

// Enable CORS for dev or if your docs are served from a different origin.
// If docs are same-origin at /docs, this is harmless but not strictly required.
export const corsPlugin = cors({
  origin: () => true, // reflect origin (or set to specific origins)
  credentials: true,
  // Keep compatibility with the legacy public tracking client, which currently sends
  // Access-Control-Allow-Origin as a request header. New clients should not send response-only
  // CORS headers themselves.
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Access-Control-Allow-Origin',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  maxAge: 600,
});
