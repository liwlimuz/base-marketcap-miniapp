import Head from "next/head";
import { useState } from "react";

export default function Home() {
  const [contractAddress, setContractAddress] = useState("");
  const [marketCap, setMarketCap] = useState(null);
  const [error, setError] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [targetsData, setTargetsData] = useState([]);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    setError("");
    setMarketCap(null);
    setPriceInfo("");
    setTargetsData([]);

    try {
      const res = await fetch("/api/marketcap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractAddress: contractAddress.trim() })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Unknown error");

      setMarketCap(data.targets?.find(t => t.price === "1")?.requiredMarketCap);

      if (data.usdPrice && data.timesAway) {
        setPriceInfo(
          `Current price $${Number(data.usdPrice).toFixed(6)} → ${data.timesAway}× away from $1`
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
        <title>$1 Market Cap Calculator</title>
        <meta property="og:title" content="$1 Market Cap Calculator" />
        <meta property="og:description" content="Enter a token contract on Base to calculate the market cap needed to hit key price targets." />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="Open Miniapp" />
      </Head>
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
          <h1 className="text-xl font-bold text-center">$ Price Target Calculator (Base)</h1>

          <input
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="Enter token contract address"
            className="w-full px-3 py-2 border rounded-lg"
          />

          <button
            onClick={calculate}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Calculating..." : "Calculate"}
          </button>

          {marketCap && (
            <div className="text-green-600 font-semibold text-center">
              Required Market Cap for $1/token: $
              {Number(marketCap).toLocaleString()} USD
            </div>
          )}

          {priceInfo && (
            <div className="text-blue-600 text-center text-sm">{priceInfo}</div>
          )}

          {targetsData.length > 0 && (
            <div className="space-y-1 text-sm text-purple-700">
              {targetsData.map((t) => (
                <div key={t.price}>
                  Target ${t.price}: need $
                  {Number(t.requiredMarketCap).toLocaleString()} market‑cap →
                  {t.timesAway
                    ? t.timesAway > 1
                      ? ` ×${t.timesAway} away`
                      : ` ×${(1 / t.timesAway).toFixed(2)} above target`
                    : " price unavailable"}
                </div>
              ))}
            </div>
          )}

          {error && <div className="text-red-600 text-center">{error}</div>}
        </div>
      </main>
    </>
  );
}