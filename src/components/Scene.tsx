"use client";

import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import React, { Suspense, useState, useEffect } from "react";
import * as THREE from "three";
import Car from "./Car";
import { CarId } from "../data/cars";
import RoadAndEnvironment, { SceneId } from "./RoadAndEnvironment";

export type { SceneId };

const atmosphere: Record<SceneId, {
  background: string
  fog: string
  sun: [number, number, number]
  turbidity: number
  rayleigh: number
  hemiSky: string
  hemiGround: string
  ambient: number
}> = {
  meadow: { background: '#a8c9d8', fog: '#a8c9d8', sun: [80, 32, -90], turbidity: 1.4, rayleigh: 1.8, hemiSky: '#d8f0ff', hemiGround: '#537247', ambient: 0.78 },
  alpine: { background: '#bfd1d6', fog: '#bfd1d6', sun: [72, 38, -80], turbidity: 1.15, rayleigh: 2.0, hemiSky: '#ecf7ff', hemiGround: '#506d5c', ambient: 0.82 },
  snow: { background: '#dce8ec', fog: '#dce8ec', sun: [42, 24, -75], turbidity: 1.8, rayleigh: 2.6, hemiSky: '#f4fbff', hemiGround: '#b9cacc', ambient: 1.0 },
  autumn: { background: '#c9b08d', fog: '#c9b08d', sun: [65, 22, -88], turbidity: 2.1, rayleigh: 2.2, hemiSky: '#ffe2b8', hemiGround: '#765636', ambient: 0.86 },
  coast: { background: '#a8d2de', fog: '#a8d2de', sun: [86, 28, -60], turbidity: 2.3, rayleigh: 1.9, hemiSky: '#daf7ff', hemiGround: '#4b7a73', ambient: 0.9 },
  desert: { background: '#d9c795', fog: '#d9c795', sun: [88, 36, -72], turbidity: 3.4, rayleigh: 1.8, hemiSky: '#fff1c9', hemiGround: '#8e6c3e', ambient: 0.88 },
  dusk: { background: '#d2a184', fog: '#d2a184', sun: [-70, 18, -90], turbidity: 1.8, rayleigh: 2.5, hemiSky: '#ffd5b3', hemiGround: '#46533c', ambient: 0.72 },
}

export default React.memo(function Scene({ 
  currentAdUrl, 
  isBidding, 
  setIsBidding,
  activeScene,
  activeCar,
  lastPrompt,
  lastBidAmount
}: { 
  currentAdUrl: string | null, 
  isBidding: boolean,
  setIsBidding: (val: boolean) => void,
  activeScene: SceneId,
  activeCar: CarId,
  lastPrompt?: string,
  lastBidAmount?: string
}) {
  const [canBid, setCanBid] = useState(false);
  const mood = atmosphere[activeScene];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && canBid && !isBidding) {
        setIsBidding(true);
      } else if (e.code === 'Escape' && isBidding) {
        setIsBidding(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canBid, isBidding, setIsBidding]);

  useEffect(() => {
    const el = document.getElementById('interaction-prompt');
    if (el) {
      el.style.opacity = (canBid && !isBidding) ? '1' : '0';
    }
  }, [canBid, isBidding]);

  return (
    <div className="absolute inset-0 z-0">
      <Canvas 
        camera={{ position: [0, 5, 10], fov: 58 }}
        dpr={[0.85, 1.15]} 
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={[mood.background]} />
        <fog attach="fog" args={[mood.fog, 130, 690]} />

        <Sky
          sunPosition={mood.sun}
          turbidity={mood.turbidity}
          rayleigh={mood.rayleigh}
          mieCoefficient={0.006}
          mieDirectionalG={0.72}
        />

        <ambientLight intensity={mood.ambient} />
        <hemisphereLight args={[mood.hemiSky, mood.hemiGround, 1.2]} />
        <directionalLight 
          position={[70, 100, -80]} 
          intensity={2.15}
        />
        
        <RoadAndEnvironment 
          textureUrl={currentAdUrl} 
          lastPrompt={lastPrompt}
          lastBidAmount={lastBidAmount}
          scene={activeScene} 
        />
        
        <Suspense fallback={null}>
          <Car 
            playing={!isBidding} 
            onNearBillboard={setCanBid}
            carId={activeCar}
          />
        </Suspense>
      </Canvas>
    </div>
  );
})
