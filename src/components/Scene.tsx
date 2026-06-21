"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, useTexture } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";

function BillboardScreen({ url }: { url: string }) {
  const texture = useTexture(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh position={[0, 0, 0.1]}>
      <planeGeometry args={[4, 2]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

function FallbackScreen() {
  return (
    <mesh position={[0, 0, 0.1]}>
      <planeGeometry args={[4, 2]} />
      <meshBasicMaterial color="#333" />
    </mesh>
  );
}

// The Billboard Component that displays the ad
function Billboard({ textureUrl }: { textureUrl: string | null }) {
  return (
    <group position={[0, 1.5, -2]}>
      {/* Stand/Frame */}
      <mesh position={[0, -1.5, 0]}>
        <boxGeometry args={[0.2, 3, 0.2]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      
      {/* Screen with Suspense for texture loading */}
      <Suspense fallback={<FallbackScreen />}>
        {textureUrl ? <BillboardScreen url={textureUrl} /> : <FallbackScreen />}
      </Suspense>
      
      {/* Frame back */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4.2, 2.2, 0.1]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}

export default function Scene({ currentAdUrl }: { currentAdUrl: string | null }) {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <Environment preset="night" background blur={0.5} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          <Billboard textureUrl={currentAdUrl} />
          <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} />
        </Suspense>
      </Canvas>
    </div>
  );
}
