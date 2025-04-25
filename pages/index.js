import Head from "next/head";
import { useState } from "react";

export default function Home() {
  const [contractAddress, setContractAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [targetsData, setTargetsData] = useState([]);
  const [marketCap1, setMarketCap1] = useState("");

  const calculate = async () => {
    setLoading(true);
    setError("");
    setPriceError("");
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

      if (data.priceError) {
        setPriceError(data.priceError);
      }

      const one = data.targets.find((t) => t.price === "1");
      setMarketCap1(one?.requiredMarketCap || "");

      if (data.usdPrice && one?.timesAway) {
        setPriceInfo(
          `Current price $${Number(data.usdPrice).toFixed(6)} -> x${one.timesAway} away from $1`
        );
      }
      setTargetsData(data.targets);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Base Price Targets</title>
        <meta property="og:image" content="/og.png" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="Open Miniapp" />
      </Head>
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#004CFF] to-[#7A5CFF]">
        <div className="w-full max-w-[340px] md:max-w-[450px] bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6">
          <h1 className="text-center text-2xl font-black text-purple-700 mb-4">
            $ Price Targets
          </h1>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x... token address"
            className="w-full px-3 py-2 mb-3 border rounded-lg text-sm bg-white/70"
          />
          <button
            onClick={calculate}
            disabled={loading}
            className="w-full mb-4 bg-[#0052FF] text-white py-2 rounded-full font-semibold hover:scale-[1.03] transition disabled:opacity-60"
          >
            {loading ? "Calculating..." : "Calculate"}
          </button>
          {marketCap1 && (
            <div className="text-emerald-600 font-mono text-lg text-center mb-2">
              Necessary MC for $1/coin: ${Number(marketCap1).toLocaleString()} USD
            </div>
          )}
          {priceInfo && (
            <div className="text-purple-700 text-center text-sm mb-2 font-mono">
              {priceInfo}
            </div>
          )}
          {priceError && (
            <div className="text-yellow-600 text-center text-sm mb-2">
              {priceError}
            </div>
          )}
          {error && (
            <div className="text-red-600 text-center text-sm mb-2">
              {error}
            </div>
          )}
          {targetsData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {targetsData.map((t) => (
                <div key={t.price} className="bg-purple-100 rounded-xl p-2 text-center">
                  <div className="font-semibold text-sm">$ {t.price}</div>
                  <div className="text-[0.65rem] font-mono">x{t.timesAway}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}