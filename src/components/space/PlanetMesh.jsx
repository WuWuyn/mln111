import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { planetPalette } from '../../data/cosmos'
import OrbitPath from './OrbitPath'

export default function PlanetMesh({ planet, selected, onSelect, showLabel = true, interactive = true }) {
  const orbit = useRef()
  const mesh = useRef()
  const glow = useRef()
  const palette = planetPalette[planet.color]

  useFrame((state, delta) => {
    orbit.current.rotation.y = state.clock.elapsedTime * planet.orbitSpeed + planet.phase
    mesh.current.rotation.y += delta * planet.rotationSpeed
    mesh.current.rotation.x = planet.axialTilt
    glow.current.rotation.y -= delta * 0.2
  })

  return (
    <group>
      <OrbitPath radius={planet.distance} />
      <group ref={orbit}>
        <group position={[planet.distance, 0, 0]}>
          <mesh
            ref={mesh}
            onClick={interactive ? () => onSelect(planet) : undefined}
            onPointerOver={interactive ? () => onSelect(planet) : undefined}
          >
            <sphereGeometry args={[planet.size, 48, 48]} />
            <meshStandardMaterial
              color={palette[1]}
              emissive={palette[2]}
              emissiveIntensity={selected ? 0.58 : 0.24}
              roughness={0.46}
              metalness={0.16}
            />
          </mesh>
          <mesh ref={glow} scale={selected ? 1.38 : 1.2}>
            <sphereGeometry args={[planet.size, 32, 32]} />
            <meshBasicMaterial
              color={palette[0]}
              transparent
              opacity={selected ? 0.18 : 0.08}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {planet.id === 'thuc-tien' && (
            <mesh rotation={[0.9, 0, 0.2]}>
              <torusGeometry args={[planet.size * 1.55, 0.025, 12, 120]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.58} />
            </mesh>
          )}
          {showLabel && (
            <Html position={[0, planet.size + 0.55, 0]} center distanceFactor={13}>
              <button className={`space-label ${selected ? 'is-selected' : ''}`} type="button" onClick={() => onSelect(planet)}>
                <small>{planet.signal}</small>
                {planet.name}
              </button>
            </Html>
          )}
        </group>
      </group>
    </group>
  )
}
