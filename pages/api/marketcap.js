import { ethers, isAddress } from "ethers";

const BASE_RPC = "https://base-mainnet.g.alchemy.com/v2/nPrb1P3OYnpEcuCW-gZ9HI5ZfVHsqbhC";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  console.log("🟡 /api/marketcap called");

  if (req.method !== "POST") {
    console.log("🔴 Not a POST request");
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  try {
    const { contractAddress } = req.body;
    console.log("📬 Received contract:", contractAddress);

    if (!contractAddress || !isAddress(contractAddress)) {
      console.log("❌ Invalid address");
      return res.status(400).json({ error: "Invalid or missing contract address" });
    }

    const provider = new ethers.JsonRpcProvider(BASE_RPC);
    console.log("✅ Connected to Base via Alchemy");

    const blockNumber = await provider.getBlockNumber();
    console.log("⛓️ Current block:", blockNumber);

    const abi = [
      "function totalSupply() view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];
    const token = new ethers.Contract(contractAddress, abi, provider);

    const [rawSupply, decimals] = await Promise.all([
      token.totalSupply(),
      token.decimals()
    ]);

    console.log("🧮 totalSupply and decimals fetched");

    const circulatingSupply = Number(ethers.formatUnits(rawSupply, decimals));
    const requiredMarketCap = circulatingSupply * 1;

    console.log("✅ Calculation complete");

    return res.status(200).json({
      success: true,
      requiredMarketCap,
      circulatingSupply,
      decimals,
      blockNumber
    });

  } catch (err) {
    console.error("🔥 Error in backend:", err);
    return res.status(500).json({
      error: "Contract call failed",
      details: err.message || err.toString()
    });
  }
}