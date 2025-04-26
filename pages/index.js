import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
  const [address, setAddress] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setError('');
    if (!address.startsWith('0x')) {
      setError('Enter a valid 0x address');
      return;
    }
    try {
      const res = await fetch('/api/marketcap?address=' + address.trim());
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'API error');
      setData(json);
    } catch (e) {
      setError(e.message);
      setData(null);
    }
  };

  return (
    <>
      <Head>
        <title>Base Dollar Targets</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="fixed inset-0 flex items-center justify-center p-6 overflow-auto bg-gradient-to-br from-baseblue to-warppurple">
        <div className="w-full max-w-xl bg-white/10 backdrop-blur-xs shadow-glass rounded-3xl p-8">
          <h1 className="text-4xl font-bold text-center text-gray-50 mb-6">Market Cap Calculator</h1>

          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Paste token address (0x...)"
            className="w-full mb-4 p-3 rounded-lg bg-white/20 placeholder-gray-200 text-gray-50 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            onClick={fetchData}
            className="w-full py-3 rounded-lg bg-baseblue hover:bg-warppurple transition-colors font-semibold shadow-md text-white"
          >
            Calculate
          </button>

          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-400/50 text-red-200 rounded-lg p-3 text-center">
              ⚠️ {error}. Please double-check the token address and try again.
            </div>
          )}

          {data && (
            <div className="mt-8 space-y-6">
              <p className="text-lg text-center text-gray-50">
                Current Price: <span className="font-mono">${'{'}Number(data.usdPrice).toFixed(6){'}'}</span>
              </p>
              <div>
                <h2 className="font-semibold text-gray-50 mb-2">Targets</h2>
                <ul className="flex flex-wrap gap-3">
                  
{data.targets.map(t => (
  <li
    key={t.price}
    className={
      t.price === '1'
        ? 'px-4 py-2 rounded-full text-sm bg-[#C0C0C0] text-gray-900 ring-1 ring-white/80 shadow-lg z-10 transition-transform transform hover:-translate-y-2'
        : 'px-3 py-1 rounded-full text-sm bg-white/20 hover:bg-white/30 text-blue-100 transition-transform transform hover:-translate-y-1'
    }
  >
    ${t.price} → {t.timesAway}× → ${t.requiredMarketCap}
  </li>
))}

                </ul>
              </div>
              <div className="text-gray-50"> {/* ATH */}
                <h2 className="font-semibold mb-2">All-Time High</h2>
                <p>ATH Price: ${'{'}Number(data.athMcData.athPrice).toFixed(6){'}'}</p>
                <p>ATH Market Cap: ${'{'}Number(data.athMcData.athMarketCap).toLocaleString(){'}'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
);
}