import { ethers, isAddress } from "ethers";

const BASE_RPC = "https://base-mainnet.g.alchemy.com/v2/nPrb1P3OYnpEcuCW-gZ9HI5ZfVHsqbhC";
const TARGETS = [0.1, 1, 10];

async function fetchUsdPrice(addr) {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${addr}`;
    const r = await fetch(url);
    if (!r.ok) return 0;
    const j = await r.json();
    return parseFloat(j?.pairs?.[0]?.priceUsd ?? "0") || 0;
  } catch {
    return 0;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }
  const { contractAddress } = req.body;
  if (!contractAddress || !isAddress(contractAddress)) {
    return res.status(400).json({ error: "Invalid contract address" });
  }

  try {
    const provider = new ethers.JsonRpcProvider(BASE_RPC);
    const abi = [
      "function totalSupply() view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];
    const token = new ethers.Contract(contractAddress, abi, provider);
    const [raw, decimals] = await Promise.all([token.totalSupply(), token.decimals()]);
    const supply = parseFloat(ethers.formatUnits(raw, decimals));
    const usdPrice = await fetchUsdPrice(contractAddress);
    const timesAway = usdPrice ? (1 / usdPrice).toFixed(2) : null;

    const targets = TARGETS.map(p => {
      const reqCap = supply * p;
      const factor = usdPrice ? (p / usdPrice) : null;
      return {
        price: p.toString(),
        requiredMarketCap: reqCap.toString(),
        timesAway: factor ? factor.toFixed(2) : null
      };
    });

    return res.status(200).json({
      success: true,
      usdPrice: usdPrice.toString(),
      timesAway,
      targets
    });
  } catch (e) {
    return res.status(500).json({ error: "Contract call failed", details: e.message });
  }
}