import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { seededRandom } from './random'

export default function GalaxyParticles() {
  const points = useRef()

  const { positions, colors } = useMemo(() => {
    const count = 18000
    const positionsArray = new Float32Array(count * 3)
    const colorsArray = new Float32Array(count * 3)
    const inside = new THREE.Color('#ffb35c')
    const outside = new THREE.Color('#4d7dff')
    const branches = 5
    const radiusMax = 34

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3
      const radius = seededRandom(i + 1) * radiusMax
      const spin = radius * 0.34
      const branchAngle = ((i % branches) / branches) * Math.PI * 2
      const randomPower = 2.8
      const randomness = 0.55
      const randomX =
        (seededRandom(i + 17) < 0.5 ? -1 : 1) *
        Math.pow(seededRandom(i + 29), randomPower) *
        randomness *
        radius
      const randomY =
        (seededRandom(i + 41) < 0.5 ? -1 : 1) *
        Math.pow(seededRandom(i + 53), randomPower) *
        randomness *
        radius *
        0.12
      const randomZ =
        (seededRandom(i + 67) < 0.5 ? -1 : 1) *
        Math.pow(seededRandom(i + 79), randomPower) *
        randomness *
        radius

      positionsArray[i3] = Math.cos(branchAngle + spin) * radius + randomX
      positionsArray[i3 + 1] = randomY - 0.8
      positionsArray[i3 + 2] = Math.sin(branchAngle + spin) * radius + randomZ

      const mixed = inside.clone().lerp(outside, radius / radiusMax)
      colorsArray[i3] = mixed.r
      colorsArray[i3 + 1] = mixed.g
      colorsArray[i3 + 2] = mixed.b
    }

    return { positions: positionsArray, colors: colorsArray }
  }, [])

  useFrame((_, delta) => {
    points.current.rotation.y += delta * 0.025
    points.current.rotation.z += delta * 0.006
  })

  return (
    <points ref={points} rotation={[0.18, 0, -0.16]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.82}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
