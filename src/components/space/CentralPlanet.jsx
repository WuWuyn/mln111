import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

export default function CentralPlanet({ onClick, showLabel = true, interactive = true }) {
  const core = useRef()
  const halo = useRef()

  useFrame((_, delta) => {
    core.current.rotation.y += delta * 0.22
    halo.current.rotation.z -= delta * 0.08
  })

  return (
    <group>
      <mesh ref={halo}>
        <torusGeometry args={[2.35, 0.025, 16, 180]} />
        <meshBasicMaterial color="#ffcf73" transparent opacity={0.62} />
      </mesh>
      <mesh rotation={[0.45, 0, -0.2]}>
        <torusGeometry args={[2.7, 0.018, 16, 180]} />
        <meshBasicMaterial color="#82ddff" transparent opacity={0.36} />
      </mesh>
      <mesh ref={core} onClick={interactive ? onClick : undefined}>
        <sphereGeometry args={[1.72, 64, 64]} />
        <meshStandardMaterial
          color="#f0a45e"
          emissive="#9b3f7f"
          emissiveIntensity={0.35}
          roughness={0.42}
          metalness={0.12}
        />
      </mesh>
      <mesh scale={1.13}>
        <sphereGeometry args={[1.72, 64, 64]} />
        <meshBasicMaterial color="#ff7fa6" transparent opacity={0.12} blending={THREE.AdditiveBlending} />
      </mesh>
      {showLabel && (
        <Html position={[0, 2.35, 0]} center distanceFactor={10}>
          <div className="space-label primary-label">
            <small>Trung tâm</small>
            Triết học Mác - Lênin
          </div>
        </Html>
      )}
      <pointLight intensity={22} distance={38} color="#ffd08a" />
    </group>
  )
}
