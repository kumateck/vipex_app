import { app } from './app';
import { env } from './utils/env';

// Optional standalone runner for API-only mode.
// This will NOT run when src/index.ts is your app entry.
// It only runs if you execute `bun src/server/index.ts` directly.
if (import.meta.main) {
  app.listen(env.PORT, ({ hostname, port }) => {
    console.log(`elysia listening on http://${hostname}:${port}`);
  });
}

export default app;
