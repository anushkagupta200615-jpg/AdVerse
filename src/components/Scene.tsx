"use client";

import { Canvas } from "@react-three/fiber";
import { Sky, useTexture } from "@react-three/drei";
import { Suspense, useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import Car, { DrivingTelemetry } from "./Car";
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
      <meshStandardMaterial color="#3a3a40" roughness={0.9} />
    </mesh>
  );
}

function Ground() {
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10000, 10000]} />
      <meshBasicMaterial color="#537247" />
    </mesh>
  );
}

export default function Scene({ 
  currentAdUrl, 
  isBidding, 
  setIsBidding,
  onTelemetry
}: { 
  currentAdUrl: string | null, 
  isBidding: boolean,
  setIsBidding: (val: boolean) => void,
  onTelemetry: (telemetry: DrivingTelemetry) => void
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

  useEffect(() => {
    // Show/hide the prompt from page.tsx directly to avoid react re-renders on the whole app
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
        <color attach="background" args={['#a8c9d8']} />
        <fog attach="fog" args={['#a8c9d8', 130, 690]} />

        <Sky
          sunPosition={[80, 32, -90]}
          turbidity={1.4}
          rayleigh={1.8}
          mieCoefficient={0.006}
          mieDirectionalG={0.72}
        />

        <ambientLight intensity={0.78} />
        <hemisphereLight args={['#d8f0ff', '#537247', 1.2]} />
        <directionalLight 
          position={[70, 100, -80]} 
          intensity={2.15}
        />
        
        <Ground />
        <Road />
        <Billboard textureUrl={currentAdUrl} />
        
        <Suspense fallback={null}>
          <Car 
            playing={!isBidding} 
            billboardDistance={BILLBOARD_DISTANCE}
            onNearBillboard={setCanBid}
            onTelemetry={onTelemetry}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
