import { ethers } from "ethers";

const BASE_RPC = "https://base-mainnet.g.alchemy.com/v2/nPrb1P3OYnpEcuCW-gZ9HI5ZfVHsqbhC";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { contractAddress } = req.body;

  if (!contractAddress || !ethers.utils.isAddress(contractAddress)) {
    return res.status(400).json({ error: "Invalid or missing contract address" });
  }

  try {
    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC);
    const blockNumber = await provider.getBlockNumber(); // for testing

    const abi = [
      "function totalSupply() view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];
    const token = new ethers.Contract(contractAddress, abi, provider);

    const [rawSupply, decimals] = await Promise.all([
      token.totalSupply(),
      token.decimals()
    ]);

    const circulatingSupply = Number(ethers.utils.formatUnits(rawSupply, decimals));
    const requiredMarketCap = circulatingSupply * 1;

    return res.status(200).json({
      success: true,
      requiredMarketCap,
      circulatingSupply,
      decimals,
      blockNumber
    });

  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({
      error: "Contract call failed",
      details: err.message || err.toString()
    });
  }
}