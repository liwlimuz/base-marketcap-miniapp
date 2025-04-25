import { ethers, isAddress } from "ethers";

const RPC_URL = "https://base-mainnet.g.alchemy.com/v2/nPrb1P3OYnpEcuCW-gZ9HI5ZfVHsqbhC";
const TARGETS = [0.1, 1, 10, 100];
const CACHE_TTL = 60000; // 60 seconds

const priceCache = {};

async function fetchUsdPrice(address) {
  const now = Date.now();
  if (priceCache[address] && now - priceCache[address].ts < CACHE_TTL) {
    return priceCache[address].price;
  }
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
    if (!res.ok) return 0;
    const json = await res.json();
    const price = parseFloat(json?.pairs?.[0]?.priceUsd || "0") || 0;
    priceCache[address] = { price, ts: now };
    return price;
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
    return res.status(400).json({ error: "Invalid contract address. Please enter a valid Base token contract." });
  }
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const abi = [
      "function totalSupply() view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];
    const token = new ethers.Contract(contractAddress, abi, provider);
    const [rawSupply, decimals] = await Promise.all([token.totalSupply(), token.decimals()]);
    const supply = parseFloat(ethers.formatUnits(rawSupply, decimals));
    const usdPrice = await fetchUsdPrice(contractAddress);

    const targets = TARGETS.map((p) => {
      const requiredMarketCap = (supply * p).toString();
      const timesAway = usdPrice ? (p / usdPrice).toFixed(2) : null;
      return { price: p.toString(), requiredMarketCap, timesAway };
    });

    const priceError = usdPrice === 0 
      ? "Couldn’t fetch price (DexScreener might not track this token yet)." 
      : null;

    return res.status(200).json({
      success: true,
      usdPrice: usdPrice.toString(),
      priceError,
      targets
    });
  } catch (err) {
    return res.status(500).json({ error: "Not an ERC-20: this contract doesn’t expose totalSupply()." });
  }
}