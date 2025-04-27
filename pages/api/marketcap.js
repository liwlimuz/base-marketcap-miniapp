import { ethers, isAddress } from "ethers";

const RPC = "https://base-mainnet.g.alchemy.com/v2/nPrb1P3OYnpEcuCW-gZ9HI5ZfVHsqbhC";
const TARGETS = [0.1, 1, 10];

async function fetchUsdPrice(addr) {
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addr}`);
    if (!r.ok) return 0;
    const j = await r.json();
    return parseFloat(j?.pairs?.[0]?.priceUsd || "0") || 0;
  } catch {
    return 0;
  }
}

async function fetchAthData(addr) {
  try {
    const r = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${addr}`);
    if (!r.ok) return { athPrice: 0, athMarketCap: 0 };
    const j = await r.json();
    return {
      athPrice: j.market_data?.ath?.usd || 0,
      athMarketCap: j.market_data?.ath?.market_cap?.usd || 0
    };
  } catch {
    return { athPrice: 0, athMarketCap: 0 };
  }
}

async function resolveTicker(ticker) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${ticker}`);
    if (!res.ok) return null;
    const { coins } = await res.json();
    const lower = ticker.toLowerCase();
    // find matching and on Base
    for (let coin of coins) {
      if (coin.symbol.toLowerCase() === lower && coin.platforms?.base) {
        return coin.platforms.base;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }
  const { ticker, contractAddress } = req.body;
  let address = contractAddress;
  if (!address && ticker) {
    address = await resolveTicker(ticker);
  }
  if (!address || !isAddress(address)) {
    return res.status(400).json({ error: "Invalid address or ticker – please double-check and ensure you're on the Base network." });
  }
  try {
    const provider = new ethers.JsonRpcProvider(RPC);
    const abi = ["function totalSupply() view returns (uint256)", "function decimals() view returns (uint8)"];
    const token = new ethers.Contract(address, abi, provider);
    const [raw, decimals] = await Promise.all([token.totalSupply(), token.decimals()]);
    const supply = parseFloat(ethers.formatUnits(raw, decimals));
    const usd = await fetchUsdPrice(address);
    const oneTarget = TARGETS.find(p => p === 1);
    const targets = TARGETS.map(p => ({
      price: p.toString(),
      requiredMarketCap: (supply * p).toString(),
      timesAway: usd ? (p / usd).toFixed(2) : null
    }));
    res.status(200).json({ usdPrice: usd.toString(), timesAway: usd ? (1 / usd).toFixed(2) : null, targets, athMcData: await fetchAthData(address) });
  } catch (e) {
    res.status(500).json({ error: "Call failed" });
  }
}