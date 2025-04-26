
import { useState } from 'react';

export default function Home(){
  const [address,setAddress]=useState('');
  const [data,setData]=useState(null);
  const [error,setError]=useState('');

  async function fetchData(){
    setError('');
    if(!address.startsWith('0x')){setError('Enter valid 0x address');return;}
    try{
      const res=await fetch('/api/marketcap?address='+address.trim());
      const json=await res.json();
      if(!res.ok) throw new Error(json.error||'Error');
      setData(json);
    }catch(e){setError(e.message);setData(null);}
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-xl bg-white/10 shadow-glass backdrop-blur-xs rounded-3xl p-8">
        <h1 className="text-4xl font-bold text-center mb-6 drop-shadow-sm">Market&nbsp;Cap&nbsp;Calculator</h1>

        <input
          value={address}
          onChange={e=>setAddress(e.target.value)}
          placeholder="Paste token address (0x...)"
          className="w-full mb-4 p-3 rounded-lg bg-white/20 placeholder-gray-200 text-gray-50 focus:outline-none focus:ring-2 focus:ring-white"
        />
        <button
          onClick={fetchData}
          className="w-full py-3 rounded-lg bg-baseblue hover:bg-warppurple transition-colors font-semibold shadow-md"
        >
          Calculate
        </button>

        {error && <p className="text-red-300 text-center mt-4">{error}</p>}

        {data && (
          <div className="mt-8 space-y-6 animate-fade-in">
            <p className="text-lg text-center">
              Current Price: <span className="font-mono">${Number(data.usdPrice).toFixed(6)}</span>
            </p>

            <div>
              <h2 className="font-semibold mb-2">Targets</h2>
              <ul className="flex flex-wrap gap-3">
                {data.targets.map(t=>(
                  <li
                    key={t.price}
                    className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-transform transform hover:-translate-y-1 text-sm backdrop-blur-xs shadow-inner"
                  >
                    ${t.price} → {t.timesAway}× → ${t.requiredMarketCap}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-semibold mb-2">All‑Time High</h2>
              <p>ATH Price: ${Number(data.athMcData.athPrice).toFixed(6)}</p>
              <p>ATH Market Cap: ${Number(data.athMcData.athMarketCap).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
