"use client";

import { useState } from "react";
import Scene from "@/components/Scene";

export default function Home() {
  const [adUrl, setAdUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [isBidding, setIsBidding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
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
        setIsBidding(false); 
      } else {
        alert("Failed to place bid: " + data.error);
      }
    } catch (error) {
      alert("Error placing bid.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Game Environment in the background */}
      <Scene currentAdUrl={adUrl} isBidding={isBidding} setIsBidding={setIsBidding} />

      {/* HUD overlay (Only visible when interacting with the billboard) */}
      {isBidding && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-700 shadow-2xl max-w-md w-full relative">
            <button 
              onClick={() => setIsBidding(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xl font-bold"
            >
              ✕
            </button>
            <h1 className="text-3xl font-bold text-white mb-2 text-center">AdVerse Auction</h1>
            <p className="text-zinc-400 text-center mb-6">Submit your prompt and bid to take over the board!</p>
            
            <form onSubmit={handleBid} className="space-y-4">
              <div>
                <label className="block text-zinc-300 text-sm mb-1">Ad Prompt</label>
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A neon cyberpunk sneaker" 
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
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Generating Ad..." : "Place Bid & Generate"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Instructions Overlay (top left) */}
      {!isBidding && (
        <div className="absolute top-4 left-4 z-10 pointer-events-none text-white/50 text-sm">
          <p className="font-bold mb-1">CONTROLS</p>
          <p>W / Up: Accelerate</p>
          <p>S / Down: Brake</p>
          <p>A / Left: Steer Left</p>
          <p>D / Right: Steer Right</p>
        </div>
      )}
    </main>
  );
}
