import Head from "next/head";
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { useState } from "react";

export default function Home() {
  const [contractAddress, setContractAddress] = useState("");
  const [loading, setLoading] = useState(false);
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
      const res = await fetch("/api/marketcap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractAddress: contractAddress.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");

      const one = data.targets?.find(t => t.price === "1");
      if (one) setMarketCap1(one.requiredMarketCap);
      if (data.usdPrice && data.timesAway) {
        setPriceInfo(
          `Current price $${Number(data.usdPrice).toFixed(6)} -> ×${data.timesAway} away from $1`
        );
      }
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
        <title>Base Dollar Targets</title>
        <meta name="description" content="Quickly see how far your Base token is from $1 and its supply-based market cap." />
        <meta property="og:title" content="Base Dollar Targets" />
        <meta property="og:description" content="Enter a Base token address to get instant price & market cap benchmarks." />
        <meta property="og:image" content="/og.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />

        <meta property="og:image" content="/og.png" />
      </Head>
      <motion.main initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-[#004CFF] to-[#7A5CFF]">
        <div className="w-full sm:max-w-[450px] md:max-w-[600px] bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 md:p-8">
          <h1 className="font-poppins font-poppins text-[#8E2DE2] text-3xl md:text-4xl font-black tracking-wide text-center mb-4">Base Dollar Targets</h1>

          <input
            value={contractAddress}
            onChange={(e) = onKeyDown={(e) => { if (e.key === 'Enter') calculate(); }}> setContractAddress(e.target.value)}
            placeholder="0x… token address"
            className="w-full px-3 py-2 md:px-4 md:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8E2DE2] text-sm bg-white/70"
          />

          <button
            onClick={calculate}
            disabled={loading}
            className="w-full mt-3 bg-[#8E2DE2] text-white py-2 md:py-3 rounded-full font-semibold hover:scale-[1.03] transition duration-200 ease-in-out disabled:opacity-60"
          >
            {loading ? "Calculating…" : "Calculate"}
          </button>

          {marketCap1 && (
            <div className="text-emerald-600 font-mono text-lg text-center mt-4">$1 Cap: ${Number(marketCap1).toLocaleString()}</div>
          )}

          {priceInfo && (
            <div className="text-white text-center text-sm mt-2 font-mono">
              {priceInfo}
            </div>
          )}

          {targetsData.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {targetsData.map((t) => (
                <div key={t.price} className="bg-purple-100 rounded-xl p-2 text-center transition transform hover:scale-105">
                  <div className="font-semibold">$ {t.price}</div>
                  <div className="text-xs font-mono">×{t.timesAway}</div>
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