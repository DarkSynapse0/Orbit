"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// A cosmos.network-style cluster: a wireframe core with glowing orbs drifting on
// orbital shells + hairline rings, rotating slowly. Pure WebGL (three / r3f).
function Cluster() {
  const group = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * 0.12;
    group.current.rotation.x += dt * 0.025;
  });

  const nodes = useMemo(() => {
    const out: { pos: [number, number, number]; r: number; accent: boolean }[] = [];
    const shells = [1.7, 2.5, 3.3];
    shells.forEach((R, si) => {
      const count = 5 + si * 3;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + si * 0.7;
        const y = Math.sin(a * 2 + si) * 0.6;
        out.push({
          pos: [Math.cos(a) * R, y, Math.sin(a) * R],
          r: 0.05 + Math.random() * 0.07,
          accent: Math.random() > 0.72,
        });
      }
    });
    return out;
  }, []);

  return (
    <group ref={group}>
      {/* wireframe core */}
      <mesh>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#334155" emissive="#0f766e" emissiveIntensity={0.12} wireframe />
      </mesh>

      {/* hairline rings */}
      {[1.7, 2.5, 3.3].map((R, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.35, i * 0.4, 0]}>
          <torusGeometry args={[R, 0.005, 10, 120]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={0.07} />
        </mesh>
      ))}

      {/* orbs */}
      {nodes.map((n, i) => (
        <mesh key={i} position={n.pos}>
          <sphereGeometry args={[n.r, 18, 18]} />
          {n.accent ? (
            <meshStandardMaterial color="#0f766e" emissive="#0f766e" emissiveIntensity={0.3} roughness={0.35} />
          ) : (
            <meshStandardMaterial color="#9aa3af" emissive="#000000" emissiveIntensity={0} roughness={0.6} />
          )}
        </mesh>
      ))}
    </group>
  );
}

export function Hero3D({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={className} aria-hidden />;

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        frameloop={reduced ? "demand" : "always"}
      >
        <ambientLight intensity={1} />
        <pointLight position={[5, 5, 5]} intensity={22} color="#0f766e" />
        <pointLight position={[-6, -3, 2]} intensity={12} color="#ffffff" />
        <Cluster />
      </Canvas>
    </div>
  );
}
