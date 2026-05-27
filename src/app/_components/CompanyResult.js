'use client';

export default function CompanyResult({ company }) {
  if (!company) return null;

  return (
    <div className="glass-card rounded-2xl overflow-hidden transition-all duration-500 glow-shadow-emerald border-emerald-500/30 animate-fadeIn">
      <div className={`px-6 py-2.5 flex items-center justify-between border-b ${
        company.source === 'cache'
          ? 'bg-emerald-950/20 border-emerald-500/10'
          : 'bg-blue-950/20 border-blue-500/10'
      }`}>
        <span className="text-xs text-slate-400 font-medium">Zdroj informací:</span>
        {company.source === 'cache' ? (
          <span className="text-xs bg-emerald-500/15 text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Lokální cache (Turso DB)
          </span>
        ) : (
          <span className="text-xs bg-blue-500/15 text-blue-300 font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            Státní registr ARES (Fresh)
          </span>
        )}
      </div>

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
            <p className="text-sm text-slate-300 mt-1 leading-relaxed font-medium">{company.address}</p>
          </div>
        </div>
      </div>

      <div className="w-full border-t border-zinc-800 bg-zinc-950/50">
        <div className="p-4 sm:p-6 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-3">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            Poloha sídla společnosti
          </span>
        </div>

        <div className="w-full h-72 sm:h-80 overflow-hidden border-t border-zinc-800">
          <iframe
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
  );
}
