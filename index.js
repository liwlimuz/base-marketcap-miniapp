import Head from "next/head";
import { useState } from "react";
import { ethers } from "ethers";

export default function Home() {
  const [contractAddress, setContractAddress] = useState("");
  const [marketCap, setMarketCap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState("");

  const BASE_RPC = "https://base-mainnet.g.alchemy.com/v2/nPrb1P3OYnpEcuCW-gZ9HI5ZfVHsqbhC";

  const calculateMarketCap = async () => {
    setLoading(true);
    setError("");
    setDebug("");
    setMarketCap(null);

    try {
      const provider = new ethers.providers.JsonRpcProvider(BASE_RPC);

      // Test RPC connection
      const blockNumber = await provider.getBlockNumber();
      setDebug(`RPC connected. Latest block: ${blockNumber}`);

      const abi = [
        "function totalSupply() view returns (uint256)",
        "function decimals() view returns (uint8)"
      ];
      const token = new ethers.Contract(contractAddress, abi, provider);

      const [rawSupply, decimals] = await Promise.all([
        token.totalSupply(),
        token.decimals()
      ]);

      const circulatingSupply = Number(ethers.utils.formatUnits(rawSupply, decimals));
      const requiredMarketCap = circulatingSupply * 1;

      setMarketCap(requiredMarketCap.toLocaleString());
    } catch (err) {
      console.error("Error details:", err);
      setDebug(JSON.stringify(err, null, 2));
      if (err.code === "NETWORK_ERROR") {
        setError("Network error: Check your Alchemy RPC key or connection.");
      } else if (err.code === "CALL_EXCEPTION") {
        setError("The contract may not support totalSupply() or decimals(). Try another address.");
      } else {
        setError("Something went wrong. Make sure the contract is valid on Base and try again.");
      }
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