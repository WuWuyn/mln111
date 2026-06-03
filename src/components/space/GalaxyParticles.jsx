import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { seededRandom } from './random'

/**
 * Spiral-galaxy point cloud, distribution adapted from dgreenheck/webgpu-galaxy
 * (galaxy.js). That project runs 750k particles on WebGPU compute shaders; here
 * we generate ~9k points once on the CPU for a plain-WebGL <points> cloud, but
 * reuse the same math so the morphology matches:
 *   - sqrt() radius  -> even areal density (no oversaturated core)
 *   - logarithmic spiral via SPIRAL_TIGHTNESS
 *   - per-arm radial (ARM_WIDTH) + angular (RANDOMNESS) scatter
 *   - bulge thickness (fat core, thin rim)
 *   - colour by sparsity: tight arm cores = blue, diffuse halo = warm orange
 *
 * Their defaults were tuned for galaxyRadius 13 (spiralTightness 1.75,
 * armCount 2, armWidth 2.25, randomness 1.8, thickness 3). Scaled here to fill
 * our scene (~30) and softened a touch for the lower point count.
 */
const COUNT = 12000
const GALAXY_RADIUS = 46
const ARM_COUNT = 2
const SPIRAL_TIGHTNESS = 1.75
const ARM_WIDTH = 4.8
const RANDOMNESS = 1.0
const THICKNESS = 8
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

      // sqrt distribution -> even density across the disk (no center clump)
      const radius = Math.sqrt(seededRandom(i + 1)) * GALAXY_RADIUS
      const normalizedRadius = radius / GALAXY_RADIUS

      const armIndex = Math.floor(seededRandom(i + 2) * ARM_COUNT)
      const armAngle = (armIndex / ARM_COUNT) * TWO_PI
      const spiralAngle = normalizedRadius * SPIRAL_TIGHTNESS * TWO_PI

      const angleOffset = (seededRandom(i + 3) - 0.5) * RANDOMNESS
      const radiusOffset = (seededRandom(i + 4) - 0.5) * ARM_WIDTH

      const angle = armAngle + spiralAngle + angleOffset
      const offsetRadius = radius + radiusOffset

      // bulge: thicker at the core (1.2), thinner toward the rim (0.2)
      const thicknessFactor = 1 - normalizedRadius + 0.2
      const y = (seededRandom(i + 5) - 0.5) * THICKNESS * thicknessFactor

      positionsArray[i3] = Math.cos(angle) * offsetRadius
      positionsArray[i3 + 1] = y
      positionsArray[i3 + 2] = Math.sin(angle) * offsetRadius

      // colour by how far the star scattered from its arm centre
      const radialSparsity = Math.abs(radiusOffset) / (ARM_WIDTH * 0.5 + 0.01)
      const angularSparsity = Math.abs(angleOffset) / (RANDOMNESS * 0.5 + 0.01)
      const sparsity = Math.min((radialSparsity + angularSparsity) * 0.5, 1)

      color.copy(DENSE_COLOR).lerp(SPARSE_COLOR, sparsity)
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
