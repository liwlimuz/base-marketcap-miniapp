import Head from "next/head";
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

      if (data.targets) {
        setTargetsData(data.targets);
        const one = data.targets.find(t => t.price === "1");
        if (one) setMarketCap1(one.requiredMarketCap);
      }

      if (data.usdPrice && data.timesAway) {
        setPriceInfo(
          `Current price $${Number(data.usdPrice).toFixed(6)} -> ×${data.timesAway} away from $1`
        );
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Price-Target Calculator (Base)</title>
      </Head>
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-[320px] bg-white rounded-2xl shadow-xl p-5">
          <h1 className="text-center text-[#0052FF] font-semibold mb-3">
            Price-Target Calculator
          </h1>

          <input
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="Token contract on Base"
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />

          <button
            onClick={calculate}
            disabled={loading}
            className="w-full mt-3 bg-[#0052FF] text-white py-2 rounded-lg font-semibold disabled:opacity-60"
          >
            {loading ? "Calculating…" : "Calculate"}
          </button>

          {marketCap1 && (
            <div className="text-green-600 font-semibold text-center mt-3">
              Required Market‑Cap for $1/token: $
              {Number(marketCap1).toLocaleString()} USD
            </div>
          )}

          {priceInfo && (
            <div className="text-blue-600 text-center text-sm mt-2 font-mono">
              {priceInfo}
            </div>
          )}

          {targetsData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-sm text-purple-700 mt-3">
              {targetsData.map(t => (
                <div key={t.price} className="border border-purple-200 rounded-lg p-2 text-center">
                  <div className="font-semibold">$ {t.price}</div>
                  <div className="text-xs font-mono">×{t.timesAway}</div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-red-600 text-center text-sm mt-3">{error}</div>
          )}
        </div>
      </main>
    </>
  );
}