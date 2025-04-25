import { ethers, isAddress } from "ethers";

const RPC_URL = "https://base-mainnet.g.alchemy.com/v2/nPrb1P3OYnpEcuCW-gZ9HI5ZfVHsqbhC";
const TARGETS = [0.1, 1, 10, 100];

async function fetchUsdPrice(address) {
  try {
    const res = await fetch("https://api.dexscreener.com/latest/dex/tokens/" + address);
    if (!res.ok) return 0;
    const json = await res.json();
    return parseFloat(json && json.pairs && json.pairs[0] && json.pairs[0].priceUsd ? json.pairs[0].priceUsd : "0") || 0;
  } catch {
    return 0;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }
  const { contractAddress } = req.body;
  if (!contractAddress || !isAddress(contractAddress)) {
    return res.status(400).json({ error: "Invalid contract address" });
  }
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const token = new ethers.Contract(contractAddress, [
      "function totalSupply() view returns (uint256)",
      "function decimals() view returns (uint8)"
    ], provider);
    const [rawSupply, decimals] = await Promise.all([token.totalSupply(), token.decimals()]);
    const supply = parseFloat(ethers.formatUnits(rawSupply, decimals));
    const usdPrice = await fetchUsdPrice(contractAddress);
    const targets = TARGETS.map(p => {
      const requiredMarketCap = (supply * p).toString();
      const timesAway = usdPrice ? (p / usdPrice).toFixed(2) : null;
      return { price: p.toString(), requiredMarketCap, timesAway };
    });
    return res.status(200).json({ success: true, usdPrice: usdPrice.toString(), targets });
  } catch (error) {
    return res.status(500).json({ error: "Contract call failed. Ensure it’s an ERC-20." });
  }
}