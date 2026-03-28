import React, { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Edges, PerformanceMonitor } from '@react-three/drei'

function FloatingSpheres({ count = 200 }) {
  const groupRef = useRef()

  const spheres = useMemo(() => {
    const items = []
    for (let i = 0; i < count; i += 1) {
      const radius = 0.05 + Math.random() * 0.1
      const x = (Math.random() - 0.5) * 40
      const y = (Math.random() - 0.5) * 40
      const z = (Math.random() - 0.5) * 20

      const dirX = (Math.random() - 0.5) * 0.6
      const dirY = (Math.random() - 0.5) * 0.6
      const dirZ = (Math.random() - 0.5) * 0.4
      const speed = 0.05 + Math.random() * 0.12
      const offset = Math.random() * Math.PI * 2
      const color = Math.random() > 0.5 ? '#7c3aed' : '#06b6d4'

      items.push({
        id: i,
        radius,
        position: [x, y, z],
        velocity: [dirX, dirY, dirZ],
        speed,
        offset,
        color,
      })
    }
    return items
  }, [count])

  const refs = useRef([])

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()
    for (let i = 0; i < spheres.length; i += 1) {
      const mesh = refs.current[i]
      if (!mesh) continue

      const s = spheres[i]
      const bob = Math.sin(t + s.offset) * 0.25

      s.position[0] += s.velocity[0] * s.speed * delta
      s.position[1] += s.velocity[1] * s.speed * delta
      s.position[2] += s.velocity[2] * s.speed * delta

      if (s.position[0] > 20) s.position[0] = -20
      if (s.position[0] < -20) s.position[0] = 20
      if (s.position[1] > 20) s.position[1] = -20
      if (s.position[1] < -20) s.position[1] = 20
      if (s.position[2] > 10) s.position[2] = -10
      if (s.position[2] < -10) s.position[2] = 10

      mesh.position.set(s.position[0], s.position[1] + bob, s.position[2])
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.05) * 0.08
      groupRef.current.rotation.x = Math.cos(t * 0.04) * 0.06
    }
  })

  return (
    <group ref={groupRef}>
      {spheres.map((s, idx) => (
        <mesh
          key={s.id}
          ref={(el) => {
            refs.current[idx] = el
          }}
          position={s.position}
        >
          <sphereGeometry args={[s.radius, 16, 16]} />
          <meshStandardMaterial color={s.color} roughness={0.6} metalness={0.1} />
        </mesh>
      ))}
    </group>
  )
}

function WireIco({ radius, position, rotationSpeed, color = '#7c3aed' }) {
  const ref = useRef()

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.x += rotationSpeed[0] * delta
    ref.current.rotation.y += rotationSpeed[1] * delta
    ref.current.rotation.z += rotationSpeed[2] * delta
  })

  return (
    <mesh ref={ref} position={position}>
      <icosahedronGeometry args={[radius, 0]} />
      <meshBasicMaterial transparent opacity={0} />
      <Edges color={color} transparent opacity={0.3} />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} color="#7c3aed" intensity={2} />
      <pointLight position={[-10, -10, -5]} color="#06b6d4" intensity={1.5} />

      <FloatingSpheres count={200} />

      <WireIco radius={3.5} position={[8, 6, -8]} rotationSpeed={[0.05, 0.02, 0.01]} />
      <WireIco radius={5.5} position={[-10, -4, -10]} rotationSpeed={[0.01, 0.04, 0.02]} />
      <WireIco radius={4.5} position={[2, -9, -12]} rotationSpeed={[0.02, 0.01, 0.05]} />
    </>
  )
}

export default function Background3D() {
  const [dpr, setDpr] = useState(1.5)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, dpr]}
        camera={{ position: [0, 0, 12], fov: 55 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: '#0a0a0f' }}
      >
        <Suspense fallback={null}>
          <PerformanceMonitor
            flipflops={2}
            onDecline={() => setDpr(1)}
            onIncline={() => setDpr(1.5)}
          />
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
