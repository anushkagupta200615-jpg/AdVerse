"use client";

import { useState } from "react";
import Scene from "@/components/Scene";

export default function Home() {
  const [adUrl, setAdUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [isBidding, setIsBidding] = useState(false);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBidding(true);
    
    try {
      const response = await fetch("/api/auction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, bidAmount })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAdUrl(data.imageUrl);
        setPrompt("");
        setBidAmount("");
      } else {
        alert("Failed to place bid: " + data.error);
      }
    } catch (error) {
      alert("Error placing bid.");
    } finally {
      setIsBidding(false);
    }
  };

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Environment in the background */}
      <Scene currentAdUrl={adUrl} />

      {/* HUD overlay */}
      <div className="absolute bottom-0 left-0 w-full p-8 z-10 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
        <div className="bg-zinc-900/90 backdrop-blur-md p-6 rounded-2xl border border-zinc-700 shadow-2xl max-w-xl w-full">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">AdVerse Auction</h1>
          <p className="text-zinc-400 text-center mb-6">Bid for the current billboard space!</p>
          
          <form onSubmit={handleBid} className="space-y-4">
            <div>
              <label className="block text-zinc-300 text-sm mb-1">Ad Prompt</label>
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A futuristic neon sneaker ad" 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-zinc-300 text-sm mb-1">Bid Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-zinc-400">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="0.00" 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isBidding}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {isBidding ? "Submitting Bid..." : "Place Bid"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
