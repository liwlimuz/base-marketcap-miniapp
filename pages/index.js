import { useState } from 'react';

export default function Home() {
  const [priceInfo, setPriceInfo] = useState('');
  const [cap1, setCap1] = useState(0);
  const [targets, setTargets] = useState([]);
  const [ath, setAth] = useState({ athPrice: 0, athMarketCap: 0 });

  const fetchData = async () => {
    console.log('Starting data fetch');
    try {
      const priceRes = await fetch('/api/marketcap?address=YOUR_TOKEN_ADDRESS');
      console.log('Price/API response status:', priceRes.status);
      const data = await priceRes.json();
      console.log('API response JSON:', data);

      const one = data.targets.find(t => t.price === '1');
      if (one) setCap1(one.requiredMarketCap);
      setPriceInfo(
        `Current price $${Number(data.usdPrice).toFixed(6)} → x${one.timesAway} away from $1`
      );
      setTargets(data.targets);
      setAth(data.athMcData);
      console.log('ATH data set to:', data.athMcData);
    } catch (e) {
      console.error('Fetch error:', e);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Market Cap Mini App (Debug)</h1>
      <button onClick={fetchData}>Calculate</button>
      <p>{priceInfo}</p>
      <p>Market cap for $1 target: ${cap1}</p>

      <div>
        <h2>Price Targets</h2>
        <ul>
          {targets.map(t => (
            <li key={t.price}>
              ${t.price} → {t.timesAway}× away: Market Cap ${t.requiredMarketCap}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2>All-Time High</h2>
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