export default async function handler(req,res){
  const {address}=req.query;
  if(!address||!address.startsWith('0x')) return res.status(400).json({error:'Invalid address'});
  try{
    const [usdPrice,ath]=await Promise.all([price(address),athData(address)]);
    const targets=[
      {price:'0.1',timesAway:usdPrice?(0.1/usdPrice).toFixed(2):0,requiredMarketCap:0},
      {price:'1',timesAway:usdPrice?(1/usdPrice).toFixed(2):0,requiredMarketCap:0},
      {price:'10',timesAway:usdPrice?(10/usdPrice).toFixed(2):0,requiredMarketCap:0},
      {price:'100',timesAway:usdPrice?(100/usdPrice).toFixed(2):0,requiredMarketCap:0}
    ];
    res.status(200).json({usdPrice,targets,athMcData:ath});
  }catch(e){res.status(500).json({error:e.message});}
}

async function price(addr){
  try{
    const r=await fetch('https://api.dexscreener.com/latest/dex/tokens/'+addr);
    if(!r.ok) return 0;
    const j=await r.json();
    return parseFloat(j.pairs[0].priceUsd)||0;
  }catch{return 0;}
}
async function athData(addr){
  try{
    const r=await fetch('https://api.coingecko.com/api/v3/coins/ethereum/contract/'+addr);
    if(!r.ok) return {athPrice:0,athMarketCap:0};
    const j=await r.json();
    return {athPrice:j.market_data?.ath?.usd||0,athMarketCap:j.market_data?.ath?.market_cap?.usd||0};
  }catch{return {athPrice:0,athMarketCap:0};}
}