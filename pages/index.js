
import { useState } from 'react';

export default function Home() {
  const [address, setAddress] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setError('');
    try {
      const res = await fetch('/api/marketcap?address=' + address.trim());
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unknown error');
      setData(json);
    } catch (err) {
      setError(err.message);
      setData(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-6">Market Cap Calculator</h1>

        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Paste token address (0x...)"
          className="w-full mb-4 p-3 border rounded-lg shadow-inner"
        />
        <button
          onClick={fetchData}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
        >
          Calculate
        </button>

        {error && <p className="text-red-600 mt-4 text-center">{error}</p>}

        {data && (
          <div className="mt-6 space-y-4">
            <p className="text-lg font-medium text-center">
              Current Price: <span className="font-mono">${Number(data.usdPrice).toFixed(6)}</span>
            </p>
            <div>
              <h2 className="font-semibold mb-1">Targets</h2>
              <ul className="flex flex-wrap gap-2">
                {data.targets.map(t => (
                  <li key={t.price} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    ${t.price} → {t.timesAway}× → ${t.requiredMarketCap}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-semibold mb-1">All-Time High</h2>
              <p>ATH Price: ${Number(data.athMcData.athPrice).toFixed(6)}</p>
              <p>ATH Market Cap: ${Number(data.athMcData.athMarketCap).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
