import { useState } from 'react';

export default function Home() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [priceData, setPriceData] = useState(null);

  const fetchData = async () => {
    setError('');
    if (!address.startsWith('0x') || address.length < 6) {
      setError('Enter a valid 0x contract address');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/marketcap?address=' + encodeURIComponent(address));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API error');
      setPriceData(data);
    } catch (e) {
      setError(e.message);
      setPriceData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-center">Market‑Cap Mini‑App</h1>

      <label className="block mb-2 font-medium">ERC‑20 / Base token address</label>
      <input
        value={address}
        onChange={e => setAddress(e.target.value.trim())}
        placeholder="0x..."
        className="w-full px-3 py-2 border rounded mb-4"
      />

      <button
        onClick={fetchData}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mb-4 disabled:opacity-50"
      >
        {loading ? 'Loading…' : 'Calculate'}
      </button>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {priceData && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Results</h2>
          <p className="mb-2">
            Current price: <span className="font-mono">${Number(priceData.usdPrice).toFixed(6)}</span>
          </p>

          <div className="mb-4">
            <h3 className="font-semibold mb-1">Price Targets</h3>
            <ul className="flex flex-wrap gap-2">
              {priceData.targets.map(t => (
                <li
                  key={t.price}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  ${t.price} → {t.timesAway}× : ${t.requiredMarketCap}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-1">All‑Time High</h3>
            <p>ATH Price: ${Number(priceData.athMcData.athPrice).toFixed(6)}</p>
            <p>ATH Market Cap: ${Number(priceData.athMcData.athMarketCap).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}