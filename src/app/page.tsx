"use client";

import { useState, useEffect } from "react";
import Scene, { SceneId } from "@/components/Scene";
import HUD from "@/components/HUD";
import { CarId } from "@/data/cars";

export default function Home() {
  const [adUrl, setAdUrl] = useState<string | null>(null);
  const [isBidding, setIsBidding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);

  // Global Interactive States
  const [activeScene, setActiveScene] = useState<SceneId>('meadow');
  const [activeCar, setActiveCar] = useState<CarId>('sedan');

  // Stats for HUD display
  const [lastPrompt, setLastPrompt] = useState("");
  const [lastBidAmount, setLastBidAmount] = useState("");

  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (hasStarted) return;
    const start = () => setHasStarted(true);
    window.addEventListener('keydown', start);
    window.addEventListener('pointerdown', start);
    return () => {
      window.removeEventListener('keydown', start);
      window.removeEventListener('pointerdown', start);
    };
  }, [hasStarted]);

  const handleBidSubmit = async (prompt: string, bidAmount: string) => {
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
        setLastPrompt(prompt);
        setLastBidAmount(bidAmount);
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
    <div className="arcade-shell">
      {/* 3D Game Environment in the background */}
      <Scene 
        currentAdUrl={adUrl} 
        isBidding={isBidding || !hasStarted} 
        setIsBidding={setIsBidding} 
        activeScene={activeScene}
        activeCar={activeCar}
        lastPrompt={lastPrompt}
        lastBidAmount={lastBidAmount}
      />

      {/* Arcade UI Overlay */}
      {hudVisible ? (
        <HUD 
          currentAdUrl={adUrl}
          onHide={() => setHudVisible(false)}
          isBidding={isBidding}
          setIsBidding={setIsBidding}
          onBidSubmit={handleBidSubmit}
          isSubmitting={isSubmitting}
          lastPrompt={lastPrompt}
          lastBidAmount={lastBidAmount}
          activeScene={activeScene}
          activeCar={activeCar}
          onSceneChange={setActiveScene}
          onCarChange={setActiveCar}
        />
      ) : (
        <button 
          className="hud-hidden-chip" 
          onClick={() => setHudVisible(true)}
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
        >
          SHOW HUD
        </button>
      )}

      {/* Interaction Prompt when near Billboard */}
      {!isBidding && hasStarted && (
        <div className="pointer-events-none absolute bottom-32 w-full flex justify-center z-10" id="interaction-prompt" style={{ opacity: 0, transition: 'opacity 0.2s' }}>
          <div className="bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-md border border-white/20 animate-pulse text-lg font-bold shadow-2xl" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            Press <kbd className="bg-yellow-600 px-3 py-1 rounded mx-1 text-black">SPACE</kbd> to Bid
          </div>
        </div>
      )}

      {/* Start Screen Overlay */}
      {!hasStarted && (
        <div 
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-white" 
          style={{ pointerEvents: 'auto', cursor: 'pointer' }} 
          onClick={() => setHasStarted(true)}
        >
          <h1 className="text-8xl font-black mb-2 tracking-tighter text-[#efe0bd]">arcAd(e)</h1>
          <h2 className="text-3xl font-bold mb-16 text-[#dca24f] tracking-widest uppercase">Drive</h2>
          <div className="animate-pulse text-xl text-white/70 font-mono tracking-wider">
            Press any key to start
          </div>
        </div>
      )}
    </div>
  );
}
