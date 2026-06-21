"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, PointerLockControls, useTexture, KeyboardControls, useKeyboardControls } from "@react-three/drei";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { Suspense, useRef, useState, useEffect } from "react";
import * as THREE from "three";

// --- BILLBOARD COMPONENT ---
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

function Billboard({ textureUrl }: { textureUrl: string | null }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={[0, 1.5, -4]}>
      <group>
        {/* Stand */}
        <mesh position={[0, -1.5, 0]}>
          <boxGeometry args={[0.2, 3, 0.2]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        
        {/* Screen */}
        <Suspense fallback={<FallbackScreen />}>
          {textureUrl ? <BillboardScreen url={textureUrl} /> : <FallbackScreen />}
        </Suspense>
        
        {/* Frame back */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[4.2, 2.2, 0.1]} />
          <meshStandardMaterial color="#111" />
        </mesh>

        {/* Glow */}
        <mesh position={[0, 0, 0.15]}>
          <planeGeometry args={[4.2, 2.2]} />
          <meshBasicMaterial color="#fff" transparent opacity={0.1} />
        </mesh>
      </group>
    </RigidBody>
  );
}

// --- LEVEL COMPONENT ---
function Level() {
  return (
    <>
      <RigidBody type="fixed" colliders="cuboid">
        {/* Floor */}
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
        </mesh>
        
        {/* Walls */}
        <mesh position={[0, 2.5, -10]}>
          <boxGeometry args={[50, 6, 1]} />
          <meshStandardMaterial color="#0f0f1a" />
        </mesh>
        <mesh position={[0, 2.5, 10]}>
          <boxGeometry args={[50, 6, 1]} />
          <meshStandardMaterial color="#0f0f1a" />
        </mesh>
        <mesh position={[-10, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[50, 6, 1]} />
          <meshStandardMaterial color="#0f0f1a" />
        </mesh>
        <mesh position={[10, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[50, 6, 1]} />
          <meshStandardMaterial color="#0f0f1a" />
        </mesh>
      </RigidBody>
    </>
  );
}

// --- PLAYER COMPONENT ---
const SPEED = 5;
const direction = new THREE.Vector3();
const frontVector = new THREE.Vector3();
const sideVector = new THREE.Vector3();

function Player({ setCanBid }: { setCanBid: (val: boolean) => void }) {
  const ref = useRef<any>(null);
  const [, get] = useKeyboardControls();
  const { camera } = useThree();

  useFrame(() => {
    if (!ref.current) return;
    const velocity = ref.current.linvel();
    const { forward, backward, left, right } = get();

    // Update movement
    frontVector.set(0, 0, Number(backward) - Number(forward));
    sideVector.set(Number(left) - Number(right), 0, 0);
    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(SPEED).applyEuler(camera.rotation);

    ref.current.setLinvel({ x: direction.x, y: velocity.y, z: direction.z });

    // Sync camera to player position
    const pos = ref.current.translation();
    camera.position.set(pos.x, pos.y + 1.5, pos.z); // Eye level

    // Check distance to billboard (billboard is at 0, 1.5, -4)
    const billboardPos = new THREE.Vector3(0, 1.5, -4);
    const dist = camera.position.distanceTo(billboardPos);
    setCanBid(dist < 4);
  });

  return (
    <RigidBody ref={ref} colliders={false} mass={1} type="dynamic" position={[0, 2, 5]} enabledRotations={[false, false, false]}>
      <CuboidCollider args={[0.5, 1, 0.5]} />
    </RigidBody>
  );
}

// --- MAIN SCENE ---
export default function Scene({ currentAdUrl, isBidding, setIsBidding }: { 
  currentAdUrl: string | null, 
  isBidding: boolean,
  setIsBidding: (val: boolean) => void 
}) {
  const [canBid, setCanBid] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' && canBid && !isBidding) {
        setIsBidding(true);
        // Unlock pointer natively when opening UI
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
      } else if (e.key === 'Escape' && isBidding) {
        setIsBidding(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canBid, isBidding, setIsBidding]);

  return (
    <div className="absolute inset-0 z-0">
      <KeyboardControls
        map={[
          { name: "forward", keys: ["ArrowUp", "w", "W"] },
          { name: "backward", keys: ["ArrowDown", "s", "S"] },
          { name: "left", keys: ["ArrowLeft", "a", "A"] },
          { name: "right", keys: ["ArrowRight", "d", "D"] },
          { name: "jump", keys: ["Space"] },
        ]}
      >
        <Canvas>
          <Suspense fallback={null}>
            <Physics gravity={[0, -30, 0]}>
              <Environment preset="night" background blur={0.5} />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              
              <Level />
              <Billboard textureUrl={currentAdUrl} />
              <Player setCanBid={setCanBid} />
            </Physics>

            {/* Only lock pointer when NOT interacting with UI */}
            {!isBidding && <PointerLockControls />}
          </Suspense>
        </Canvas>
      </KeyboardControls>

      {/* Crosshair / Interaction Prompt */}
      {!isBidding && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50 mb-4" />
          {canBid && (
            <div className="bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20 animate-pulse">
              Press <kbd className="bg-zinc-800 px-2 py-1 rounded mx-1">E</kbd> to Bid on Billboard
            </div>
          )}
        </div>
      )}
    </div>
  );
}
