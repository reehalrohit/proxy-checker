"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [proxies, setProxies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/proxies")
      .then(res => res.json())
      .then(data => { setProxies(data); setLoading(false); });
  }, []);

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Free Proxy List
          </h1>
          <p className="text-slate-500">
            Automatically synced and verified every 30 minutes.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
            <div className="h-16 bg-slate-100 border-b border-slate-200"></div>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 border-b border-slate-50 flex items-center px-6 gap-4">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <span className="font-semibold text-slate-700 flex items-center gap-2">
                Live Proxies 
                <span className="bg-emerald-100 text-emerald-700 py-0.5 px-2 rounded-full text-xs font-bold">Active</span>
              </span>
              <span className="text-sm text-slate-500 font-medium">{proxies.length} available</span>
            </div>
            
            <div className="overflow-auto max-h-[65vh]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Protocol</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">IP Address</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Port</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proxies.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500 uppercase">
                        {p.protocol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700 font-mono">
                        {p.ip}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                        {p.port}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleCopy(p.full, p.id)}
                          className={`inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            copiedId === p.id 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                              : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
                          }`}
                        >
                          {copiedId === p.id ? "Copied!" : "Copy"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
