import Head from "next/head";
import { useState } from "react";

export default function Home() {
  const [addr, setAddr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [targets, setTargets] = useState([]);
  const [ath, setAth] = useState([]);
  const [cap1, setCap1] = useState("");

  const calculate = async () => {
    if (!addr) return;
    setLoading(true);
    setError("");
    setPriceInfo("");
    setTargets([]);
    setAth([]);
    setCap1("");
    try {
      const res = await fetch("/api/marketcap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractAddress: addr.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const one = data.targets.find(t => t.price === "1");
      if (one) setCap1(one.requiredMarketCap);
      setPriceInfo(\`Current price $${Number(data.usdPrice).toFixed(6)} -> x${one.timesAway} away from $1\`);
      setTargets(data.targets);
      setAth(data.athMcData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = s => {
    const f = parseFloat(s);
    return isNaN(f) ? s : f >= 10 ? Math.round(f) : f.toFixed(1);
  };

  return (
    <>
      <Head><title>Base Price Targets</title></Head>
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#004CFF] to-[#7A5CFF]">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
          <h1 className="text-center text-3xl font-black text-purple-700 mb-6">$ Price Targets</h1>
          <input
            value={addr} onChange={e=>setAddr(e.target.value)}
            placeholder="0x... token address"
            className="w-full px-4 py-2 mb-4 border rounded"
          />
          <button onClick={calculate} disabled={loading}
            className="w-full py-2 mb-6 bg-[#0052FF] text-white rounded-full"
          >{loading?"...":"Calculate"}</button>
          {cap1 && <div className="text-center mb-4 text-green-600">Necessary MC for $1: ${Number(cap1).toLocaleString()}</div>}
          {priceInfo && <div className="text-center mb-4 text-purple-700">{priceInfo}</div>}
          {error && <div className="text-center mb-4 text-red-600">{error}</div>}
          {targets.length>0 && <div className="grid grid-cols-2 gap-2 mb-6">
            {targets.map(t=><div key={t.price} className="bg-purple-100 p-2 text-center">
              ${t.price}<br/>x{fmt(t.timesAway)}
            </div>)}
          </div>}
          {ath.length>0 && <div className="bg-white/90 p-4 rounded">
            <h2 className="font-bold mb-2">Coin ATH MC</h2>
            <ul className="list-disc list-inside text-sm">
              {ath.map(c=><li key={c.coin}>{c.coin}: ${Number(c.athMc).toLocaleString()}</li>)}
            </ul>
          </div>}
        </div>
      </main>
    </>
  );
}