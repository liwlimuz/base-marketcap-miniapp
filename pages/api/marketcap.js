export default async function handler(req, res) {
  const { address } = req.query;
  console.log('API handler called with address:', address);

  try {
    console.log('Fetching USD price from DexScreener');
    const [usdPrice, athData] = await Promise.all([
      fetchUsdPrice(address),
      fetchAthData(address),
    ]);
    console.log('Fetched usdPrice:', usdPrice, 'athData:', athData);

    // Placeholder targets
    const targets = [
      { price: '1', timesAway: (usdPrice ? (1 / usdPrice).toFixed(2) : 0), requiredMarketCap: 0 },
    ];

    res.status(200).json({ usdPrice, targets, athMcData: athData });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
}

async function fetchUsdPrice(address) {
  const url = 'https://api.dexscreener.com/latest/dex/tokens/' + address;
  console.log('GET', url);
  try {
    const res = await fetch(url);
    console.log('DexScreener status:', res.status);
    if (!res.ok) return 0;
    const json = await res.json();
    console.log('DexScreener JSON:', json);
    return parseFloat(json.pairs[0].priceUsd) || 0;
  } catch (e) {
    console.error('DexScreener fetch error:', e);
    return 0;
  }
}

async function fetchAthData(address) {
  const url = 'https://api.coingecko.com/api/v3/coins/ethereum/contract/' + address;
  console.log('GET', url);
  try {
    const res = await fetch(url);
    console.log('CoinGecko status:', res.status);
    if (!res.ok) return { athPrice: 0, athMarketCap: 0 };
    const json = await res.json();
    console.log('CoinGecko JSON:', json.market_data?.ath);
    return {
      athPrice: json.market_data?.ath?.usd || 0,
      athMarketCap: json.market_data?.ath?.market_cap?.usd || 0,
    };
  } catch (e) {
    console.error('CoinGecko fetch error:', e);
    return { athPrice: 0, athMarketCap: 0 };
  }
}