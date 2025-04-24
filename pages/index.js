import Head from "next/head";
import { useState } from "react";

export default function Home() {
  const [contractAddress, setContractAddress] = useState("");
  const [marketCap, setMarketCap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [targetsData, setTargetsData] = useState([]);
  const [debug, setDebug] = useState("");

  const calculateMarketCap = async () => {
    setLoading(true);
    setError("");
    setDebug("");
    setMarketCap(null);

    try {
      const response = await fetch("/api/marketcap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractAddress })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unknown error");
        setDebug(JSON.stringify(data.details || data, null, 2));
        return;
      }

      se
      if (data.usdPrice && data.timesAway) {
        setPriceInfo(`Current price $${Number(data.usdPrice)
      if (data.targets) {
        setTargetsData(data.targets);
      } else {
        setTargetsData([]);
      }
.toFixed(6)} → ${data.timesAway}× away from $1`);
      } else {
        setPriceInfo("");
      }
tMarketCap(data.requiredMarketCap.toLocaleString());
      setDebug(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Frontend error:", err);
      setError("Something went wrong. Please try again.");
      setDebug(err.message || JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>$1 Market Cap Calculator</title>
        <meta property="og:title" content="$1 Market Cap Calculator" />
        <meta property="og:description" content="Enter a token contract on Base to calculate the market cap needed to hit $1." />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="Open Miniapp" />
      </Head>
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
          <h1 className="text-xl font-bold text-center">$1 Market Cap Calculator (Base)</h1>
          <input
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Enter token contract address"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
          />
          <button
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
            onClick={calculateMarketCap}
            disabled={loading}
          >
            {loading ? "Calculating..." : "Calculate Market Cap"}
          </button>

          
          
          {targetsData.length > 0 && (
            <div className="space-y-1 text-sm text-purple-700">
              {targetsData.map(t => (
                <div key={t.price}>
                  Target ${t.price}: need ${Number(t.requiredMarketCap).toLocaleString()} market‑cap → {t.timesAway > 1 ? `${t.timesAway}× away` : `${(1/t.timesAway).toFixed(2)}× above target`}
                </div>
              ))}
            </div>
          )}
{priceInfo && (
            <div className="text-blue-600 text-center text-sm">{priceInfo}</div>
          )}
{marketCap && (
            <div className="text-green-600 font-semibold text-center">
              Required Market Cap for $1/token: ${marketCap} USD
            </div>
          )}

          {error && (
            <div className="text-red-600 text-center">{error}</div>
          )}

          {debug && (
            <pre className="text-xs text-gray-500 bg-gray-100 p-2 overflow-auto max-h-40 border border-gray-300 rounded-lg">
              {debug}
            </pre>
          )}
        </div>
      </main>
    </>
  );
}