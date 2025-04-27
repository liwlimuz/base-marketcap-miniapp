import { ethers, isAddress } from "ethers";
const RPC="https://base-mainnet.g.alchemy.com/v2/nPrb1P3OYnpEcuCW-gZ9HI5ZfVHsqbhC";
const TARGETS=[0.1,1,10];
async function getPrice(addr){
 try{const r=await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addr}`);if(!r.ok)return 0;const j=await r.json();return parseFloat(j?.pairs?.[0]?.priceUsd||"0")||0;}catch{return 0;}
}

async function resolveAddressFromTicker(ticker) {
  // 1) Try DexScreener search on Base (chainId 8453)
  try {
    const ds = await fetch(`https://api.dexscreener.com/latest/dex/search?query=${ticker}`);
    if (ds.ok) {
      const j = await ds.json();
      const pair = j.pairs.find(p => p.chainId === 8453);
      if (pair) {
        const sym = ticker.toLowerCase();
        if (pair.baseToken.symbol.toLowerCase() === sym) return pair.baseToken.address;
        if (pair.quoteToken.symbol.toLowerCase() === sym) return pair.quoteToken.address;
      }
    }
  } catch {}
  // 2) Fallback to Coingecko if DexScreener fails
  const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${ticker}`);
  if (!searchRes.ok) throw new Error('Please double-check the address or ticker and ensure it’s a valid Base token on the correct network.');
  const { coins } = await searchRes.json();
  const match = coins.find(c => c.symbol.toLowerCase() === ticker.toLowerCase());
  if (!match) throw new Error('Please double-check the address or ticker and ensure it’s a valid Base token on the correct network.');
  const detailRes = await fetch(`https://api.coingecko.com/api/v3/coins/${match.id}`);
  if (!detailRes.ok) throw new Error('Please double-check the address or ticker and ensure it’s a valid Base token on the correct network.');
  const details = await detailRes.json();
  const platforms = details.platforms || {};
  const address = platforms.base;
  if (!address) throw new Error('Please double-check the address or ticker and ensure it’s a valid Base token on the correct network.');
  return address;
}


export default async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","*");
 if(req.method!=="POST")return res.status(405).json({error:"POST only"});
 const {contractAddress}=req.body;
 if(!contractAddress||!isAddress(contractAddress))return res.status(400).json({ error: 'Please double-check the address or ticker and ensure it’s a valid Base token on the correct network.' });
 try{
  const provider=new ethers.JsonRpcProvider(RPC);
  const abi=["function totalSupply() view returns (uint256)","function decimals() view returns (uint8)"];
  const token=new ethers.Contract(contractAddress,abi,provider);
  const [raw,decimals]=await Promise.all([token.totalSupply(),token.decimals()]);
  const supply=parseFloat(ethers.formatUnits(raw,decimals));
  const usd=await getPrice(contractAddress);
  const timesAway=usd?(1/usd).toFixed(2):null;
  const targets=TARGETS.map(p=>({price:p.toString(),requiredMarketCap:(supply*p).toString(),timesAway:usd?(p/usd).toFixed(2):null}));
  res.status(200).json({usdPrice:usd.toString(),timesAway,targets});
 }catch{res.status(500).json({error:"call failed"});}
}