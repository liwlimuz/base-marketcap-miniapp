import React, { useState, useEffect } from 'react';

export default function FeaturedPill() {
  const [featuredData, setFeaturedData] = useState(null);
  const featuredSymbol = 'DEGEN';
  const featuredContractAddress = '0x4ed4e862860bed51a9570b96d89af5e1b0efefed';

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/marketcap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractAddress: featuredContractAddress }),
        });
        const data = await res.json();
        setFeaturedData(data);
      } catch (e) {
        console.error('Failed to fetch featured data', e);
      }
    }
    fetchData();
  }, []);

  if (!featuredData) return null;

  return (
    <div className="transform scale-75 origin-center mb-8 p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-center mx-auto w-3/4">
      <img
        src="/degen-logo.png"
        alt={featuredSymbol}
        className="w-10 h-10 mx-auto mb-2 rounded-full"
      />
      <div className="text-xs text-gray-600">Featured</div>
      <div className="font-semibold text-sm">
        Featured ($DEGEN): Current MC ${Number(featuredData.currentMarketCap).toLocaleString()}
      </div>
    </div>
  );
}
