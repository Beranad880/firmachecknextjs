'use client';

import { useState, useEffect, useRef } from 'react';
import SearchForm from './_components/SearchForm';
import CompanyResult from './_components/CompanyResult';
import HistoryList from './_components/HistoryList';
import { getRandomSuggestions } from '@/lib/companies';

export default function Home() {
  const [icoInput, setIcoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const limit = 6;

  useEffect(() => {
    setSuggestions([
      { name: 'Madeta', ico: '63549391' },
      { name: 'Decathlon', ico: '26590993' },
      { name: 'Kentico', ico: '27647302' },
      { name: 'Alza.cz', ico: '27082440' },
      { name: 'Škoda Auto', ico: '00177041' }
    ]);
  }, []);
  const searchRequestId = useRef(0);

  const fetchHistory = async (resetPage = false) => {
    try {
      setHistoryLoading(true);
      const targetPage = resetPage ? 1 : page;
      const res = await fetch(`/api/companies?limit=${limit}&page=${targetPage}`);
      if (res.ok) {
        const data = await res.json();
        if (resetPage) {
          setHistory(data.companies);
          setPage(1);
          setHasMore(data.companies.length < data.total);
        } else {
          setHistory(prev => {
            const existingIcos = new Set(prev.map(c => c.ico));
            const newItems = data.companies.filter(c => !existingIcos.has(c.ico));
            const updated = [...prev, ...newItems];
            setHasMore(updated.length < data.total);
            return updated;
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(true);
  }, []);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    try {
      setHistoryLoading(true);
      const res = await fetch(`/api/companies?limit=${limit}&page=${nextPage}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(prev => {
          const existingIcos = new Set(prev.map(c => c.ico));
          const newItems = data.companies.filter(c => !existingIcos.has(c.ico));
          const updated = [...prev, ...newItems];
          setHasMore(updated.length < data.total);
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to load more history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSearch = async (e, customIco = null) => {
    if (e) e.preventDefault();

    const targetIco = customIco || icoInput.trim();

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

      if (requestId !== searchRequestId.current) return;

      if (!res.ok) {
        setError(data.error || 'Něco se nepovedlo při vyhledávání subjekta.');
      } else {
        setCompany(data);
        // Prepend to local state instantly
        setHistory(prev => {
          const filtered = prev.filter(item => item.ico !== data.ico);
          return [
            { ico: data.ico, name: data.name, address: data.address, created_at: data.created_at },
            ...filtered,
          ];
        });
        setPage(1);
        // Async refresh to sync correctly with DB total count
        fetchHistory(true);
      }
    } catch (err) {
      if (requestId !== searchRequestId.current) return;
      setError('Chyba sítě. Zkontrolujte připojení k internetu.');
      console.error('Search request failed:', err);
    } finally {
      if (requestId === searchRequestId.current) {
        setLoading(false);
      }
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Opravdu chcete vymazat celou historii?')) return;
    try {
      const res = await fetch('/api/companies', { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
        setCompany(null);
        setHasMore(false);
        setPage(1);
      }
    } catch (err) {
      console.error('Clear history failed:', err);
    }
  };

  const exportToCsv = async () => {
    try {
      setLoading(true);
      // Fetch full history without pagination limit to ensure complete CSV file
      const res = await fetch('/api/companies?limit=1000');
      if (!res.ok) throw new Error('Failed to fetch full history');
      const data = await res.json();
      
      const fullHistory = Array.isArray(data) ? data : (data.companies || []);

      if (fullHistory.length === 0) return;

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
        ...fullHistory.map(item =>
          [item.ico, item.name, item.address, item.created_at].map(escapeCsv).join(',')
        ),
      ];

      // UTF-8 BOM ensures MS Excel parses Czech characters correctly
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
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error('CSV Export failed:', err);
      setError('Nepodařilo se exportovat kompletní historii do CSV.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-transparent text-zinc-100 min-h-screen relative overflow-hidden flex flex-col font-sans">
      <div className="max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 z-10 flex-grow flex flex-col">

        <header className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/30">
                <svg className="w-5 h-5 text-zinc-950" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">FirmaCheck</h1>
            </div>
            <p className="text-sm text-zinc-300 mt-2 max-w-2xl">
              Okamžité ověření českých firem přes státní registr ARES s chytrým mezipaměťovým úložištěm Turso DB.
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center justify-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-mono text-zinc-300 tracking-wider">ARES API CONNECTED</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <SearchForm
              icoInput={icoInput}
              onChange={setIcoInput}
              onSubmit={handleSearch}
              loading={loading}
              error={error}
              suggestions={suggestions}
            />
            <CompanyResult company={company} />
          </div>

          <div className="lg:col-span-5 space-y-6">
            <HistoryList
              history={history}
              historyLoading={historyLoading}
              activeIco={company?.ico}
              onSelect={handleSearch}
              onExport={exportToCsv}
              onClear={clearHistory}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
            />
          </div>
        </div>
      </div>

      <footer className="w-full text-center border-t border-zinc-800 py-6 mt-12 bg-black/30 z-10">
        <p className="text-xs text-zinc-500">
          © {new Date().getFullYear()} FirmaCheck. Vyrobeno s využitím Next.js 16, Turso Database a ARES API.
        </p>
      </footer>
    </div>
  );
}
