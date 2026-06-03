import { Html, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import OrbitPath from './OrbitPath'

const PLANET_LOOK = {
  'vat-chat': {
    texture: '/textures/planets/earth.jpg',
    light: '#cce9ff',
  },
  'y-thuc': {
    texture: '/textures/planets/venus.jpg',
    light: '#ffe0b8',
  },
  'lien-he-phat-trien': {
    texture: '/textures/planets/jupiter.jpg',
    light: '#ffe2b8',
  },
  'mau-thuan-luong-chat': {
    texture: '/textures/planets/neptune.jpg',
    light: '#a9c8ff',
  },
  'thuc-tien': {
    texture: '/textures/planets/moon.jpg',
    light: '#ffffff',
  },
}

function configureTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
}

export default function PlanetMesh({ planet, selected, onSelect, onOpenExperience, showLabel = true, interactive = true }) {
  const orbit = useRef()
  const mesh = useRef()
  const look = PLANET_LOOK[planet.id] ?? PLANET_LOOK['vat-chat']
  const surfaceTexture = useTexture(look.texture, configureTexture)

  const selectPlanet = (event) => {
    event?.stopPropagation?.()
    onSelect(planet)
  }

  const openExperience = (event) => {
    event?.stopPropagation?.()
    onOpenExperience?.(planet)
  }

  useFrame((state, delta) => {
    orbit.current.rotation.y = state.clock.elapsedTime * planet.orbitSpeed + planet.phase
    mesh.current.rotation.y += delta * planet.rotationSpeed * 0.7
    mesh.current.rotation.x = planet.axialTilt
  })

  return (
    <group>
      <OrbitPath radius={planet.distance} />
      <group ref={orbit}>
        <group position={[planet.distance, 0, 0]}>
          <mesh
            ref={mesh}
            onClick={interactive ? selectPlanet : undefined}
            onDoubleClick={interactive ? openExperience : undefined}
            onPointerOver={interactive ? selectPlanet : undefined}
          >
            <sphereGeometry args={[planet.size, 80, 80]} />
            <meshPhysicalMaterial
              map={surfaceTexture}
              roughness={0.84}
              metalness={0.01}
              clearcoat={selected ? 0.22 : 0.08}
              clearcoatRoughness={0.56}
            />
          </mesh>

          {selected && <pointLight intensity={0.55} distance={planet.size * 6} color={look.light} />}

          {showLabel && (
            <Html position={[0, planet.size + 0.52, 0]} center distanceFactor={13}>
              <button
                className={`space-label ${selected ? 'is-selected' : ''}`}
                type="button"
                onClick={selectPlanet}
                onDoubleClick={openExperience}
                title="Double click để mở thực nghiệm"
              >
                {planet.name}
              </button>
            </Html>
          )}
        </group>
      </group>
    </group>
  )
}
