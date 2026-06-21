"use client";

import { useState } from "react";
import Scene from "@/components/Scene";
import HUD from "@/components/HUD";
import { DrivingTelemetry } from "@/components/Car";

export default function Home() {
  const [adUrl, setAdUrl] = useState<string | null>(null);
  const [isBidding, setIsBidding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [telemetry, setTelemetry] = useState<DrivingTelemetry>({ speed: 0, steering: 0 });
  const [hudVisible, setHudVisible] = useState(true);

  // Stats for HUD display
  const [lastPrompt, setLastPrompt] = useState("");
  const [lastBidAmount, setLastBidAmount] = useState("");

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
        isBidding={isBidding} 
        setIsBidding={setIsBidding} 
        onTelemetry={setTelemetry}
      />

      {/* Arcade UI Overlay */}
      {hudVisible ? (
        <HUD 
          currentAdUrl={adUrl}
          telemetry={telemetry}
          onHide={() => setHudVisible(false)}
          isBidding={isBidding}
          setIsBidding={setIsBidding}
          onBidSubmit={handleBidSubmit}
          isSubmitting={isSubmitting}
          lastPrompt={lastPrompt}
          lastBidAmount={lastBidAmount}
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
      {!isBidding && (
        <div className="pointer-events-none absolute bottom-32 w-full flex justify-center z-10" id="interaction-prompt" style={{ opacity: 0, transition: 'opacity 0.2s' }}>
          <div className="bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-md border border-white/20 animate-pulse text-lg font-bold shadow-2xl" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            Press <kbd className="bg-yellow-600 px-3 py-1 rounded mx-1 text-black">SPACE</kbd> to Bid
          </div>
        </div>
      )}
    </div>
  );
}
