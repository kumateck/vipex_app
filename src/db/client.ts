// Backward-compatible re-export to keep legacy imports working
// while ensuring the app uses a single shared SQL client.
export { db, sql, enablePgcrypto, closeSql } from './config';
