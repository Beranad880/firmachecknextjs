import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { isValidIco } from '@/lib/validation';

const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS) || 30 * 24 * 60 * 60 * 1000;
const ARES_TIMEOUT_MS = 8_000;

export async function GET(request, { params }) {
  try {
    try {
      const rateLimit = await checkRateLimit(getClientIp(request), { limit: 100, windowMs: 60_000 });
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

    const { ico } = await params;

    if (!isValidIco(ico)) {
      return NextResponse.json(
        { error: 'Neplatný formát IČO. IČO musí obsahovat přesně 8 číslic.' },
        { status: 400 }
      );
    }

    const dbResult = await turso.execute({
      sql: 'SELECT ico, name, address, created_at FROM companies WHERE ico = ?',
      args: [ico],
    });

    if (dbResult.rows && dbResult.rows.length > 0) {
      const company = dbResult.rows[0];
      const cachedAt = new Date(company.created_at).getTime();
      const cacheIsFresh = Number.isFinite(cachedAt) && Date.now() - cachedAt < CACHE_TTL_MS;

      if (cacheIsFresh) {
        return NextResponse.json(
          {
            ico: company.ico,
            name: company.name,
            address: company.address,
            created_at: company.created_at,
            source: 'cache',
          },
          {
            status: 200,
            headers: { 'X-Cache': 'HIT', 'Content-Type': 'application/json' },
          }
        );
      }
    }

    const aresUrl = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`;

    let response;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ARES_TIMEOUT_MS);

    try {
      response = await fetch(aresUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FirmaCheck/1.0 (Next.js; +https://github.com)',
        },
        cache: 'no-store',
        signal: controller.signal,
      });
    } catch (fetchErr) {
      console.error('Fetch ARES failed:', fetchErr);
      return NextResponse.json(
        {
          error: fetchErr.name === 'AbortError'
            ? 'Registr ARES neodpověděl včas. Zkuste to prosím později.'
            : 'Nepodařilo se navázat spojení s registrem ARES.',
        },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeout);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response from ARES:', text.substring(0, 500));
      return NextResponse.json(
        { error: 'Registr ARES vrátil neplatnou odpověď. Služba může být dočasně nedostupná.' },
        { status: 502 }
      );
    }

    if (response.status === 404) {
      return NextResponse.json(
        { error: `Firma s IČO ${ico} nebyla v registru ARES nalezena.` },
        { status: 404 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Chyba registru ARES (HTTP status ${response.status}).` },
        { status: response.status }
      );
    }

    let aresData;
    try {
      aresData = await response.json();
    } catch (parseError) {
      console.error('JSON parsing of ARES response failed:', parseError);
      return NextResponse.json(
        { error: 'Nepodařilo se zpracovat JSON data z registru ARES.' },
        { status: 502 }
      );
    }

    if (
      aresData.kod === 'NEEXISTUJE' ||
      aresData.kod === 'NEPLATNY' ||
      !aresData.ico ||
      !aresData.obchodniJmeno
    ) {
      return NextResponse.json(
        { error: `Firma s IČO ${ico} nebyla v registru ARES nalezena.` },
        { status: 404 }
      );
    }

    const name = aresData.obchodniJmeno.trim();
    const address = aresData.sidlo?.textovaAdresa?.trim() || 'Adresa neuvedena';

    await turso.execute({
      sql: `
        INSERT INTO companies (ico, name, address, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(ico) DO UPDATE SET
          name = excluded.name,
          address = excluded.address,
          created_at = CURRENT_TIMESTAMP
      `,
      args: [ico, name, address],
    });

    return NextResponse.json(
      {
        ico,
        name,
        address,
        created_at: new Date().toISOString(),
        source: 'ares',
      },
      {
        status: 200,
        headers: { 'X-Cache': 'MISS', 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Nastala neočekávaná chyba na serveru při zpracování požadavku.' },
      { status: 500 }
    );
  }
}
