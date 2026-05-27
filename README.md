# FirmaCheck

Webová aplikace pro okamžité ověřování českých ekonomických subjektů podle IČO. Data jsou načítána z oficiálního státního registru ARES a inteligentně cachována v Turso edge databázi — opakované dotazy jsou vráceny okamžitě bez zbytečného volání externího API.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Turso](https://img.shields.io/badge/Turso-libSQL-4FF8D2?style=flat-square)

---

## Funkce

- **Vyhledávání podle IČO** — zadejte 8místné IČO a získejte název firmy, adresu sídla a polohu na mapě
- **Cache vrstva** — první dotaz načte data z ARES API a uloží je do Turso DB; každý další dotaz na stejné IČO je obsloužen lokálně (výrazně rychlejší odezva)
- **Vizuální indikátor zdroje** — výsledek jasně ukazuje, zda pochází z cache nebo přímo z ARES
- **Historie vyhledávání** — posledních 50 vyhledaných subjektů zobrazeno v pravém panelu; kliknutím znovu zobrazíte detail
- **CSV export** — celá historie jedním kliknutím exportovatelná do souboru (UTF-8 BOM pro správné zobrazení českých znaků v MS Excel)
- **Rate limiting** — ochrana API endpointů; stav uložen v Turso DB, funguje i v serverless prostředí
- **Rychlé tipy** — předvolené zkratky pro rychlé otestování (Alza.cz, Seznam.cz, Škoda Auto)

---

## Technologie

| Vrstva | Technologie |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) — App Router, Server Components, Route Handlers |
| UI | [React 19](https://react.dev/) — `'use client'` komponenty, hooks |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) — utility-first, vlastní `@theme` konfigurace |
| Databáze | [Turso](https://turso.tech/) — edge SQLite (libSQL), `@libsql/client` |
| Zdroj dat | [ARES API](https://ares.gov.cz/) — veřejné REST API Ministerstva financí ČR |
| Fonty | [Geist](https://vercel.com/font) — Geist Sans + Geist Mono (next/font/google) |

---

## Architektura

```
src/
├── app/
│   ├── _components/
│   │   ├── SearchForm.js      # Formulář, validace, rychlé tipy, chybová hláška
│   │   ├── CompanyResult.js   # Detail firmy + Google Maps embed
│   │   └── HistoryList.js     # Seznam cached firem, skeleton loader, CSV export
│   ├── api/
│   │   ├── company/[ico]/
│   │   │   └── route.js       # Hlavní endpoint: cache check → ARES fetch → uložení
│   │   ├── companies/
│   │   │   └── route.js       # GET /api/companies — seznam posledních vyhledání
│   │   └── dbcheck/
│   │       └── route.js       # Health check endpoint (vyžaduje admin token)
│   ├── layout.js
│   ├── page.js                # Orchestrátor stavu, hlavní stránka
│   └── globals.css
├── lib/
│   ├── turso.js               # Turso klient (singleton)
│   └── rate-limit.js          # Rate limiting přes Turso DB
db/
└── schema.sql                 # Definice tabulek companies + rate_limits
scripts/
└── init-db.js                 # Inicializační skript pro vytvoření DB tabulek
```

### Logika cache

```
GET /api/company/:ico
  ↓
Rate limit check (Turso DB)
  ↓
SELECT FROM companies WHERE ico = ? AND created_at > NOW() - 30 dní
  ├─ HIT  → vrátí data okamžitě (source: "cache")
  └─ MISS → fetch z ARES API
               ↓
             UPSERT INTO companies
               ↓
             vrátí čerstvá data (source: "ares")
```

---

## Spuštění lokálně

### 1. Požadavky

- Node.js 20+
- Účet na [turso.tech](https://turso.tech) (nebo lokální SQLite soubor)

### 2. Instalace závislostí

```bash
npm install
```

### 3. Konfigurace prostředí

Zkopírujte `.env.example` do `.env.local` a vyplňte hodnoty:

```bash
cp .env.example .env.local
```

```env
# Vzdálená Turso databáze:
TURSO_CONNECTION_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Nebo lokální SQLite soubor (pro vývoj bez Turso účtu):
TURSO_CONNECTION_URL=file:./local.db
TURSO_AUTH_TOKEN=
```

### 4. Inicializace databáze

```bash
npm run db:init
```

Skript vytvoří tabulky `companies` a `rate_limits` podle `db/schema.sql`.

### 5. Spuštění vývojového serveru

```bash
npm run dev
```

Aplikace bude dostupná na [http://localhost:3000](http://localhost:3000).

---

## Produkční build

```bash
npm run build
npm run start
```

---

## API endpointy

### `GET /api/company/:ico`

Vyhledá firmu podle IČO. Nejprve zkontroluje cache, při MISS zavolá ARES API.

**Parametry:** `ico` — 8místné IČO v URL cestě

**Odpověď (200):**
```json
{
  "ico": "27082440",
  "name": "ALZA.CZ a.s.",
  "address": "Jankovcova 1522/53, Holešovice, 170 00 Praha 7",
  "created_at": "2025-05-27T10:00:00.000Z",
  "source": "cache"
}
```

**Hlavičky:** `X-Cache: HIT | MISS`

**Rate limit:** 30 požadavků / 60 sekund (per IP)

---

### `GET /api/companies?limit=50`

Vrátí seznam posledně vyhledaných firem seřazených od nejnovějšího.

**Rate limit:** 60 požadavků / 60 sekund (per IP)

---

### `GET /api/dbcheck`

Health check endpoint pro monitoring. Vrátí stav připojení k DB a počet cachovaných subjektů.

**Vyžaduje header:** `x-admin-token: <ADMIN_API_TOKEN>`

Endpoint je skryt (vrátí 404), pokud `ADMIN_API_TOKEN` není nastaven.

---

## Proměnné prostředí

| Proměnná | Povinná | Popis |
|---|---|---|
| `TURSO_CONNECTION_URL` | Ano | URL Turso databáze (`libsql://...` nebo `file:./local.db`) |
| `TURSO_AUTH_TOKEN` | Pro vzdálenou DB | Autentizační token Turso |
| `ADMIN_API_TOKEN` | Ne | Token pro `/api/dbcheck` health endpoint |
| `CACHE_TTL_MS` | Ne | TTL cache v milisekundách (výchozí: 2 592 000 000 = 30 dní) |

---

## Zdroj dat

Aplikace využívá veřejné [REST API ARES](https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/) (Administrativní registr ekonomických subjektů) provozované Ministerstvem financí České republiky. Data jsou veřejně přístupná bez nutnosti registrace nebo API klíče.

---

## Nástroje použité při vývoji

Projekt byl vytvořen s pomocí AI nástrojů:

- [Claude Code](https://claude.ai/code) — Anthropic CLI pro AI-asistované programování přímo v terminálu
- [OpenAI Codex](https://openai.com/codex) — AI model pro generování a doplňování kódu
- [Antigravity](https://antigravity.dev) — AI vývojový asistent
