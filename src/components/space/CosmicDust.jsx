import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { seededRandom } from './random'

/**
 * Fine cosmic dust scattered through the *entire* volume — not just a shell.
 * Points are placed uniformly inside a big sphere (radius from cbrt for even
 * volume density), so there are specks near the camera and far away alike,
 * making the space feel filled with drifting motes in every direction.
 *
 * Tiny, additive, size-attenuated points twinkle subtly as the field drifts.
 */
const COUNT = 9000
const RADIUS = 70
const TWO_PI = Math.PI * 2
const COOL = new THREE.Color('#9fd2ff')
const WARM = new THREE.Color('#ffe6c4')

export default function CosmicDust() {
  const points = useRef()
  const material = useRef()

  const { positions, colors } = useMemo(() => {
    const positionsArray = new Float32Array(COUNT * 3)
    const colorsArray = new Float32Array(COUNT * 3)
    const color = new THREE.Color()

    for (let i = 0; i < COUNT; i += 1) {
      const i3 = i * 3
      const r = i * 5

      // Uniform point inside the sphere: direction on unit sphere * cbrt radius.
      const theta = seededRandom(r + 1) * TWO_PI
      const phi = Math.acos(2 * seededRandom(r + 2) - 1)
      const sinPhi = Math.sin(phi)
      const radius = Math.cbrt(seededRandom(r + 3)) * RADIUS

      positionsArray[i3] = radius * sinPhi * Math.cos(theta)
      positionsArray[i3 + 1] = radius * Math.cos(phi)
      positionsArray[i3 + 2] = radius * sinPhi * Math.sin(theta)

      color.copy(COOL).lerp(WARM, seededRandom(r + 4))
      const brightness = 1.1 + seededRandom(r + 5) * 1.0
      colorsArray[i3] = color.r * brightness
      colorsArray[i3 + 1] = color.g * brightness
      colorsArray[i3 + 2] = color.b * brightness
    }

    return { positions: positionsArray, colors: colorsArray }
  }, [])

  useFrame((state, delta) => {
    points.current.rotation.y += delta * 0.012
    // Gentle breathing opacity so the motes twinkle like bright stars.
    material.current.opacity = 0.85 + Math.sin(state.clock.elapsedTime * 0.6) * 0.15
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        ref={material}
        size={0.12}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
