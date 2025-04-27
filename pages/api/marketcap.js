import { ethers, isAddress } from "ethers";

const RPC = "https://base-mainnet.g.alchemy.com/v2/nPrb1P3OYnpEcuCW-gZ9HI5ZfVHsqbhC";
const TARGETS = [0.1, 1, 10];

async function getPrice(addr) {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addr}`);
    if (!res.ok) return 0;
    const json = await res.json();
    return parseFloat(json.pairs[0].priceUsd) || 0;
  } catch {
    return 0;
  }
}

async function resolveAddressFromTicker(ticker) {
  const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${ticker}`);
  if (!searchRes.ok) throw new Error('Double-check the address or ticker; it should be a valid Base token.');
  const { coins } = await searchRes.json();
  const match = coins.find(c => c.symbol.toLowerCase() === ticker.toLowerCase());
  if (!match) throw new Error('Double-check the address or ticker; it should be a valid Base token.');
  const detailRes = await fetch(`https://api.coingecko.com/api/v3/coins/${match.id}`);
  if (!detailRes.ok) throw new Error('Double-check the address or ticker; it should be a valid Base token.');
  const details = await detailRes.json();
  const platforms = details.platforms || {};
  // Try Base platform key
  let address = platforms.base;
  if (!address) {
    // fallback to any platform address starting with 0x
    address = Object.values(platforms).find(v => typeof v === 'string' && v.startsWith('0x'));
  }
  if (!address) throw new Error('Double-check the address or ticker; it should be a valid Base token.');
  return address;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }
  const { input, contractAddress } = req.body;
  let address = contractAddress || input;
  // if input is ticker (not hex), resolve to address
  if (!address || !(address.startsWith("0x") && isAddress(address))) {
    // treat input as ticker
    try {
      address = await resolveAddressFromTicker(input);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }
  if (!address || !isAddress(address)) {
    return res.status(400).json({ error: "Double-check the address or ticker; it should be a valid Base token." });
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC);
    const abi = [
      "function totalSupply() view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];
    const token = new ethers.Contract(address, abi, provider);
    const [raw, decimals] = await Promise.all([token.totalSupply(), token.decimals()]);
    const supply = parseFloat(ethers.formatUnits(raw, decimals));
    const usd = await getPrice(address);
    const targets = TARGETS.map(p => ({
      price: p.toString(),
      requiredMarketCap: (supply * p).toString(),
      timesAway: usd ? (p / usd).toFixed(2) : null
    }));
    return res.status(200).json({ usdPrice: usd.toString(), targets });
  } catch (e) {
    return res.status(500).json({ error: "Call failed: " + e.message });
  }
}
