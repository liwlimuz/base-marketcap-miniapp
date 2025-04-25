export default async function handler(req, res) {
  const { address } = req.query;
  try {
    const usdPrice = await fetchUsdPrice(address);
    // TODO: add logic to compute targets and athMcData
    res.status(200).json({ usdPrice, targets: [], athMcData: {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function fetchUsdPrice(address) {
  try {
    const res = await fetch('https://api.dexscreener.com/latest/dex/tokens/' + address);
    if (!res.ok) return 0;
    const json = await res.json();
    return parseFloat(json.pairs[0].priceUsd) || 0;
  } catch {
    return 0;
  }
}