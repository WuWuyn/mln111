import { Html, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { publicAsset } from '../../utils/publicAsset'
import OrbitPath from './OrbitPath'

const PLANET_LOOK = {
  'vat-chat': {
    texture: publicAsset('textures/planets/earth.jpg'),
    light: '#cce9ff',
  },
  'y-thuc': {
    texture: publicAsset('textures/planets/venus.jpg'),
    light: '#ffe0b8',
  },
  'lien-he-phat-trien': {
    texture: publicAsset('textures/planets/jupiter.jpg'),
    light: '#ffe2b8',
  },
  'mau-thuan-luong-chat': {
    texture: publicAsset('textures/planets/neptune.jpg'),
    light: '#a9c8ff',
  },
  'thuc-tien': {
    texture: publicAsset('textures/planets/moon.jpg'),
    light: '#ffffff',
  },
}

function configureTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
}

const smoothstep = (t) => t * t * (3 - 2 * t)
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

export default function PlanetMesh({
  planet,
  selected,
  onSelect,
  onOpenExperience,
  showLabel = true,
  interactive = true,
  appearRef,
  appearIndex = 0,
}) {
  const root = useRef()
  const orbit = useRef()
  const mesh = useRef()
  const [hovered, setHovered] = useState(false)
  const look = PLANET_LOOK[planet.id] ?? PLANET_LOOK['vat-chat']
  const surfaceTexture = useTexture(look.texture, configureTexture)

  const selectPlanet = (event) => {
    event?.stopPropagation?.()
    onSelect(planet)
  }

  // Rê chuột vào hành tinh: hiện nhãn tên ngay (kể cả khi bảng thông tin đang mở)
  // và cập nhật bảng tri thức sang hành tinh đó.
  const handleOver = (event) => {
    event?.stopPropagation?.()
    setHovered(true)
    onSelect(planet)
  }

  const handleOut = (event) => {
    event?.stopPropagation?.()
    setHovered(false)
  }

  const openExperience = (event) => {
    event?.stopPropagation?.()
    onOpenExperience?.(planet)
  }

  useFrame((state, delta) => {
    orbit.current.rotation.y = state.clock.elapsedTime * planet.orbitSpeed + planet.phase
    mesh.current.rotation.y += delta * planet.rotationSpeed * 0.7
    mesh.current.rotation.x = planet.axialTilt
    if (appearRef && root.current) {
      // Các hành tinh lần lượt mọc ra từ tâm sau Big Bang (so le theo thứ tự).
      // Scale cả group ngoài nên quỹ đạo lẫn hành tinh cùng phình ra từ gốc.
      const delay = 0.08 + appearIndex * 0.11
      const local = clamp01((appearRef.current.p - delay) / (1 - delay))
      const s = smoothstep(local)
      root.current.scale.setScalar(s)
      root.current.visible = s > 0.001
    }
  })

  return (
    <group ref={root}>
      <OrbitPath radius={planet.distance} />
      <group ref={orbit}>
        <group position={[planet.distance, 0, 0]}>
          <mesh
            ref={mesh}
            onClick={interactive ? selectPlanet : undefined}
            onDoubleClick={interactive ? openExperience : undefined}
            onPointerOver={interactive ? handleOver : undefined}
            onPointerOut={interactive ? handleOut : undefined}
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

          {(showLabel || hovered) && (
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
