"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [proxies, setProxies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/proxies")
      .then(res => res.json())
      .then(data => { setProxies(data); setLoading(false); });
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-black">Free Proxy List</h1>
        {loading ? <p className="text-black">Loading...</p> : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-black font-bold">IP</th>
                  <th className="p-4 text-black font-bold">Port</th>
                </tr>
              </thead>
              <tbody>
                {proxies.map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="p-4 text-black">{p.ip}</td>
                    <td className="p-4 text-black">{p.port}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
