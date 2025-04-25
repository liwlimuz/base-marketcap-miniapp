import Head from "next/head";
import { useState } from "react";

const COINGECKO_IDS = [
  "bitcoin",
  "ethereum",
  "dogecoin",
  "cardano",
  "shiba-inu",
  "avalanche-2",
  "polkadot",
  "solana",
  "bonk"
];

export default function Home() {
  const [contractAddress, setContractAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [targetsData, setTargetsData] = useState([]);
  const [athMcData, setAthMcData] = useState([]);
  const [marketCap1, setMarketCap1] = useState("");

  const fetchAthMcClient = async () => {
    const results = [];
    for (let i = 0; i < COINGECKO_IDS.length; i++) {
      const id = COINGECKO_IDS[i];
      try {
        const url = "https://api.coingecko.com/api/v3/coins/" + id +
          "?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false";
        const res = await fetch(url);
        if (!res.ok) continue;
        const json = await res.json();
        if (json && json.market_data && json.market_data.ath_market_cap && json.market_data.ath_market_cap.usd) {
          results.push({ coin: id.toUpperCase(), athMc: json.market_data.ath_market_cap.usd });
        }
      } catch {}
    }
    return results;
  };

  const calculate = async () => {
    setLoading(true);
    setError("");
    setPriceInfo("");
    setTargetsData([]);
    setAthMcData([]);
    setMarketCap1("");

    try {
      const res = await fetch("/api/marketcap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractAddress: contractAddress.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");

      const one = data.targets.find(t => t.price === "1");
      if (one) setMarketCap1(one.requiredMarketCap);

      if (data.usdPrice && one && one.timesAway) {
        setPriceInfo(
          "Current price $" + Number(data.usdPrice).toFixed(6) + " -> x" + one.timesAway + " away from $1"
        );
      }

      setTargetsData(data.targets || []);
      const athResults = await fetchAthMcClient();
      setAthMcData(athResults);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFactor = factorStr => {
    const f = parseFloat(factorStr);
    if (isNaN(f)) return factorStr;
    return f >= 10 ? Math.round(f) : f.toFixed(1);
  };

  return (
    <>
      <Head>
        <title>Base Price Targets</title>
        <meta property="og:image" content="/og.png" />
      </Head>
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#004CFF] to-[#7A5CFF]">
        <div className="w-full max-w-[450px] bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
          <h1 className="text-center text-3xl font-black text-purple-700 mb-6">$ Price Targets</h1>
          <input
            type="text"
            value={contractAddress}
            onChange={e => setContractAddress(e.target.value)}
            placeholder="0x… token address"
            className="w-full px-4 py-3 mb-4 border rounded-lg text-base bg-white/70"
          />
          <button
            onClick={calculate}
            disabled={loading}
            className="w-full mb-6 bg-[#0052FF] text-white py-3 rounded-full text-lg font-semibold hover:scale-[1.03] transition disabled:opacity-60"
          >
            {loading ? "Calculating..." : "Calculate"}
          </button>
          {marketCap1 && (
            <div className="text-emerald-600 font-mono text-xl text-center mb-4">
              Necessary MC for $1/coin: ${Number(marketCap1).toLocaleString()} USD
            </div>
          )}
          {priceInfo && (
            <div className="text-purple-700 text-center text-base mb-4 font-mono">{priceInfo}</div>
          )}
          {error && (
            <div className="text-red-600 text-center text-base mb-4">{error}</div>
          )}
          {targetsData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {targetsData.map(t => (
                <div key={t.price} className="bg-purple-100 rounded-2xl p-4 text-center">
                  <div className="font-semibold text-lg">$ {t.price}</div>
                  <div className="text-[0.75rem] font-mono mt-1">x{formatFactor(t.timesAway)}</div>
                </div>
              ))}
            </div>
          )}
          {athMcData.length > 0 && (
            <div className="bg-white/90 rounded-xl p-4">
              <h2 className="text-center text-xl font-bold mb-2">Coin ATH Market Caps</h2>
              <ul className="list-disc list-inside text-sm">
                {athMcData.map(a => (
                  <li key={a.coin}>
                    {a.coin} ATH Market Cap: ${Number(a.athMc).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </>
  );
}