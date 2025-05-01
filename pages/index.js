import Head from "next/head";
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { useState } from "react";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(true);
  const [error, setError] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [targetsData, setTargetsData] = useState([]);
  const [marketCap1, setMarketCap1] = useState("");

  const calculate = async () => {
    setLoading(true);
    setError("");
    setPriceInfo("");
    setTargetsData([]);
    setMarketCap1("");

    try {
      const payload = inputValue.startsWith('$') ? { ticker: inputValue.trim().slice(1) } : { contractAddress: inputValue.trim() };
const res = await fetch('/api/marketcap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.currentMarketCap) {
        setPriceInfo(
          `Current MC: $${Number(data.currentMarketCap).toLocaleString()}`
        );
      }
      if (!res.ok) throw new Error(data.error || "Unknown error");

      const one = data.targets?.find(t => t.price === "1");
      if (one) setMarketCap1(one.requiredMarketCap);
      if (data.targets) setTargetsData(data.targets);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      
      <Head>
        <title>Base(d) Dollar Targets</title>
        <meta name="description" content="Calculate market cap targets for Base chain tokens instantly." />
        <meta property="og:title" content="Base Dollar MC Alpha" />
        <meta property="og:description" content="See how large a token's market cap needs to be to reach $1, $10, etc., on the Base network." />
        <meta property="og:image" content="/og.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://base-marketcap-miniapp.vercel.app/" />
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" as="style" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" />
        <link rel="preload" href="/og.png" as="image" />
        {/* Plausible Analytics */}
        <script async defer data-domain="base-marketcap-miniapp.vercel.app" src="https://plausible.io/js/plausible.js"></script>
      </Head>

      <motion.main initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-[#004CFF] to-[#7A5CFF]">
        <div className="w-full sm:max-w-[450px] md:max-w-[600px] bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6 md:p-8">
          <h1 className="font-sans font-sans text-[#8E2DE2] text-3xl md:text-4xl font-black tracking-wider text-center mb-4">Base(d) Dollar Targets</h1>

          
          <input
  value={inputValue}
  onChange={e => setInputValue(e.target.value)}
  onKeyDown={e => { if (e.key === 'Enter') calculate(); }}
  placeholder="Paste 0x… address or type $TICKER (e.g. $DEGEN)"
  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8E2DE2] text-sm bg-white/70"
/>


          
          <button
            onClick={calculate}
            disabled={loading}
            className="w-full mt-3 bg-[#8E2DE2] text-black py-2 md:py-3 rounded-full font-semibold hover:scale-[1.03] transition duration-200 ease-in-out disabled:opacity-60 hover:shadow-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          >
            {loading ? <span className="text-black">Calculating…</span> : <span className="text-black">Calculate</span>}
          </button>

          {marketCap1 && (
            <div className="font-semibold bg-gradient-to-r from-[#004CFF] via-[#7A5CFF] to-[#4A00E0] bg-clip-text text-transparent mt-4 whitespace-nowrap overflow-visible text-xl sm:text-2xl md:text-2xl text-center">
            MC for $1/coin: ${Number(marketCap1).toLocaleString()}
          </div>
          )}

          {priceInfo && (
            <div className="text-black text-center text-xl mt-2 font-sans">
              {priceInfo}
            </div>
          )}

          {targetsData.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {targetsData.map((t) => (
                <div key={t.price} className="bg-indigo-50 border border-indigo-200 rounded-xl p-2 text-center transition transform hover:scale-105">
                  <div className="font-semibold bg-gradient-to-r from-[#004CFF] via-[#7A5CFF] to-[#4A00E0] bg-clip-text text-transparent">$ {t.price}</div>
                  <div className="text-xs font-sans">×{t.timesAway}</div>
                </div>
              ))}
            </div>
          )}

          {error && <div className="text-red-600 text-center text-sm mt-3">{error}</div>}
        </div>
      </motion.main>
    </>
  );
}