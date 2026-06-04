import { Html, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { publicAsset } from '../../utils/publicAsset'

function configureTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
}

const smoothstep = (t) => t * t * (3 - 2 * t)
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

export default function CentralPlanet({ onClick, showLabel = true, interactive = true, appearRef }) {
  const group = useRef()
  const core = useRef()
  const [hovered, setHovered] = useState(false)
  const sunTexture = useTexture(publicAsset('textures/planets/sun.jpg'), configureTexture)

  useFrame((_, delta) => {
    core.current.rotation.y += delta * 0.13
    if (appearRef && group.current) {
      // Lõi trung tâm bừng sáng trước (đầy đủ khi tiến trình đạt ~0.5).
      const s = smoothstep(clamp01(appearRef.current.p / 0.5))
      group.current.scale.setScalar(s)
      group.current.visible = s > 0.001
    }
  })

  return (
    <group ref={group}>
      <mesh
        ref={core}
        onClick={interactive ? onClick : undefined}
        onPointerOver={interactive ? () => setHovered(true) : undefined}
        onPointerOut={interactive ? () => setHovered(false) : undefined}
      >
        <sphereGeometry args={[1.72, 96, 96]} />
        <meshBasicMaterial map={sunTexture} toneMapped={false} />
      </mesh>

      {(showLabel || hovered) && (
        <Html position={[0, 2.35, 0]} center distanceFactor={10}>
          <div className="space-label primary-label">
            Triết học Mác - Lênin
          </div>
        </Html>
      )}

      <pointLight intensity={26} distance={52} color="#ffd08a" />
    </group>
  )
}
