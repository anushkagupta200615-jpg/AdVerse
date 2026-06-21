"use client";

import { Canvas } from "@react-three/fiber";
import { Sky, useTexture } from "@react-three/drei";
import { Suspense, useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import Car, { DrivingTelemetry } from "./Car";
import { getRoadFrame, roadLength, roadWidth } from "../utils/roadCurve";
import { CarId } from "../data/cars";

export type SceneId = 'meadow' | 'alpine' | 'snow' | 'autumn' | 'coast' | 'desert' | 'dusk'

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

const BILLBOARD_DISTANCE = 300;

function BillboardScreen({ url }: { url: string }) {
  const texture = useTexture(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh position={[0, 0, 0.1]}>
      <planeGeometry args={[8, 4]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

function FallbackScreen() {
  return (
    <mesh position={[0, 0, 0.1]}>
      <planeGeometry args={[8, 4]} />
      <meshBasicMaterial color="#333" />
    </mesh>
  );
}

function Billboard({ textureUrl }: { textureUrl: string | null }) {
  const frame = getRoadFrame(BILLBOARD_DISTANCE);
  
  // Position billboard to the side of the road
  const offset = frame.right.clone().multiplyScalar(roadWidth * 1.5);
  const position = frame.point.clone().add(offset).add(frame.normal.clone().multiplyScalar(2));
  
  // Face the oncoming road
  const forwardQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), frame.tangent);
  const yaw = new THREE.Quaternion().setFromAxisAngle(frame.normal, Math.PI / 4);
  const rotation = forwardQuat.multiply(yaw);

  return (
    <group position={position} quaternion={rotation}>
      {/* Stand */}
      <mesh position={[0, -2, 0]}>
        <boxGeometry args={[0.5, 4, 0.5]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      
      {/* Screen */}
      <Suspense fallback={<FallbackScreen />}>
        {textureUrl ? <BillboardScreen url={textureUrl} /> : <FallbackScreen />}
      </Suspense>
      
      {/* Frame back */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[8.4, 4.4, 0.1]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}

function Road() {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = Math.floor(roadLength / 5);
    for (let i = 0; i <= segments; i++) {
      const distance = (i / segments) * roadLength;
      points.push(getRoadFrame(distance).point);
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, segments, roadWidth, 8, true);
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#3a3a40" roughness={0.9} />
    </mesh>
  );
}

function Ground({ color }: { color: string }) {
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10000, 10000]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

export default function Scene({ 
  currentAdUrl, 
  isBidding, 
  setIsBidding,
  onTelemetry,
  activeScene,
  activeCar
}: { 
  currentAdUrl: string | null, 
  isBidding: boolean,
  setIsBidding: (val: boolean) => void,
  onTelemetry: (telemetry: DrivingTelemetry) => void,
  activeScene: SceneId,
  activeCar: CarId
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
        
        <Ground color={mood.hemiGround} />
        <Road />
        <Billboard textureUrl={currentAdUrl} />
        
        <Suspense fallback={null}>
          <Car 
            playing={!isBidding} 
            billboardDistance={BILLBOARD_DISTANCE}
            onNearBillboard={setCanBid}
            onTelemetry={onTelemetry}
            carId={activeCar}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
