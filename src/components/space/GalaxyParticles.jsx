import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { seededRandom } from './random'

/**
 * Spherical dust cloud — a full 3D shell of points wrapped around the scene so
 * the camera is *inside* it and dust is visible in every direction, instead of
 * the old flat spiral disk that only read as a plane.
 *
 *   - direction picked uniformly on the unit sphere (no clumping at the poles)
 *   - radius from an INNER..OUTER shell, biased outward so the dense core near
 *     the planets stays clear while the halo fills the far background
 *   - colour by radius: inner shell = cool blue, outer halo = warm orange
 */
const COUNT = 14000
const INNER_RADIUS = 18
const OUTER_RADIUS = 60
const TWO_PI = Math.PI * 2
const DENSE_COLOR = new THREE.Color('#1885ff')
const SPARSE_COLOR = new THREE.Color('#ffb28a')

export default function GalaxyParticles() {
  const points = useRef()

  const { positions, colors } = useMemo(() => {
    const positionsArray = new Float32Array(COUNT * 3)
    const colorsArray = new Float32Array(COUNT * 3)
    const color = new THREE.Color()

    for (let i = 0; i < COUNT; i += 1) {
      const i3 = i * 3

      // Uniform direction on the unit sphere: phi from acos(2u-1) avoids the
      // density pinch you get from a naive uniform polar angle.
      const theta = seededRandom(i + 1) * TWO_PI
      const phi = Math.acos(2 * seededRandom(i + 2) - 1)
      const sinPhi = Math.sin(phi)

      // cbrt -> even volume density; ** 0.6 pushes points toward the outer
      // shell so the middle (where the planets live) stays uncluttered.
      const t = Math.cbrt(seededRandom(i + 3)) ** 0.6
      const radius = INNER_RADIUS + t * (OUTER_RADIUS - INNER_RADIUS)

      positionsArray[i3] = radius * sinPhi * Math.cos(theta)
      positionsArray[i3 + 1] = radius * Math.cos(phi)
      positionsArray[i3 + 2] = radius * sinPhi * Math.sin(theta)

      // colour by depth into the shell: inner = blue, outer halo = warm orange
      color.copy(DENSE_COLOR).lerp(SPARSE_COLOR, t)
      const brightness = 0.75 + seededRandom(i + 6) * 0.5
      colorsArray[i3] = color.r * brightness
      colorsArray[i3 + 1] = color.g * brightness
      colorsArray[i3 + 2] = color.b * brightness
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
        size={0.07}
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
