import { useMemo } from 'react'
import * as THREE from 'three'

const DASHES = 96
const DASH_RATIO = 0.42
const TWO_PI = Math.PI * 2

export default function OrbitPath({ radius }) {
  const segments = useMemo(() => {
    const items = []

    for (let i = 0; i < DASHES; i += 1) {
      const start = (i / DASHES) * TWO_PI
      const end = start + (TWO_PI / DASHES) * DASH_RATIO
      const points = [
        new THREE.Vector3(Math.cos(start) * radius, 0, Math.sin(start) * radius),
        new THREE.Vector3(Math.cos(end) * radius, 0, Math.sin(end) * radius),
      ]

      items.push(new THREE.BufferGeometry().setFromPoints(points))
    }

    return items
  }, [radius])

  return (
    <group rotation={[0, 0, 0]}>
      {segments.map((geometry, index) => (
        <line key={`${radius}-${index}`} geometry={geometry}>
          <lineBasicMaterial color="#9fc3ff" transparent opacity={0.085} depthWrite={false} />
        </line>
      ))}
    </group>
  )
}
