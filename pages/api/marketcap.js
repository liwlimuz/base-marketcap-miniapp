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
    const res = await fetch(\`https://api.dexscreener.com/latest/dex/tokens/\${address}\`);
    if (!res.ok) return 0;
    const json = await res.json();
    return parseFloat(json.pairs[0].priceUsd) || 0;
  } catch {
    return 0;
  }
}

async function fetchAthMarketCaps() {
  const data = [];
  for (const id of COINGECKO_IDS) {
    try {
      const res = await fetch(
        \`https://api.coingecko.com/api/v3/coins/\${id}?localization=false&market_data=true\`
      );
      if (!res.ok) continue;
      const json = await res.json();
      const mc = json.market_data.ath_market_cap.usd;
      data.push({ coin: id.toUpperCase(), athMc: mc });
    } catch (e) {
      // skip
    }
  }
  return data;
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
    const targets = TARGETS.map(p => ({
      price: p.toString(),
      requiredMarketCap: (supply * p).toString(),
      timesAway: usdPrice ? (p / usdPrice).toFixed(2) : null
    }));
    const athMcData = await fetchAthMarketCaps();
    return res.status(200).json({ success: true, usdPrice, targets, athMcData });
  } catch (e) {
    return res.status(500).json({ error: "Contract call failed. Ensure it’s an ERC-20." });
  }
}