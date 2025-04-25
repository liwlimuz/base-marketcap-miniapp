import { useState } from 'react';

export default function Home() {
  const [priceInfo, setPriceInfo] = useState('');
  const [cap1, setCap1] = useState(0);
  const [targets, setTargets] = useState([]);
  const [ath, setAth] = useState({ athPrice: 0, athMarketCap: 0 });

  const fetchData = async () => {
    console.log('Starting data fetch');
    try {
      const res = await fetch('/api/marketcap?address=YOUR_TOKEN_ADDRESS');
      console.log('API response status:', res.status);
      const data = await res.json();
      console.log('API response JSON:', data);

      const one = data.targets.find(t => t.price === '1');
      if (one) setCap1(one.requiredMarketCap);

      setPriceInfo(
        `Current price $${Number(data.usdPrice).toFixed(6)} → x${one.timesAway} away from $1`
      );
      setTargets(data.targets || []);
      setAth(data.athMcData || { athPrice: 0, athMarketCap: 0 });
      console.log('ATH data set to:', data.athMcData);
    } catch (e) {
      console.error('Fetch error:', e);
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Market Cap Mini App (Debug)</h1>
      <button
        onClick={fetchData}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded shadow"
      >
        Calculate
      </button>
      <p className="mb-2">{priceInfo}</p>
      <p className="mb-4">Market cap for $1 target: ${cap1}</p>

      <div className="mb-4">
        <h2 className="text-xl font-semibold">Price Targets</h2>
        <ul className="flex flex-wrap gap-2">
          {targets.map(t => (
            <li key={t.price} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              ${t.price} → {t.timesAway}× away: Market Cap ${t.requiredMarketCap}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold">All-Time High</h2>
        {ath.athPrice ? (
          <>
            <p>ATH Price: ${Number(ath.athPrice).toFixed(6)}</p>
            <p>Market Cap at ATH: ${Number(ath.athMarketCap).toLocaleString()}</p>
          </>
        ) : (
          <p>No ATH data available yet.</p>
        )}
      </div>
    </div>
);
}