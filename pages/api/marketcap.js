export default async function handler(req, res) {
  const { address } = req.query;
  try {
    const [usdPrice, athData] = await Promise.all([
      fetchUsdPrice(address),
      fetchAthData(address)
    ]);

    // TODO: replace with real logic for computing targets based on total supply
    const targets = [
      { price: '0.1', timesAway: (usdPrice ? (0.1 / usdPrice).toFixed(2) : 0), requiredMarketCap: 0 },
      { price: '1', timesAway: (usdPrice ? (1 / usdPrice).toFixed(2) : 0), requiredMarketCap: 0 },
      { price: '10', timesAway: (usdPrice ? (10 / usdPrice).toFixed(2) : 0), requiredMarketCap: 0 }
    ];

    res.status(200).json({ usdPrice, targets, athMcData: athData });
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

async function fetchAthData(address) {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/ethereum/contract/' + address
    );
    if (!res.ok) return { athPrice: 0, athMarketCap: 0 };
    const json = await res.json();
    return {
      athPrice: json.market_data?.ath?.usd || 0,
      athMarketCap: json.market_data?.ath?.market_cap?.usd || 0
    };
  } catch {
    return { athPrice: 0, athMarketCap: 0 };
  }
}