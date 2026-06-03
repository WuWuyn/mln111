import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { seededRandom } from './random'

const COUNT = 150000
const FIELD_RADIUS = 210
const TWO_PI = Math.PI * 2
const COLD = new THREE.Color('#8fc9ff')
const WARM = new THREE.Color('#ffd09a')
const WHITE = new THREE.Color('#ffffff')

export default function GalaxyParticles() {
  const field = useRef()
  const depthField = useRef()

  const { positions, colors, depthPositions, depthColors } = useMemo(() => {
    const positionsArray = new Float32Array(COUNT * 3)
    const colorsArray = new Float32Array(COUNT * 3)
    const depthCount = Math.floor(COUNT * 0.38)
    const depthPositionsArray = new Float32Array(depthCount * 3)
    const depthColorsArray = new Float32Array(depthCount * 3)
    const color = new THREE.Color()

    for (let i = 0; i < COUNT; i += 1) {
      const i3 = i * 3
      const theta = seededRandom(i + 1) * TWO_PI
      const phi = Math.acos(2 * seededRandom(i + 2) - 1)
      const radius = 18 + seededRandom(i + 3) ** 0.34 * FIELD_RADIUS
      const sinPhi = Math.sin(phi)

      positionsArray[i3] = radius * sinPhi * Math.cos(theta)
      positionsArray[i3 + 1] = radius * Math.cos(phi) * (0.62 + seededRandom(i + 4) * 0.42)
      positionsArray[i3 + 2] = radius * sinPhi * Math.sin(theta)

      const tint = seededRandom(i + 5)
      color.copy(tint > 0.78 ? WARM : tint > 0.18 ? COLD : WHITE)
      const brightness = 0.52 + seededRandom(i + 6) ** 2 * 1.25
      colorsArray[i3] = color.r * brightness
      colorsArray[i3 + 1] = color.g * brightness
      colorsArray[i3 + 2] = color.b * brightness
    }

    for (let i = 0; i < depthCount; i += 1) {
      const i3 = i * 3
      const theta = seededRandom(i + 101) * TWO_PI
      const phi = Math.acos(2 * seededRandom(i + 102) - 1)
      const radius = 70 + seededRandom(i + 103) ** 0.28 * FIELD_RADIUS * 1.45
      const sinPhi = Math.sin(phi)

      depthPositionsArray[i3] = radius * sinPhi * Math.cos(theta)
      depthPositionsArray[i3 + 1] = radius * Math.cos(phi)
      depthPositionsArray[i3 + 2] = radius * sinPhi * Math.sin(theta)

      color.copy(seededRandom(i + 104) > 0.64 ? WARM : COLD)
      const brightness = 0.24 + seededRandom(i + 105) * 0.58
      depthColorsArray[i3] = color.r * brightness
      depthColorsArray[i3 + 1] = color.g * brightness
      depthColorsArray[i3 + 2] = color.b * brightness
    }

    return {
      positions: positionsArray,
      colors: colorsArray,
      depthPositions: depthPositionsArray,
      depthColors: depthColorsArray,
    }
  }, [])

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime

    field.current.rotation.y += delta * 0.008
    field.current.rotation.x = Math.sin(elapsed * 0.035) * 0.018
    depthField.current.rotation.y -= delta * 0.003
    depthField.current.rotation.z = Math.cos(elapsed * 0.028) * 0.014
  })

  return (
    <group>
      <points ref={depthField}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={depthPositions.length / 3} array={depthPositions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={depthColors.length / 3} array={depthColors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.075}
          vertexColors
          transparent
          opacity={0.56}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <points ref={field}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.058}
          vertexColors
          transparent
          opacity={0.92}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
