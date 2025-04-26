import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function Home() {
  const [address, setAddress] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  return (
    <>
      <Head>
        <title>Base Dollar Targets</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 via-blue-800 to-purple-900 text-white">
        {/* App content will go here */}
        <div className="p-8 rounded-2xl bg-white/10 backdrop-blur-md shadow-xl max-w-lg w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Base Dollar Targets</h1>
          {/* Input, Buttons, Outputs */}
        </div>
      </div>
    </>
  );
}