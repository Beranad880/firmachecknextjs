'use client';

function SkeletonCard() {
  return (
    <div className="w-full border border-zinc-800 rounded-2xl p-4 bg-zinc-950/60">
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded-md bg-zinc-800 animate-pulse" />
        <div className="h-3 w-1/3 rounded-md bg-zinc-800/70 animate-pulse" />
        <div className="h-3 w-1/2 rounded-md bg-zinc-800/50 animate-pulse" />
      </div>
    </div>
  );
}

export default function HistoryList({ history, historyLoading, activeIco, onSelect, onExport, onClear }) {
  return (
    <div className="glass-card p-6 sm:p-8 rounded-2xl flex flex-col min-h-[400px] lg:min-h-[500px]">
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
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onExport}
              className="bg-zinc-950 border border-zinc-700 hover:border-zinc-500 text-zinc-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer hover:bg-zinc-900 active:scale-95"
              title="Exportovat historii do CSV souboru"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              CSV
            </button>
            <button
              onClick={onClear}
              className="bg-zinc-950 border border-zinc-700 hover:border-red-700 text-zinc-400 hover:text-red-400 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer hover:bg-red-950/30 active:scale-95"
              title="Vymazat celou historii"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Vymazat
            </button>
          </div>
        )}
      </div>

      {historyLoading && history.length === 0 ? (
        <div className="flex-grow space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : history.length === 0 ? (
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
        <div className="flex-grow overflow-y-auto max-h-[350px] lg:max-h-[450px] space-y-3 pr-1">
          {history.map((item) => (
            <button
              type="button"
              key={item.ico}
              onClick={(e) => onSelect(e, item.ico)}
              aria-label={`Zobrazit detail firmy ${item.name}, IČO ${item.ico}`}
              className={`group w-full border rounded-2xl p-4 cursor-pointer text-left transition-all duration-200 flex items-start justify-between gap-4 ${
                activeIco === item.ico
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
  );
}
