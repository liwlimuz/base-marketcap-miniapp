import { ethers, isAddress } from "ethers";

const BASE_RPC = "https://base-mainnet.g.alchemy.com/v2/nPrb1P3OYnpEcuCW-gZ9HI5ZfVHsqbhC";
const TARGETS = [0.1, 1, 10];

// simple price fetch from DexScreener
async function fetchUsdPrice(address) {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
    if (!res.ok) return 0;
    const data = await res.json();
    return parseFloat(data?.pairs?.[0]?.priceUsd ?? "0") || 0;
  } catch {
    return 0;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { contractAddress } = req.body;
  if (!contractAddress || !isAddress(contractAddress)) {
    return res.status(400).json({ error: "Invalid or missing contract address" });
  }

  try {
    const provider = new ethers.JsonRpcProvider(BASE_RPC);
    const abi = [
      "function totalSupply() view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];
    const token = new ethers.Contract(contractAddress, abi, provider);
    const [rawSupply, decimals] = await Promise.all([
      token.totalSupply(),
      token.decimals()
    ]);

    const supplyStr = ethers.formatUnits(rawSupply, decimals);
    const circulatingSupply = parseFloat(supplyStr);

    // live price
    const usdPrice = await fetchUsdPrice(contractAddress);

    // build target objects
    const targets = TARGETS.map(p => {
      const requiredCap = circulatingSupply * p;
      const factor = usdPrice ? p / usdPrice : null; // <1 means already past
      return {
        price: p.toString(),
        requiredMarketCap: requiredCap.toString(),
        timesAway: factor !== null ? factor.toFixed(2) : null
      };
    });

    return res.status(200).json({
      success: true,
      usdPrice: usdPrice.toString(),
      circulatingSupply: supplyStr,
      decimals: decimals.toString(),
      targets
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Contract call failed", details: err.message });
  }
}