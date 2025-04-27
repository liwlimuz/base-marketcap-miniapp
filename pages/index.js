import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') calculate();
  };

  const calculate = async () => {
    setError('');
    setData(null);
    try {
      const res = await fetch('/api/marketcap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputValue.trim() })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unknown error');
      setData(json);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <Head>
        <title>Base Dollar MC Alpha v0.7</title>
      </Head>
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6">
          <h1 className="text-center text-3xl font-bold text-purple-800 mb-4">Base Dollar MC Alpha</h1>
          <input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste address or enter $TICKER"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 mb-3"
          />
          <button
            onClick={calculate}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Calculate
          </button>
          {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
          {data && (
            <div className="mt-6 space-y-4">
              <p className="text-lg font-medium text-center">Current Price: <span className="font-mono">${data.usdPrice}</span></p>
              <p className="text-lg font-medium text-center">$1 Cap: <span className="font-mono">${data.marketCap1}</span></p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
