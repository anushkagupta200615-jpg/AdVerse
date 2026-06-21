"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, useTexture } from "@react-three/drei";
import { Suspense, useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import Car from "./Car";
import { getRoadFrame, roadLength, roadWidth } from "../utils/roadCurve";

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
      <meshStandardMaterial color="#222" roughness={0.9} />
    </mesh>
  );
}

export default function Scene({ 
  currentAdUrl, 
  isBidding, 
  setIsBidding 
}: { 
  currentAdUrl: string | null, 
  isBidding: boolean,
  setIsBidding: (val: boolean) => void 
}) {
  const [canBid, setCanBid] = useState(false);

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

  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
        <Suspense fallback={null}>
          <Environment preset="night" background blur={0.5} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 20, 10]} intensity={1.5} />
          
          <Road />
          <Billboard textureUrl={currentAdUrl} />
          
          <Car 
            playing={!isBidding} 
            billboardDistance={BILLBOARD_DISTANCE}
            onNearBillboard={setCanBid}
          />
        </Suspense>
      </Canvas>

      {/* Interaction Prompt */}
      {!isBidding && canBid && (
        <div className="pointer-events-none absolute bottom-10 w-full flex justify-center z-10">
          <div className="bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-md border border-white/20 animate-pulse text-lg font-bold shadow-2xl">
            Press <kbd className="bg-blue-600 px-3 py-1 rounded mx-1 text-white">SPACE</kbd> to Bid on Billboard
          </div>
        </div>
      )}
    </div>
  );
}
