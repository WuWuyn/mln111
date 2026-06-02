import { Line } from '@react-three/drei'
import { useMemo } from 'react'

export default function OrbitPath({ radius }) {
  const points = useMemo(() => {
    return Array.from({ length: 129 }, (_, index) => {
      const angle = (index / 128) * Math.PI * 2
      return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
    })
  }, [radius])

  return <Line points={points} color="#6bbfff" transparent opacity={0.18} lineWidth={1} />
}
