# FirmaCheck

Next.js aplikace pro ověření českých firem podle IČO přes registr ARES. Výsledky se ukládají do Turso databáze jako cache, aby se opakované dotazy nevolaly znovu na ARES.

## Požadavky

- Node.js kompatibilní s Next.js 16
- Turso/libSQL databáze
- npm

## Konfigurace

Vytvořte `.env` nebo nastavte proměnné v hostingu:

```bash
TURSO_CONNECTION_URL=libsql://...
TURSO_AUTH_TOKEN=...
ADMIN_API_TOKEN=nahodny-dlouhy-token
```

`ADMIN_API_TOKEN` je volitelný pro běh aplikace, ale bez něj endpoint `/api/dbcheck` vrací `404`.

## Inicializace databáze

```bash
npm install
npm run db:init
```

Schéma je v `db/schema.sql`.

## Lokální vývoj

```bash
npm run dev
```

Aplikace běží na `http://localhost:3000`.

## Kontrola kvality

```bash
npm run lint
npm run build
```

## API

- `GET /api/company/:ico` ověří IČO, použije cache a při miss/stale cache zavolá ARES.
- `GET /api/companies?limit=50` vrací poslední uložené firmy, limit je omezen na rozsah 1 až 100.
- `GET /api/dbcheck` je admin diagnostika. Vyžaduje hlavičku `x-admin-token` s hodnotou `ADMIN_API_TOKEN`.

## Poznámky k produkci

- Endpointy nejsou navázané na uživatelské účty, historie je globální cache.
- Rate limit je jednoduchý in-memory limit vhodný pro základní ochranu. Pro serverless/multi-instance produkci použijte sdílený limit přes Redis, Upstash nebo podobnou službu.
- Cache ARES odpovědí se obnovuje po 30 dnech.
