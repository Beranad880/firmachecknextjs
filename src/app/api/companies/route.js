import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 50;

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

    // Disable caching on client-side fetch to ensure history is always fresh
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
