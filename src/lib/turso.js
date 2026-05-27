import { createClient } from '@libsql/client';

const connectionUrl = process.env.TURSO_CONNECTION_URL || process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const isLocalDatabase = connectionUrl?.startsWith('file:') || connectionUrl === ':memory:';

if (!connectionUrl) {
  throw new Error('Turso connection URL is missing. Set TURSO_CONNECTION_URL or TURSO_DATABASE_URL.');
}

if (!authToken && !isLocalDatabase) {
  throw new Error('TURSO_AUTH_TOKEN is missing for the configured remote Turso database.');
}

export const turso = createClient({
  url: connectionUrl,
  authToken,
});
