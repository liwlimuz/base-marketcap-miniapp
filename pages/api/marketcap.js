
import { ethers } from "ethers";

const RPC = "https://base-mainnet.g.alchemy.com/v2/nPrb1P3OYnpEcuCW-gZ9HI5ZfVHsqbhC";
const TARGETS = [0.1, 1, 10];

const provider = new ethers.JsonRpcProvider(RPC);
const isValidAddress = (addr) => /^0x[0-9a-fA-F]{40}$/.test(addr) && ethers.isAddress(addr);

async function getPrice(addr) {
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addr}`);
    if (!r.ok) return 0;
    const j = await r.json();
    return parseFloat(j?.pairs?.[0]?.priceUsd || "0") || 0;
  } catch {
    return 0;
  }
}

// Accepts '$DEGEN', 'degen', 'DEGEN'
function normalizeTicker(raw) {
  return raw.replace(/^\$/, "").replace(/^\$/, "").replace(/^\$/, "").replace(/^\$/, "");
}

async function resolveAddressFromTicker(ticker) {
  ticker = ticker.toLowerCase().replace(/^\$/, "");
  // 1) use Coingecko search
  const search = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(ticker)}`);
  if (!search.ok) throw new Error("Unable to resolve ticker.");
  const { coins } = await search.json();
  const hit = coins.find(c => c.symbol.toLowerCase() === ticker);
  if (!hit) throw new Error("Token not found on CoinGecko.");
  const detailsRes = await fetch(`https://api.coingecko.com/api/v3/coins/${hit.id}`);
  if (!detailsRes.ok) throw new Error("Token details not available.");
  const details = await detailsRes.json();
  const platforms = details.platforms || {};
  let addr = platforms["base"];
  if (!addr) {
    addr = Object.values(platforms).find(v => typeof v === "string" && v.startsWith("0x"));
  }
  if (!addr || !isValidAddress(addr)) {
    throw new Error("No Base address found for that ticker.");
  }
  return addr;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { input = "" } = req.body;
  let address = input.trim();

  if (!isValidAddress(address)) {
    // treat as ticker
    try {
      address = await resolveAddressFromTicker(address);
    } catch (e) {
      return res.status(400).json({ error: "Double‑check the address or ticker; ensure it’s a valid Base token." });
    }
  }

  if (!isValidAddress(address)) {
    return res.status(400).json({ error: "Double‑check the address or ticker; ensure it’s a valid Base token." });
  }

  try {
    const abi = ["function totalSupply() view returns (uint256)", "function decimals() view returns (uint8)"];
    const token = new ethers.Contract(address, abi, provider);
    const [rawSupply, decimals] = await Promise.all([token.totalSupply(), token.decimals()]);
    const supply = parseFloat(ethers.formatUnits(rawSupply, decimals));
    const usd = await getPrice(address);

    const targets = TARGETS.map(p => ({
      price: p.toString(),
      requiredMarketCap: (supply * p).toString(),
      timesAway: usd ? (p / usd).toFixed(2) : null,
    }));

    res.status(200).json({ usdPrice: usd.toString(), targets });
  } catch (e) {
    res.status(500).json({ error: "Call failed, please try again soon." });
  }
}
