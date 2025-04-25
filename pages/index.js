import { useState, useEffect } from 'react';

export default function Home() {
  const [cap1, setCap1] = useState(0);
  const [priceInfo, setPriceInfo] = useState('');
  const [targets, setTargets] = useState([]);
  const [ath, setAth] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/marketcap?address=YOUR_TOKEN_ADDRESS');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const one = data.targets.find(t => t.price === '1');
        if (one) setCap1(one.requiredMarketCap);
        setPriceInfo(
          `Current price $${Number(data.usdPrice).toFixed(6)} -> x${one.timesAway} away from $1`
        );
        setTargets(data.targets);
        setAth(data.athMcData);
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <h1>Market Cap Mini App</h1>
      <p>{priceInfo}</p>
      <p>Market cap for $1 target: ${cap1}</p>
      {/* render targets and ATH data */}
    </div>
  );
}