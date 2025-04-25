import { ethers, isAddress } from "ethers";

const RPC_URL = "https://base-mainnet.g.alchemy.com/v2/nPrb1P3OYnpEcuCW-gZ9HI5ZfVHsqbhC";
const TARGETS = [0.1, 1, 10, 100];
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

async function fetchUsdPrice(address) {
  try {
    const url = "https://api.dexscreener.com/latest/dex/tokens/" + address;
    const res = await fetch(url);
    if (!res.ok) return 0;
    const json = await res.json();
    return parseFloat(json && json.pairs && json.pairs[0] && json.pairs[0].priceUsd ? json.pairs[0].priceUsd : "0") || 0;
  } catch {
    return 0;
  }
}

async function fetchAthMarketCaps() {
  const results = [];
  for (let i = 0; i < COINGECKO_IDS.length; i++) {
    const id = COINGECKO_IDS[i];
    try {
      const url = "https://api.coingecko.com/api/v3/coins/" + id +
        "?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false";
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      const athMc = data.market_data.ath_market_cap.usd;
      results.push({ coin: id.toUpperCase(), athMc });
    } catch {
      // skip errors
    }
  }
  return results;
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
    const token = new ethers.Contract(
      contractAddress,
      ["function totalSupply() view returns (uint256)", "function decimals() view returns (uint8)"],
      provider
    );
    const [rawSupply, decimals] = await Promise.all([token.totalSupply(), token.decimals()]);
    const supply = parseFloat(ethers.formatUnits(rawSupply, decimals));
    const usdPrice = await fetchUsdPrice(contractAddress);
    const targets = TARGETS.map((p) => {
      const requiredMarketCap = (supply * p).toString();
      const timesAway = usdPrice ? (p / usdPrice).toFixed(2) : null;
      return { price: p.toString(), requiredMarketCap, timesAway };
    });
    const athMcData = await fetchAthMarketCaps();
    return res.status(200).json({ success: true, usdPrice: usdPrice.toString(), targets, athMcData });
  } catch (error) {
    return res.status(500).json({ error: "Contract call failed. Ensure it’s an ERC-20." });
  }
}