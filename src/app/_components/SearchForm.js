'use client';

export default function SearchForm({ icoInput, onChange, onSubmit, loading, error, suggestions }) {
  return (
    <div className="glass-card p-6 sm:p-8 rounded-2xl transition-all duration-300 hover:border-zinc-500/70">
      <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
        </svg>
        Vyhledat ekonomický subjekt
      </h2>

      <form onSubmit={(e) => onSubmit(e)} className="space-y-4">
        <div className="relative">
          <label htmlFor="ico-search-input" className="sr-only">IČO firmy</label>
          <input
            id="ico-search-input"
            type="text"
            pattern="\d*"
            maxLength={8}
            minLength={8}
            required
            placeholder="Zadejte 8místné IČO..."
            value={icoInput}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
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

        <div className="flex flex-wrap items-center gap-2.5 pt-1 select-none">
          <span className="text-xs text-zinc-400 shrink-0">Rychlé tipy:</span>
          {suggestions.map((sug) => (
            <button
              key={sug.ico}
              type="button"
              onClick={(e) => onSubmit(e, sug.ico)}
              disabled={loading}
              className="text-xs bg-zinc-950 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900 px-3 py-1.5 rounded-md text-zinc-200 font-medium transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-95"
            >
              {sug.name} ({sug.ico})
            </button>
          ))}
        </div>
      </form>

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
  );
}
