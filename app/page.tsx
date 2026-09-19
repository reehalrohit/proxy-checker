"use client";
import { useEffect, useState, useMemo } from "react";

export default function Home() {
  const [proxies, setProxies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  // Test Status State: { id: { status: 'testing'|'working'|'dead', ping: number } }
  const [proxyStatus, setProxyStatus] = useState<Record<number, { status: string; ping?: number }>>({});
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProtocol, setSelectedProtocol] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const protocols = ["All", "HTTP", "HTTPS", "SOCKS4", "SOCKS5"];

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
    return proxies.filter(p => {
      const matchesSearch = p.ip.includes(searchTerm) || p.port.includes(searchTerm);
      const matchesProtocol = selectedProtocol === "All" || p.protocol.toUpperCase() === selectedProtocol.toUpperCase();
      return matchesSearch && matchesProtocol;
    });
  }, [proxies, searchTerm, selectedProtocol]);

  const totalPages = Math.ceil(filteredProxies.length / itemsPerPage);
  const paginatedProxies = filteredProxies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const testCurrentPage = () => {
    paginatedProxies.forEach(p => {
      if (!proxyStatus[p.id] || proxyStatus[p.id].status === 'dead') {
         testProxy(p.id, p.ip, p.port);
      }
    });
  };

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedProtocol]);

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Free Proxy List</h1>
          <p className="text-slate-500">Live filters & latency testing • {proxies.length} total proxies loaded</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
            
            <div className="relative w-full md:w-72">
              <input type="text" placeholder="Search IP or Port..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black placeholder-slate-400" />
            </div>

            <div className="flex flex-wrap gap-2 justify-center w-full md:w-auto">
              {protocols.map(proto => (
                <button key={proto} onClick={() => setSelectedProtocol(proto)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ selectedProtocol === proto ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50" }`}>
                  {proto}
                </button>
              ))}
              <button onClick={testCurrentPage} className="px-4 py-2 rounded-lg text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors ml-2">
                Scan Current Page
              </button>
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
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No proxies match your filters.</td></tr>
                  ) : (
                    paginatedProxies.map(p => {
                      const st = proxyStatus[p.id];
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500 uppercase">{p.protocol}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700 font-mono">{p.ip}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{p.port}</td>
                          
                          {/* Latency Status Column */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {!st && <span className="text-slate-400">Untested</span>}
                            {st?.status === 'testing' && <span className="text-amber-500 font-medium animate-pulse">Testing...</span>}
                            {st?.status === 'working' && <span className="text-emerald-600 font-bold flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>{st.ping} ms</span>}
                            {st?.status === 'dead' && <span className="text-red-500 font-medium flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Dead</span>}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end gap-2">
                            <button onClick={() => testProxy(p.id, p.ip, p.port)} className="inline-flex px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-slate-600 border border-slate-300 hover:bg-slate-100">
                              Test
                            </button>
                            <button onClick={() => handleCopy(p.full, p.id)} className={`inline-flex px-4 py-1.5 rounded-lg text-sm font-medium min-w-[75px] justify-center ${ copiedId === p.id ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100" }`}>
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
