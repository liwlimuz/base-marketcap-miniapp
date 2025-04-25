import { useState, useEffect } from 'react';

export default function Home() {
  const [priceInfo, setPriceInfo] = useState('');
  const [targets, setTargets] = useState([]);
  const [ath, setAth] = useState({ athPrice: 0, athMarketCap: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/marketcap?address=YOUR_TOKEN_ADDRESS');
        if (!res.ok) {
          console.error('API error status:', res.status);
          return;
        }
        const data = await res.json();
        setPriceInfo(
          `Current price $${Number(data.usdPrice).toFixed(6)} → x${data.targets.find(t => t.price==='1').timesAway} away from $1`
        );
        setTargets(data.targets || []);
        setAth(data.athMcData || { athPrice: 0, athMarketCap: 0 });
      } catch (e) {
        console.error('Fetch error:', e);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Market Cap Mini App</h1>
      <p className="mb-2">{priceInfo}</p>
      <p className="mb-4">
        Market cap for $1 target:{' '}
        ${targets.find(t => t.price==='1')?.requiredMarketCap || 0}
      </p>

      <div className="mb-4">
        <h2 className="text-xl font-semibold">Price Targets</h2>
        <ul className="flex flex-wrap gap-2">
          {targets.map(t => (
            <li
              key={t.price}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full"
            >
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
);
}