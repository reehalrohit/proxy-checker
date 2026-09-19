"use client";
import { useEffect, useState, useMemo } from "react";

export default function Home() {
  const [proxies, setProxies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
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

  // Filter & Pagination Logic
  const filteredProxies = useMemo(() => {
    return proxies.filter(p => {
      const matchesSearch = p.ip.includes(searchTerm) || p.port.includes(searchTerm);
      const matchesProtocol = selectedProtocol === "All" || p.protocol.toUpperCase() === selectedProtocol.toUpperCase();
      return matchesSearch && matchesProtocol;
    });
  }, [proxies, searchTerm, selectedProtocol]);

  const totalPages = Math.ceil(filteredProxies.length / itemsPerPage);
  const paginatedProxies = filteredProxies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedProtocol]);

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Free Proxy List</h1>
          <p className="text-slate-500">Live filters • {proxies.length} total proxies loaded</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
            
            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search IP or Port..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black placeholder-slate-400"
              />
              <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Protocol Filters */}
            <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
              {protocols.map(proto => (
                <button
                  key={proto}
                  onClick={() => setSelectedProtocol(proto)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedProtocol === proto
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {proto}
                </button>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading proxies...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Protocol</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">IP Address</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Port</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedProxies.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No proxies match your filters.</td>
                    </tr>
                  ) : (
                    paginatedProxies.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500 uppercase">{p.protocol}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700 font-mono">{p.ip}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{p.port}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleCopy(p.full, p.id)}
                            className={`inline-flex px-4 py-1.5 rounded-lg text-sm font-medium ${
                              copiedId === p.id 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            {copiedId === p.id ? "Copied" : "Copy"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page <span className="font-semibold text-slate-900">{currentPage}</span> of {totalPages}
              </span>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
