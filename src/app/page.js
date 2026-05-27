'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [icoInput, setIcoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const searchRequestId = useRef(0);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch('/api/companies?limit=50');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load history on mount
  useEffect(() => {
    void Promise.resolve().then(fetchHistory);
  }, []);

  const handleSearch = async (e, customIco = null) => {
    if (e) e.preventDefault();
    
    const targetIco = customIco || icoInput.trim();
    
    // Client-side validation: must be exactly 8 digits
    if (!/^\d{8}$/.test(targetIco)) {
      setError('IČO musí mít přesně 8 číslic.');
      return;
    }

    setLoading(true);
    setError(null);
    setCompany(null);
    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;

    if (customIco) {
      setIcoInput(customIco);
    }

    try {
      const res = await fetch(`/api/company/${targetIco}`);
      const data = await res.json();

      if (requestId !== searchRequestId.current) {
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Něco se nepovedlo při vyhledávání subjekta.');
      } else {
        setCompany(data);
        // Refresh history
        await fetchHistory();
      }
    } catch (err) {
      if (requestId !== searchRequestId.current) {
        return;
      }

      setError('Chyba sítě. Zkontrolujte připojení k internetu.');
      console.error('Search request failed:', err);
    } finally {
      if (requestId === searchRequestId.current) {
        setLoading(false);
      }
    }
  };

  const exportToCsv = () => {
    if (history.length === 0) return;

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '';
      const escaped = String(str).replace(/"/g, '""');
      if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('\r') || escaped.includes('"')) {
        return `"${escaped}"`;
      }
      return escaped;
    };

    const headers = ['IČO', 'Název firmy', 'Adresa sídla', 'Datum ověření (UTC)'];
    const csvRows = [
      headers.map(escapeCsv).join(','),
      ...history.map(item => [
        item.ico,
        item.name,
        item.address,
        item.created_at
      ].map(escapeCsv).join(','))
    ];

    // UTF-8 BOM to ensure MS Excel parses Czech accents (ř, ž, š, č, á, é, etc.) correctly
    const csvContent = '\uFEFF' + csvRows.join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `firmacheck_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const popularSuggestions = [
    { name: 'Alza.cz', ico: '27082440' },
    { name: 'Seznam.cz', ico: '26168685' },
    { name: 'Škoda Auto', ico: '00177041' }
  ];

  return (
    <div className="bg-transparent text-zinc-100 min-h-screen relative overflow-hidden flex flex-col font-sans">

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 z-10 flex-grow flex flex-col">
        
        {/* Header */}
        <header className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/30">
                <svg className="w-5 h-5 text-zinc-950 font-bold" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                FirmaCheck
              </h1>
            </div>
            <p className="text-sm text-zinc-300 mt-2 max-w-2xl">
              Okamžité ověření českých firem přes státní registr ARES s chytrým mezipaměťovým úložištěm Turso DB.
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center justify-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono text-zinc-300 tracking-wider">ARES API CONNECTED</span>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form & Search Result */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Search Card */}
            <div className="glass-card p-6 sm:p-8 rounded-2xl transition-all duration-300 hover:border-zinc-500/70">
              <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                </svg>
                Vyhledat ekonomický subjekt
              </h2>
              
              <form onSubmit={(e) => handleSearch(e)} className="space-y-4">
                <div className="relative">
                  <label htmlFor="ico-search-input" className="sr-only">
                    IČO firmy
                  </label>
                  <input
                    id="ico-search-input"
                    type="text"
                    pattern="\d*"
                    maxLength={8}
                    minLength={8}
                    required
                    placeholder="Zadejte 8místné IČO..."
                    value={icoInput}
                    onChange={(e) => setIcoInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-4 pl-5 pr-32 text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all font-mono tracking-wider text-lg"
                    disabled={loading}
                  />
                  <div className="absolute right-2 top-2 bottom-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="h-full bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold px-6 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Ověřit</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Popular suggestions */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <span className="text-xs text-zinc-400">Rychlé tipy:</span>
                  {popularSuggestions.map((sug) => (
                    <button
                      key={sug.ico}
                      type="button"
                      onClick={(e) => handleSearch(e, sug.ico)}
                      disabled={loading}
                      className="text-xs bg-zinc-950 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900 px-3 py-1.5 rounded-md text-zinc-200 font-medium transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {sug.name} ({sug.ico})
                    </button>
                  ))}
                </div>
              </form>

              {/* Error messages */}
              {error && (
                <div className="mt-4 p-4 bg-red-950/50 border border-red-700/70 rounded-xl flex items-start gap-3 animate-fadeIn">
                  <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-red-200">Vyhledávání selhalo</h3>
                    <p className="text-xs text-red-400 mt-1 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Detail Results Card */}
            {company && (
              <div className="glass-card rounded-2xl overflow-hidden transition-all duration-500 glow-shadow-emerald border-emerald-500/30 animate-fadeIn">
                
                {/* Cache / Fresh Status Header Banner */}
                <div className={`px-6 py-2.5 flex items-center justify-between border-b ${
                  company.source === 'cache'
                    ? 'bg-emerald-950/20 border-emerald-500/10'
                    : 'bg-blue-950/20 border-blue-500/10'
                }`}>
                  <span className="text-xs text-slate-400 font-medium">Zdroj informací:</span>
                  {company.source === 'cache' ? (
                    <span className="text-xs bg-emerald-500/15 text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      Lokální cache (Turso DB)
                    </span>
                  ) : (
                    <span className="text-xs bg-blue-500/15 text-blue-300 font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                      Státní registr ARES (Fresh)
                    </span>
                  )}
                </div>

                {/* Company Details Body */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Název firmy</span>
                    <h3 className="text-2xl font-bold text-slate-100 mt-1 leading-snug tracking-tight">
                      {company.name}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-800">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">IČO firmy</span>
                      <p className="text-xl font-mono font-bold text-emerald-400 mt-1">{company.ico}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Adresa sídla</span>
                      <p className="text-sm text-slate-300 mt-1 leading-relaxed font-medium">
                        {company.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Embedded Map Section */}
                <div className="w-full border-t border-zinc-800 bg-zinc-950/50 relative">
                  <div className="p-4 sm:p-6 pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-3">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      Poloha sídla společnosti
                    </span>
                  </div>
                  
                  {/* Google Maps Embed Frame */}
                  <div className="w-full h-72 sm:h-80 overflow-hidden relative border-t border-zinc-800">
                    <iframe
                      id="google-maps-embed"
                      title={`Mapa sídla společnosti ${company.name}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0, filter: 'grayscale(0.4) contrast(1.1) invert(0.05)' }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(company.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    />
                  </div>
                </div>
              </div>
            )}
            
          </div>

          {/* Right Column: Search History & Cache list */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* History Card */}
            <div className="glass-card p-6 sm:p-8 rounded-2xl flex flex-col min-h-[400px] lg:min-h-[500px]">
              
              {/* Header inside History */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    Historie hledání (cache)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Uložené subjekty v Turso DB.</p>
                </div>

                {history.length > 0 && (
                  <button
                    onClick={exportToCsv}
                    className="bg-zinc-950 border border-zinc-700 hover:border-zinc-500 text-zinc-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer hover:bg-zinc-900 active:scale-95 shrink-0"
                    title="Exportovat historii do CSV souboru"
                  >
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    CSV Export
                  </button>
                )}
              </div>

              {/* Loader */}
              {historyLoading && history.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center space-y-3 py-12">
                  <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-xs text-slate-500 font-medium">Načítám uloženou historii...</p>
                </div>
              ) : history.length === 0 ? (
                // Empty state
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8 py-16 border border-dashed border-zinc-700 rounded-xl bg-zinc-950/60">
                  <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center mb-4 text-zinc-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-400">Žádná historie</h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-[200px] leading-relaxed">
                    Zatím jste nevyhledali žádnou firmu. Zadejte IČO pro první dotaz.
                  </p>
                </div>
              ) : (
                // History List
                <div className="flex-grow overflow-y-auto max-h-[350px] lg:max-h-[450px] space-y-3 pr-1">
                  {history.map((item) => (
                    <button
                      type="button"
                      key={item.ico}
                      onClick={(e) => handleSearch(e, item.ico)}
                      className={`group w-full border rounded-2xl p-4 cursor-pointer text-left transition-all duration-200 flex items-start justify-between gap-4 ${
                        company && company.ico === item.ico
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/50'
                          : 'bg-zinc-950/60 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-600'
                      }`}
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-xs font-mono text-emerald-400/90 font-medium">{item.ico}</p>
                        <p className="text-xs text-slate-400 line-clamp-1">{item.address}</p>
                      </div>
                      
                      <div className="flex flex-col items-end justify-between h-full shrink-0">
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(item.created_at).toLocaleDateString('cs-CZ')}
                        </span>
                        
                        <svg className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all mt-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="w-full text-center border-t border-zinc-800 py-6 mt-12 bg-black/30 z-10">
        <p className="text-xs text-zinc-500">
          © {new Date().getFullYear()} FirmaCheck. Vyrobeno s využitím Next.js 16, Turso Database a ARES API.
        </p>
      </footer>
    </div>
  );
}
