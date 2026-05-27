import { useState } from 'react';

export default function CompanyResult({ company }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!company) return null;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

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
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xl font-mono font-bold text-emerald-400">{company.ico}</p>
              <button
                onClick={() => handleCopy(company.ico, 'ico')}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-all cursor-pointer"
                title="Kopírovat IČO"
              >
                {copiedField === 'ico' ? (
                  <svg className="w-3.5 h-3.5 text-emerald-400 font-bold" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375a1.125 1.125 0 01-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376A8.965 8.965 0 0012 12.75c-.497 0-.982.04-1.455.12m5.205 4.38a8.967 8.967 0 01-5.205-4.38m5.205 4.38v-3.375c0-.621-.504-1.125-1.125-1.125h-3.375m3.375 4.5V15m-3.75-3.75h-.008v-.008h.008v.008zm-.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                )}
              </button>
              {copiedField === 'ico' && (
                <span className="text-[10px] text-emerald-400 font-semibold animate-pulse bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Zkopírováno!</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Adresa sídla</span>
            <div className="flex items-start gap-2 mt-1">
              <p className="text-sm text-slate-300 leading-relaxed font-medium">{company.address}</p>
              <button
                onClick={() => handleCopy(company.address, 'address')}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-all shrink-0 mt-0.5 cursor-pointer"
                title="Kopírovat adresu"
              >
                {copiedField === 'address' ? (
                  <svg className="w-3.5 h-3.5 text-emerald-400 font-bold" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375a1.125 1.125 0 01-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376A8.965 8.965 0 0012 12.75c-.497 0-.982.04-1.455.12m5.205 4.38a8.967 8.967 0 01-5.205-4.38m5.205 4.38v-3.375c0-.621-.504-1.125-1.125-1.125h-3.375m3.375 4.5V15m-3.75-3.75h-.008v-.008h.008v.008zm-.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                )}
              </button>
              {copiedField === 'address' && (
                <span className="text-[10px] text-emerald-400 font-semibold animate-pulse bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 self-center">Zkopírováno!</span>
              )}
            </div>
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

        {/* Redirect links to Google Maps and Mapy.cz */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-xs text-zinc-500 font-medium">Nedaří se vám mapu načíst? Spusťte navigaci:</span>
          <div className="flex items-center gap-4">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.name + ' ' + company.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
            >
              <span>Google Mapy</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
            <span className="text-zinc-700 text-xs">|</span>
            <a
              href={`https://mapy.cz/zakladni?q=${encodeURIComponent(company.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
            >
              <span>Mapy.cz</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
