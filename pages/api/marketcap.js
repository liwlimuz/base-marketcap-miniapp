import { ethers, isAddress } from "ethers";

const RPC = "https://base-mainnet.g.alchemy.com/v2/nPrb1P3OYnpEcuCW-gZ9HI5ZfVHsqbhC";
const TARGETS = [0.1, 1, 10, 100];

async function fetchUsdPrice(address) {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
    const res = await fetch(url);
    if (!res.ok) return 0;
    const data = await res.json();
    return parseFloat(data?.pairs?.[0]?.priceUsd ?? "0") || 0;
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
    return res.status(400).json({ error: "Invalid address" });
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC);
    const abi = [
      "function totalSupply() view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];
    const token = new ethers.Contract(contractAddress, abi, provider);
    const [rawSupply, decimals] = await Promise.all([
      token.totalSupply(),
      token.decimals()
    ]);
    const circulatingSupply = parseFloat(ethers.formatUnits(rawSupply, decimals));

    const usdPrice = await fetchUsdPrice(contractAddress);

    const targets = TARGETS.map((p) => {
      const requiredMarketCap = (circulatingSupply * p).toString();
      const timesAway = usdPrice ? (p / usdPrice).toFixed(2) : null;
      return {
        price: p.toString(),
        requiredMarketCap,
        timesAway,
      };
    });

    return res.status(200).json({
      success: true,
      usdPrice: usdPrice.toString(),
      targets,
    });
  } catch (error) {
    return res.status(500).json({ error: "Contract call failed", details: error.message });
  }
}
