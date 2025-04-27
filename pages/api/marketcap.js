import { ethers, isAddress } from 'ethers';

const RPC = 'https://base-mainnet.g.alchemy.com/v2/nPrb1P3OYnpEcuCW-gZ9HI5ZfVHsqbhC';
const TARGETS = [0.1, 1, 10];
const SAFETY_LIST = { degen: '0x7d00d30269fc62ab5fab54418feedbdc71fdb25f' };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { input = '' } = req.body;
  let address = '';
  if (input.startsWith('0x') && isAddress(input)) {
    address = input;
  } else {
    try {
      address = await resolveAddressFromTicker(input);
    } catch {
      return res.status(400).json({ error: 'Invalid address or ticker. Please double-check.' });
    }
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC);
    const abi = ['function totalSupply() view returns (uint256)', 'function decimals() view returns (uint8)'];
    const token = new ethers.Contract(address, abi, provider);
    const [raw, decimals] = await Promise.all([token.totalSupply(), token.decimals()]);
    const supply = parseFloat(ethers.formatUnits(raw, decimals));
    const usd = await getPrice(address);
    const one = TARGETS.find(p => p===1);
    const marketCap1 = usd ? (supply*one).toFixed(0) : null;
    res.status(200).json({ usdPrice: usd.toFixed(6), marketCap1 });
  } catch {
    res.status(500).json({ error: 'Call failed. Try again later.' });
  }
}

async function getPrice(addr) {
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addr}`);
    if (!r.ok) return 0;
    const j = await r.json();
    return parseFloat(j.pairs?.[0]?.priceUsd || '0') || 0;
  } catch {
    return 0;
  }
}

async function resolveAddressFromTicker(input) {
  const ticker = input.toLowerCase().replace(/^\$/, '');
  // CoinGecko search
  const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${ticker}`);
  if (searchRes.ok) {
    const { coins } = await searchRes.json();
    const coin = coins.find(c => c.symbol.toLowerCase() === ticker);
    if (coin?.id) {
      const detailsRes = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}`);
      if (detailsRes.ok) {
        const details = await detailsRes.json();
        const platforms = details.platforms || {};
        const addr = platforms.base || Object.values(platforms).find(p => typeof p==='string' && p.startsWith('0x'));
        if (addr && isAddress(addr)) return addr;
      }
    }
  }
  // Safety list
  if (SAFETY_LIST[ticker]) return SAFETY_LIST[ticker];
  throw new Error('Ticker not found');
}
