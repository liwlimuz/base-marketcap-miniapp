import { ethers, isAddress } from "ethers";
const RPC="https://base-mainnet.g.alchemy.com/v2/nPrb1P3OYnpEcuCW-gZ9HI5ZfVHsqbhC";
const TARGETS=[0.1,1,10];
async function getPrice(addr){
 try{const r=await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addr}`);if(!r.ok)return 0;const j=await r.json();return parseFloat(j?.pairs?.[0]?.priceUsd||"0")||0;}catch{return 0;}
}
export default async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","*");
 if(req.method!=="POST")return res.status(405).json({error:"POST only"});
 const {contractAddress}=req.body;
 if(!contractAddress||!isAddress(contractAddress))return res.status(400).json({error:"Invalid address"});
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