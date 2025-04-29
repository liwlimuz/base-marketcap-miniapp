import React, { useState, useEffect } from 'react';
import FeaturedPill from '../components/FeaturedPill';
import Head from 'next/head';
import { motion } from 'framer-motion';

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [priceInfo, setPriceInfo] = useState('');
  const [marketCap1, setMarketCap1] = useState(null);
  const [targetsData, setTargetsData] = useState([]);

  const calculate = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = inputValue.startsWith('$')
        ? { ticker: inputValue.trim().slice(1) }
        : { contractAddress: inputValue.trim() };
      const res = await fetch('/api/marketcap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.currentMarketCap) {
        setPriceInfo(`Current MC: $${Number(data.currentMarketCap).toLocaleString()}`);
      }
      const one = data.targets?.find(t => t.price === '1');
      if (one) setMarketCap1(one.requiredMarketCap);
      if (data.targets) setTargetsData(data.targets);
    } catch (e) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Base(d) Dollar Targets</title>
      </Head>
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-[#004CFF] to-[#7A5CFF]"
      >
        <FeaturedPill />

        <div className="w-full sm:max-w-[450px] md:max-w-[600px] bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6 md:p-8">
          <h1 className="font-poppins text-[#8E2DE2] text-3xl md:text-4xl font-black tracking-wider text-center mb-4">
            Base(d) Dollar Targets
          </h1>
          <input
            placeholder="Paste 0x… or $TICKER"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8E2DE2] text-sm bg-white/70 mb-3"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
          />
          <button
            onClick={calculate}
            disabled={loading}
            className="w-full bg-[#8E2DE2] text-black py-2 rounded-full transition-shadow hover:shadow-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none font-semibold"
          >
            Calculate
          </button>

          {marketCap1 && (
            <div className="font-semibold bg-gradient-to-r from-[#004CFF] via-[#7A5CFF] to-[#4A00E0] bg-clip-text text-transparent drop-shadow-lg mt-4 text-base text-center whitespace-nowrap overflow-hidden text-ellipsis">
              Necessary MC for $1/coin: ${Number(marketCap1).toLocaleString()}
            </div>
          )}
          {priceInfo && (
            <div className="text-black text-center text-lg sm:text-xl mt-2 font-sans">
              {priceInfo}
            </div>
          )}
          {error && (
            <div className="text-red-500 text-center mt-2">
              {error}
            </div>
          )}

          {targetsData.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {targetsData.map(t => (
                <div key={t.price} className="bg-indigo-50 border border-indigo-200 rounded-xl p-2 text-center transition transform hover:scale-105">
                  <div className="font-semibold bg-gradient-to-r from-[#004CFF] via-[#7A5CFF] to-[#4A00E0] bg-clip-text text-transparent">
                    $ {t.price}
                  </div>
                  <div className="text-xs font-sans text-gray-900">
                    ×{t.timesAway} away from ${t.price}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.main>
    </>
  );
}
