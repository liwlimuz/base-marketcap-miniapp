
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
  } catch { return 0; }
}

function cleanTicker(raw = "") {
  return raw.trim().replace(/^\$/, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

async function tryDexScreener(ticker) {
  const resp = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${ticker}&chain=base`);
  if (!resp.ok) return null;
  const data = await resp.json();
  const match = data.pairs?.find(p => p.baseToken?.symbol?.toLowerCase() === ticker);
  return match?.baseToken?.address || null;
}

async function tryCoinGecko(ticker) {
  const search = await fetch(`https://api.coingecko.com/api/v3/search?query=${ticker}`);
  if (!search.ok) return null;
  const { coins } = await search.json();
  const hit = coins.find(c => c.symbol.toLowerCase() === ticker);
  if (!hit) return null;
  const details = await fetch(`https://api.coingecko.com/api/v3/coins/${hit.id}`).then(r => r.json());
  const platforms = details.platforms || {};
  return platforms.base || Object.values(platforms).find(v => typeof v === "string" && v.startsWith("0x"));
}

const hardcoded = {
  degen: "0x4200000000000000000000000000000000000006",
};

async function resolveAddress(query) {
  const t = cleanTicker(query);
  if (!t) throw new Error("Please enter a valid ticker or address.");
  if (hardcoded[t]) return hardcoded[t];
  const fromDex = await tryDexScreener(t);
  if (fromDex && isValidAddress(fromDex)) return fromDex;
  const fromCg = await tryCoinGecko(t);
  if (fromCg && isValidAddress(fromCg)) return fromCg;
  throw new Error("Token not found on Base. Double‑check the ticker or paste its contract address.");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { input = "" } = req.body;
  let address = input.trim();

  if (!isValidAddress(address)) {
    try { address = await resolveAddress(address); }
    catch (e) { return res.status(400).json({ error: e.message }); }
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
    res.status(500).json({ error: "Call failed, please try again later." });
  }
}
