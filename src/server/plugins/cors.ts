import cors from '@elysiajs/cors';

// Enable CORS for dev or if your docs are served from a different origin.
// If docs are same-origin at /docs, this is harmless but not strictly required.
export const corsPlugin = cors({
  origin: () => true, // reflect origin (or set to specific origins)
  credentials: true,
  // Allow the headers Swagger UI uses
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  maxAge: 600,
});
