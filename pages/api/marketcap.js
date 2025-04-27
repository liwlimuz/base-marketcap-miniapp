import { ethers, isAddress } from "ethers";

const RPC = "https://base-mainnet.g.alchemy.com/v2/nPrb1P3OYnpEcuCW-gZ9HI5ZfVHsqbhC";
const TARGETS = [0.1, 1, 10];

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

async function resolveAddressFromTicker(ticker) {
  // 1) Search by ticker
  const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${ticker}`);
  if (!searchRes.ok) throw new Error("Please double-check the address or ticker and ensure it’s a valid Base token on the correct network.");
  const { coins } = await searchRes.json();
  const match = coins.find(c => c.symbol.toLowerCase() === ticker.toLowerCase());
  if (!match) throw new Error("Please double-check the address or ticker and ensure it’s a valid Base token on the correct network.");

  // 2) Fetch full coin details
  const detailRes = await fetch(`https://api.coingecko.com/api/v3/coins/${match.id}`);
  if (!detailRes.ok) throw new Error("Please double-check the address or ticker and ensure it’s a valid Base token on the correct network.");
  const details = await detailRes.json();

  // 3) Pull out the Base contract specifically
  const platforms = details.platforms || {};
  let address = platforms.base;
  
  // 4) Fallback to the first 0x… if “base” isn’t set
  if (!address) {
    address = Object.values(platforms).find(v => typeof v === "string" && v.startsWith("0x"));
  }
  if (!address) {
    throw new Error("Please double-check the address or ticker and ensure it’s a valid Base token on the correct network.");
  }
  return address;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  let { input } = req.body;
  if (!input) {
    return res.status(400).json({ error: "Please enter a contract address (0x…) or a ticker ($TICKER)." });
  }

  input = input.trim();
  let contractAddress = input;

  // If they started with “$”, treat it as a ticker
  if (contractAddress.startsWith("$")) {
    const ticker = contractAddress.slice(1);
    try {
      contractAddress = await resolveAddressFromTicker(ticker);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  // Now validate it’s a proper hex
  if (!isAddress(contractAddress)) {
    return res.status(400).json({
      error: "Please double-check the address or ticker and ensure it’s a valid Base token on the correct network."
    });
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC);
    const abi = [
      "function totalSupply() view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];
    const token = new ethers.Contract(contractAddress, abi, provider);
    const [raw, decimals] = await Promise.all([
      token.totalSupply(),
      token.decimals()
    ]);
    const supply = parseFloat(ethers.formatUnits(raw, decimals));
    const usd = await getPrice(contractAddress);

    const timesAway = usd ? (1 / usd).toFixed(2) : null;
    const targets = TARGETS.map(p => ({
      price: p.toString(),
      requiredMarketCap: (supply * p).toString(),
      timesAway: usd ? (p / usd).toFixed(2) : null
    }));

    return res.status(200).json({ usdPrice: usd.toString(), timesAway, targets });
  } catch {
    return res.status(500).json({ error: "Something went wrong fetching on-chain data." });
  }
}
