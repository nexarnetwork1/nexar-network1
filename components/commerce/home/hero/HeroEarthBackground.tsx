"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";

const IDLE_RESUME_MS = 3500;

function EarthMesh({ idle }: { idle: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [colorMap, normalMap] = useTexture([
    "/textures/earth-day.jpg",
    "/textures/earth-normal.jpg",
  ]);

  useFrame((state, delta) => {
    if (!idle || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.1;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.06;
    groupRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.08) * 0.025;
  });

  return (
    <group ref={groupRef} rotation={[0.35, 2.1, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2.15, 64, 64]} />
        <meshStandardMaterial
          map={colorMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.55, 0.55)}
          roughness={0.82}
          metalness={0.08}
        />
      </mesh>
      <mesh scale={1.018}>
        <sphereGeometry args={[2.15, 48, 48]} />
        <meshBasicMaterial
          color="#d4af37"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.1}>
        <sphereGeometry args={[2.15, 32, 32]} />
        <meshBasicMaterial
          color="#4a90e2"
          transparent
          opacity={0.11}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function EarthScene({ idle }: { idle: boolean }) {
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[6, 3, 5]} intensity={1.15} color="#e8ecf1" />
      <pointLight position={[-5, -2, 3]} intensity={0.55} color="#d4af37" />
      <pointLight position={[4, -3, -2]} intensity={0.3} color="#c9a227" />
      <Suspense fallback={null}>
        <EarthMesh idle={idle} />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={idle}
        autoRotateSpeed={0.35}
        rotateSpeed={0.55}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.75}
      />
    </>
  );
}

type HeroEarthBackgroundProps = {
  className?: string;
};

export function HeroEarthBackground({ className }: HeroEarthBackgroundProps) {
  const [idle, setIdle] = useState(true);
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const resumeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? true),
      { threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
    },
    [],
  );

  function markActive() {
    setIdle(false);
    if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
  }

  function scheduleIdle() {
    if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => setIdle(true), IDLE_RESUME_MS);
  }

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden
    >
      <div
        className="pointer-events-auto absolute inset-x-0 top-0 h-full max-h-[720px] opacity-[0.72] sm:max-h-none"
        onPointerDown={markActive}
        onPointerUp={scheduleIdle}
        onPointerLeave={scheduleIdle}
        onTouchStart={markActive}
        onTouchEnd={scheduleIdle}
      >
        {visible ? (
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 5.8], fov: 42 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            style={{ background: "transparent" }}
          >
            <EarthScene idle={idle} />
          </Canvas>
        ) : null}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background/75" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
