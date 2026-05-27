'use client';

import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import SearchForm from './_components/SearchForm';
import CompanyResult from './_components/CompanyResult';
import HistoryList from './_components/HistoryList';
import { getRandomSuggestions, COMPANY_POOL } from '@/lib/companies';
import { isValidIco } from '@/lib/validation';

export default function Home() {
  const [icoInput, setIcoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [suggestions, setSuggestions] = useState(() => COMPANY_POOL.slice(0, 4));
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const limit = 6;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSuggestions(getRandomSuggestions(4));
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  const searchRequestId = useRef(0);

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch(`/api/companies?limit=${limit}&page=1`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.companies);
        setPage(1);
        setHasMore(data.companies.length < data.total);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchHistory();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [fetchHistory]);

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

    if (!isValidIco(targetIco)) {
      setError('IČO musí mít přesně 8 číslic.');
      return;
    }

    // Instantly replace the clicked quick tip button with another random one from the pool
    if (customIco) {
      setSuggestions(prev => {
        const idx = prev.findIndex(sug => sug.ico === targetIco);
        if (idx === -1) return prev; // not clicked from suggestions (e.g. clicked from history)

        const existingIcos = new Set(prev.map(s => s.ico));
        const candidates = COMPANY_POOL.filter(comp => !existingIcos.has(comp.ico));
        
        if (candidates.length === 0) return prev;

        const newSug = candidates[Math.floor(Math.random() * candidates.length)];
        const updated = [...prev];
        updated[idx] = newSug;
        return updated;
      });
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
        // Only prepend to local state instantly if it is a fresh ARES result (which will be at the top of the DB)
        if (data.source === 'ares') {
          setHistory(prev => {
            const filtered = prev.filter(item => item.ico !== data.ico);
            return [
              { ico: data.ico, name: data.name, address: data.address, created_at: data.created_at },
              ...filtered,
            ];
          });
        }
        setPage(1);
        // Async refresh to sync correctly with DB total count
        fetchHistory();
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
      const pageSize = 100;
      let exportPage = 1;
      let total = null;
      const fullHistory = [];

      while (total === null || fullHistory.length < total) {
        const res = await fetch(`/api/companies?limit=${pageSize}&page=${exportPage}`);
        if (!res.ok) throw new Error('Failed to fetch full history');

        const data = await res.json();
        const companies = data.companies || [];

        fullHistory.push(...companies);
        total = Number(data.total ?? fullHistory.length);

        if (companies.length === 0) break;
        exportPage += 1;
      }

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
              <Image
                src="/ai-firmacheck-logo.svg"
                alt="FirmaCheck AI generated logo"
                width={36}
                height={36}
                priority
                className="w-9 h-9 rounded-lg shadow-lg shadow-emerald-950/30"
              />
              <h1 className="text-3xl font-extrabold tracking-tight text-white">FirmaCheck</h1>
            </div>
            <p className="text-sm text-zinc-300 mt-2 max-w-2xl">
              Okamžité ověření českých firem přes státní registr ARES.
            </p>
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
        <p className="text-xs text-zinc-600 mt-2">
          Vytvořil: Adam Pokorný
        </p>
      </footer>
    </div>
  );
}
