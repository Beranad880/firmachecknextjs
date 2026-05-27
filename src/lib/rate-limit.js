import { turso } from './turso';

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      key      TEXT    NOT NULL PRIMARY KEY,
      count    INTEGER NOT NULL DEFAULT 1,
      reset_at INTEGER NOT NULL
    )
  `);
  tableReady = true;
}

export async function checkRateLimit(key, { limit = 30, windowMs = 60_000 } = {}) {
  await ensureTable();

  const now = Date.now();
  const newResetAt = now + windowMs;

  if (Math.random() < 0.01) {
    turso.execute({ sql: 'DELETE FROM rate_limits WHERE reset_at < ?', args: [now] }).catch(() => {});
  }

  const result = await turso.execute({
    sql: `
      INSERT INTO rate_limits (key, count, reset_at)
      VALUES (?, 1, ?)
      ON CONFLICT(key) DO UPDATE SET
        count = CASE WHEN reset_at <= ? THEN 1 ELSE count + 1 END,
        reset_at = CASE WHEN reset_at <= ? THEN ? ELSE reset_at END
      RETURNING count, reset_at
    `,
    args: [key, newResetAt, now, now, newResetAt],
  });

  const count = Number(result.rows[0].count);
  const resetAt = Number(result.rows[0].reset_at);

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}

export function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}
