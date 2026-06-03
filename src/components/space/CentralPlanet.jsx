import { Html, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

function configureTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
}

export default function CentralPlanet({ onClick, showLabel = true, interactive = true }) {
  const core = useRef()
  const sunTexture = useTexture('/textures/planets/sun.jpg', configureTexture)

  useFrame((_, delta) => {
    core.current.rotation.y += delta * 0.13
  })

  return (
    <group>
      <mesh ref={core} onClick={interactive ? onClick : undefined}>
        <sphereGeometry args={[1.72, 96, 96]} />
        <meshBasicMaterial map={sunTexture} toneMapped={false} />
      </mesh>

      {showLabel && (
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
