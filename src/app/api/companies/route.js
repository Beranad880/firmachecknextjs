import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function DELETE() {
  try {
    await turso.execute({ sql: 'DELETE FROM companies', args: [] });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Clear history error:', error);
    return NextResponse.json({ error: 'Nepodařilo se vymazat historii.' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    try {
      const rateLimit = await checkRateLimit(getClientIp(request), { limit: 60, windowMs: 60_000 });
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Příliš mnoho požadavků. Zkuste to prosím za chvíli.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
            },
          }
        );
      }
    } catch (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError);
    }

    const { searchParams } = new URL(request.url);
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 50;

    const pageParam = searchParams.get('page');

    if (pageParam) {
      const page = Number.parseInt(pageParam, 10);
      if (!Number.isNaN(page) && page > 0) {
        const offset = (page - 1) * limit;

        const [rowsResult, countResult] = await Promise.all([
          turso.execute({
            sql: 'SELECT ico, name, address, created_at FROM companies ORDER BY created_at DESC LIMIT ? OFFSET ?',
            args: [limit, offset],
          }),
          turso.execute({
            sql: 'SELECT COUNT(*) as total FROM companies',
            args: [],
          }),
        ]);

        const companies = rowsResult.rows.map(row => ({
          ico: row.ico,
          name: row.name,
          address: row.address,
          created_at: row.created_at,
        }));

        const total = Number(countResult.rows[0]?.total ?? 0);

        return NextResponse.json(
          {
            companies,
            total,
          },
          {
            status: 200,
            headers: {
              'Cache-Control': 'no-store, max-age=0',
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    const result = await turso.execute({
      sql: 'SELECT ico, name, address, created_at FROM companies ORDER BY created_at DESC LIMIT ?',
      args: [limit],
    });

    const companies = result.rows.map(row => ({
      ico: row.ico,
      name: row.name,
      address: row.address,
      created_at: row.created_at,
    }));

    return NextResponse.json(companies, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('List API error:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se načíst historii vyhledaných firem.' },
      { status: 500 }
    );
  }
}
