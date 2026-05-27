import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const ARES_TIMEOUT_MS = 8_000;

export async function GET(request, { params }) {
  try {
    const rateLimit = checkRateLimit(getClientIp(request), { limit: 30, windowMs: 60_000 });
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

    // In Next.js 15/16, params is a Promise that needs to be awaited
    const { ico } = await params;

    // 1. Validation: IČO must be exactly 8 digits
    if (!ico || !/^\d{8}$/.test(ico)) {
      return NextResponse.json(
        { error: 'Neplatný formát IČO. IČO musí obsahovat přesně 8 číslic.' },
        { status: 400 }
      );
    }

    // 2. Query Turso DB (Cache Check)
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
            headers: {
              'X-Cache': 'HIT',
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // 3. Fetch from ARES API if not in DB Cache
    const aresUrl = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`;
    
    let response;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ARES_TIMEOUT_MS);

    try {
      response = await fetch(aresUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 FirmaCheck/1.0',
        },
        cache: 'no-store', // Disable Next.js implicit fetch caching
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

    // Check if the response content type is JSON
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response from ARES:', text.substring(0, 500));
      return NextResponse.json(
        { error: 'Registr ARES vrátil neplatnou odpověď (HTML místo JSON). Služba může být dočasně nedostupná nebo blokuje požadavky.' },
        { status: 502 }
      );
    }

    // ARES returns 404 when subject does not exist
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

    // Secondary check of body for error or non-existence indicators
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

    // Extract relevant data
    const name = aresData.obchodniJmeno.trim();
    const address = aresData.sidlo?.textovaAdresa?.trim() || 'Adresa neuvedena';

    // 4. Save to Turso DB Cache
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

    // 5. Return fresh data
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
        headers: {
          'X-Cache': 'MISS',
          'Content-Type': 'application/json',
        },
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
