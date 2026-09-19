"use client";
import { useEffect, useState, useMemo } from "react";

export default function Home() {
  const [proxies, setProxies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  const [proxyStatus, setProxyStatus] = useState<Record<number, { status: string; ping?: number }>>({});
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProtocol, setSelectedProtocol] = useState("All");
  const [whatsappOnly, setWhatsappOnly] = useState(false);
  const [onlyWorking, setOnlyWorking] = useState(false);
  const [sortByPing, setSortByPing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 50;
  const protocols = ["All", "HTTP", "HTTPS", "SOCKS4", "SOCKS5"];

  // 1. Load data and saved cache on mount
  useEffect(() => {
    const savedCache = localStorage.getItem("proxy-status-cache");
    if (savedCache) {
      try { setProxyStatus(JSON.parse(savedCache)); } catch (e) {}
    }
    
    fetch("/api/proxies")
      .then(res => res.json())
      .then(data => { setProxies(data); setLoading(false); });
  }, []);

  // 2. Auto-save test results to local storage
  useEffect(() => {
    if (Object.keys(proxyStatus).length > 0) {
      localStorage.setItem("proxy-status-cache", JSON.stringify(proxyStatus));
    }
  }, [proxyStatus]);

  const clearCache = () => {
    localStorage.removeItem("proxy-status-cache");
    setProxyStatus({});
  };

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const testProxy = async (id: number, ip: string, port: string) => {
    setProxyStatus(prev => ({ ...prev, [id]: { status: 'testing' } }));
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port }),
      });
      const data = await res.json();
      setProxyStatus(prev => ({ ...prev, [id]: { status: data.status, ping: data.ping } }));
    } catch {
      setProxyStatus(prev => ({ ...prev, [id]: { status: 'dead' } }));
    }
  };

  const filteredProxies = useMemo(() => {
    let result = proxies.filter(p => {
      const matchesSearch = p.ip.includes(searchTerm) || p.port.includes(searchTerm);
      const matchesProtocol = selectedProtocol === "All" || p.protocol.toUpperCase() === selectedProtocol.toUpperCase();
      const matchesWhatsApp = whatsappOnly ? (p.port === "80" || p.port === "443" || p.port === "5222") : true;
      const matchesWorking = onlyWorking ? proxyStatus[p.id]?.status === "working" : true;
      return matchesSearch && matchesProtocol && matchesWhatsApp && matchesWorking;
    });

    if (sortByPing) {
      result = [...result].sort((a, b) => {
        const pingA = proxyStatus[a.id]?.status === "working" ? (proxyStatus[a.id]?.ping ?? 99999) : 99999;
        const pingB = proxyStatus[b.id]?.status === "working" ? (proxyStatus[b.id]?.ping ?? 99999) : 99999;
        return pingA - pingB;
      });
    }

    return result;
  }, [proxies, searchTerm, selectedProtocol, whatsappOnly, onlyWorking, sortByPing, proxyStatus]);

  const totalPages = Math.ceil(filteredProxies.length / itemsPerPage);
  const paginatedProxies = filteredProxies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const testCurrentPage = () => {
    paginatedProxies.forEach(p => {
      if (!proxyStatus[p.id] || proxyStatus[p.id].status === 'dead') {
         testProxy(p.id, p.ip, p.port);
      }
    });
  };

  const exportTXT = () => {
    if (filteredProxies.length === 0) return;
    const content = filteredProxies.map(p => p.full).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proxies-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (filteredProxies.length === 0) return;
    const header = "Protocol,IP,Port,Status,Ping(ms)\n";
    const rows = filteredProxies.map(p => {
      const st = proxyStatus[p.id];
      const status = st ? st.status : "untested";
      const ping = st?.ping ? st.ping : "";
      return `${p.protocol},${p.ip},${p.port},${status},${ping}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proxies-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedProtocol, whatsappOnly, onlyWorking, sortByPing]);

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Free Proxy List</h1>
          <p className="text-slate-500">Live filters & latency testing • {proxies.length} total proxies loaded</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-4">
            
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="relative w-full sm:w-72">
                <input type="text" placeholder="Search IP or Port..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black placeholder-slate-400" />
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                <button onClick={() => setOnlyWorking(!onlyWorking)} className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${ onlyWorking ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100" }`}>
                  {onlyWorking ? "✓ Showing Working Only" : "Show Working Only"}
                </button>

                <button onClick={() => setSortByPing(!sortByPing)} className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${ sortByPing ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100" }`}>
                  {sortByPing ? "⚡ Fastest First" : "Sort: Fastest"}
                </button>

                <button onClick={testCurrentPage} className="px-4 py-2 rounded-lg text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors">
                  Scan Page
                </button>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row justify-between items-center pt-2 border-t border-slate-200 gap-3">
              <div className="flex flex-wrap gap-2 items-center">
                <button onClick={() => setWhatsappOnly(!whatsappOnly)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${ whatsappOnly ? "bg-green-500 text-white border-green-500 shadow-sm" : "bg-white text-green-600 border-green-200 hover:bg-green-50" }`}>
                  {whatsappOnly ? "✓ WhatsApp Mode" : "WhatsApp Proxies"}
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1"></div>

                {protocols.map(proto => (
                  <button key={proto} onClick={() => setSelectedProtocol(proto)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${ selectedProtocol === proto ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50" }`}>
                    {proto}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <button onClick={clearCache} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors shadow-sm flex items-center gap-1">
                  ⟲ Clear Memory
                </button>
                <button onClick={exportTXT} className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-1">
                  ↓ .TXT
                </button>
                <button onClick={exportCSV} className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-1">
                  ↓ .CSV
                </button>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading proxies...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Protocol</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">IP Address</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Port</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Latency (Ping)</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedProxies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        {onlyWorking ? "No working proxies scanned yet. Hit 'Scan Page' to verify live endpoints." : "No proxies match your filters."}
                      </td>
                    </tr>
                  ) : (
                    paginatedProxies.map(p => {
                      const st = proxyStatus[p.id];
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500 uppercase">{p.protocol}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700 font-mono">{p.ip}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{p.port}</td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {!st && <span className="text-slate-400">Untested</span>}
                            {st?.status === 'testing' && <span className="text-amber-500 font-medium animate-pulse">Testing...</span>}
                            {st?.status === 'working' && <span className="text-emerald-600 font-bold flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>{st.ping} ms</span>}
                            {st?.status === 'dead' && <span className="text-red-500 font-medium flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Dead</span>}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end gap-2">
                            
                            {/* New Telegram Quick-Connect Button for SOCKS5 */}
                            {p.protocol.toLowerCase() === 'socks5' && (
                              <a href={`tg://socks?server=${p.ip}&port=${p.port}`} className="inline-flex px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 items-center transition-colors">
                                Telegram
                              </a>
                            )}

                            <button onClick={() => testProxy(p.id, p.ip, p.port)} className="inline-flex px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-slate-600 border border-slate-300 hover:bg-slate-100">
                              Test
                            </button>
                            <button onClick={() => handleCopy(p.full, p.id)} className={`inline-flex px-4 py-1.5 rounded-lg text-sm font-medium min-w-[75px] justify-center transition-colors ${ copiedId === p.id ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100" }`}>
                              {copiedId === p.id ? "Copied" : "Copy"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
              <span className="text-sm text-slate-500">Page <span className="font-semibold text-slate-900">{currentPage}</span> of {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
