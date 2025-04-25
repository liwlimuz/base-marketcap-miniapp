import { useState, useEffect } from 'react';

export default function Home() {
  const [address, setAddress] = useState('');
  const [priceInfo, setPriceInfo] = useState('');
  const [targets, setTargets] = useState([]);
  const [ath, setAth] = useState({ athPrice: 0, athMarketCap: 0 });
  const [error, setError] = useState('');

  const fetchData = async () => {
    setError('');
    if (!address.startsWith('0x')) {
      setError('Please enter a valid 0x token address.');
      return;
    }
    try {
      const res = await fetch('/api/marketcap?address=' + address);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API Error');
      setPriceInfo(
        `Current price $${Number(data.usdPrice).toFixed(6)} → x${data.targets.find(t => t.price==='1').timesAway} away from $1`
      );
      setTargets(data.targets);
      setAth(data.athMcData);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Market Cap Mini App</h1>
      <div className="mb-4">
        <input
          className="w-full px-3 py-2 border rounded mb-2"
          placeholder="0x... token address"
          value={address}
          onChange={e => setAddress(e.target.value.trim())}
        />
        <button
          onClick={fetchData}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
        >
          Calculate
        </button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
      {priceInfo && (
        <div>
          <p className="mb-2">{priceInfo}</p>
          <p className="mb-4">
            Market cap for $1 target: 
            ${targets.find(t => t.price==='1')?.requiredMarketCap || 0}
          </p>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Price Targets</h2>
            <ul className="flex flex-wrap gap-2 mt-2">
              {targets.map(t => (
                <li key={t.price} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  ${t.price} → {t.timesAway}×: ${t.requiredMarketCap}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold">All-Time High</h2>
            <p>ATH Price: ${Number(ath.athPrice).toFixed(6)}</p>
            <p>Market Cap at ATH: ${Number(ath.athMarketCap).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
);
}