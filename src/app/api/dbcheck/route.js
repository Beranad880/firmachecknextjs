import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';

export async function GET(request) {
  const startTime = Date.now();
  const expectedToken = process.env.ADMIN_API_TOKEN;

  if (!expectedToken) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const providedToken = request.headers.get('x-admin-token');
    if (providedToken !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Run a test query to verify connection and count the number of cached companies
    const result = await turso.execute({
      sql: 'SELECT COUNT(*) as total_companies FROM companies',
      args: [],
    });

    const latency = Date.now() - startTime;
    const count = result.rows[0]?.total_companies ?? 0;

    return NextResponse.json(
      {
        status: 'healthy',
        database: 'Turso DB',
        connection: 'successful',
        latency_ms: latency,
        data: {
          cached_companies_count: Number(count),
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('Database check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'Turso DB',
        connection: 'failed',
        latency_ms: latency,
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
