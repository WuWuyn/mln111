import { Stars } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

// Sân khấu 3D cho "Trạm Thực tiễn": tên lửa thật (mesh) phụt lửa + tia lửa/khói,
// rung khi đốt, vọt lên khi quá mạnh, nổ khi rơi, đáp êm khi đúng. Toàn bộ hoạt
// ảnh chạy trong useFrame, đọc state qua refs nên không re-render mỗi frame.

const HOVER_Y = 0.6
const PAD_Y = -1.25
const TOP_Y = 7.6
const CRASH_Y = -1.45
const N = 120 // số hạt lửa/khói

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)
const easeIn = (t) => t * t * t
const lerp = (a, b, t) => a + (b - a) * t

// Bắn toàn bộ hạt ra theo hình cầu khi tên lửa rơi vỡ.
function explode(parts) {
  const { pos, vel, life } = parts
  for (let i = 0; i < N; i += 1) {
    const i3 = i * 3
    pos[i3] = 0
    pos[i3 + 1] = CRASH_Y + 0.2
    pos[i3 + 2] = 0
    const a = Math.random() * Math.PI * 2
    const u = Math.random() * 2 - 1
    const r = Math.sqrt(1 - u * u)
    const s = 3 + Math.random() * 4
    vel[i3] = r * Math.cos(a) * s
    vel[i3 + 1] = Math.abs(u) * s * 0.7 + 1.5
    vel[i3 + 2] = r * Math.sin(a) * s
    life[i] = 0.6 + Math.random() * 0.5
  }
}

// Cập nhật dòng tia lửa/khói phụt xuống từ vòi phun.
function updateParticles(parts, geom, dt, emit, rate, originY) {
  if (!geom) return
  const { pos, vel, life } = parts
  let toEmit = emit ? rate : 0
  for (let i = 0; i < N; i += 1) {
    const i3 = i * 3
    if (life[i] > 0) {
      life[i] -= dt
      pos[i3] += vel[i3] * dt
      pos[i3 + 1] += vel[i3 + 1] * dt
      pos[i3 + 2] += vel[i3 + 2] * dt
      vel[i3 + 1] -= 1.6 * dt
    } else if (toEmit > 0) {
      toEmit -= 1
      pos[i3] = (Math.random() - 0.5) * 0.12
      pos[i3 + 1] = originY
      pos[i3 + 2] = (Math.random() - 0.5) * 0.12
      vel[i3] = (Math.random() - 0.5) * 1.3
      vel[i3 + 1] = -2.2 - Math.random() * 2.4
      vel[i3 + 2] = (Math.random() - 0.5) * 1.3
      life[i] = 0.35 + Math.random() * 0.45
    } else {
      pos[i3 + 1] = -999 // đậu ngoài khung
    }
  }
  geom.attributes.position.needsUpdate = true
}

function Rocket({ refs }) {
  const group = useRef()
  const flame = useRef()
  const flameInner = useRef()
  const flameLight = useRef()
  const points = useRef()
  const ph = useRef({ run: -1, t: 0, exploded: false })

  const parts = useMemo(
    () => ({ pos: new Float32Array(N * 3), vel: new Float32Array(N * 3), life: new Float32Array(N) }),
    [],
  )

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const g = group.current
    if (!g) return

    const thrust = refs.thrust.current
    const run = refs.run.current
    const p = ph.current
    if (run !== p.run) {
      p.run = run
      p.t = 0
      p.exploded = false
    }
    p.t += dt
    const t = p.t
    const time = state.clock.elapsedTime
    const oc = run === 0 ? null : refs.outcome.current

    let y
    let rot = 0
    let flameK = 0.3 + thrust * 1.25
    let visible = true
    let emit = true

    if (oc === 'land') {
      const k = clamp01(t / 1.4)
      y = lerp(HOVER_Y, PAD_Y, easeOut(k))
      flameK = (0.3 + thrust * 1.2) * (1 - clamp01((k - 0.78) / 0.22))
      if (k >= 1) emit = false
    } else if (oc === 'over') {
      const k = clamp01(t / 1.7)
      y = lerp(HOVER_Y, TOP_Y, easeIn(k))
      flameK = 0.9 + thrust * 1.9
      rot = Math.sin(time * 9) * 0.02
      if (k >= 1) visible = false
    } else if (oc === 'under') {
      const k = clamp01(t / 1.25)
      y = lerp(HOVER_Y, CRASH_Y, easeIn(k))
      flameK = (0.15 + thrust * 0.35) * (0.5 + Math.abs(Math.sin(time * 32)) * 0.7) // sặc sụa
      if (k >= 1) {
        if (!p.exploded) {
          explode(parts)
          p.exploded = true
        }
        visible = false
        emit = false
      }
    } else {
      // Đang ngắm: lơ lửng phụt lửa giữ thăng bằng (biên độ to hơn khi lực mạnh).
      y = HOVER_Y + Math.sin(time * 1.6) * 0.12 * (0.6 + thrust) + Math.sin(time * 0.9 + 1.3) * 0.05
      rot = Math.sin(time * 1.1) * 0.05 + Math.sin(time * 2.3) * 0.02
    }

    g.position.y = y
    g.rotation.z = rot
    g.visible = visible

    // Rung camera khi luồng lửa mạnh.
    const shake = Math.min(flameK, 2.2) * 0.012
    state.camera.position.x = Math.sin(time * 41) * shake
    state.camera.position.y = 1.25 + Math.cos(time * 37) * shake
    state.camera.lookAt(0, 0.4, 0)

    // Ngọn lửa nhấp nháy.
    const flick = 0.82 + Math.sin(time * 36) * 0.18
    const showFlame = visible && flameK > 0.05
    if (flame.current) {
      flame.current.visible = showFlame
      flame.current.scale.set(0.9 + thrust * 0.25, Math.max(0.001, flameK * flick), 0.9 + thrust * 0.25)
    }
    if (flameInner.current) {
      flameInner.current.visible = showFlame
      flameInner.current.scale.set(1, Math.max(0.001, flameK * flick * 0.7), 1)
    }
    if (flameLight.current) flameLight.current.intensity = showFlame ? flameK * 6 * flick : 0

    updateParticles(parts, points.current?.geometry, dt, emit && visible && flameK > 0.1, Math.floor(flameK * 6), y - 1.0)
  })

  return (
    <>
      <group ref={group} position={[0, HOVER_Y, 0]}>
        {/* Thân */}
        <mesh>
          <cylinderGeometry args={[0.32, 0.37, 1.3, 28]} />
          <meshStandardMaterial color="#eef3ff" metalness={0.55} roughness={0.32} />
        </mesh>
        {/* Sọc trang trí */}
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.331, 0.331, 0.18, 28]} />
          <meshStandardMaterial color="#e8c354" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Chóp */}
        <mesh position={[0, 0.98, 0]}>
          <coneGeometry args={[0.32, 0.72, 28]} />
          <meshStandardMaterial color="#e46b56" metalness={0.4} roughness={0.42} />
        </mesh>
        {/* Cửa sổ */}
        <mesh position={[0, 0.32, 0.33]}>
          <sphereGeometry args={[0.12, 18, 18]} />
          <meshStandardMaterial color="#bfeeff" emissive="#2b6f8c" emissiveIntensity={0.7} metalness={0.3} roughness={0.18} />
        </mesh>
        {/* 3 cánh đuôi */}
        {[0, 1, 2].map((i) => {
          const a = (i * Math.PI * 2) / 3
          return (
            <mesh key={i} position={[Math.cos(a) * 0.33, -0.56, Math.sin(a) * 0.33]} rotation={[0, -a, 0]}>
              <boxGeometry args={[0.04, 0.5, 0.36]} />
              <meshStandardMaterial color="#9fb2c8" metalness={0.45} roughness={0.5} />
            </mesh>
          )
        })}
        {/* Vòi phun */}
        <mesh position={[0, -0.82, 0]}>
          <cylinderGeometry args={[0.18, 0.28, 0.32, 22]} />
          <meshStandardMaterial color="#2a3b54" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Lửa ngoài + lửa trong (additive) */}
        <mesh ref={flame} position={[0, -1.42, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.24, 1, 20, 1, true]} />
          <meshBasicMaterial color="#ffae3b" transparent opacity={0.82} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <mesh ref={flameInner} position={[0, -1.28, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.13, 0.72, 16, 1, true]} />
          <meshBasicMaterial color="#fff3a5" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <pointLight ref={flameLight} position={[0, -1.5, 0]} color="#ffb24d" distance={7} intensity={3} />
      </group>

      {/* Tia lửa / khói phụt — ở không gian cảnh, không nằm trong nhóm tên lửa */}
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={N} array={parts.pos} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.13} color="#ffba4d" transparent opacity={0.9} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
    </>
  )
}

// Các vị trí alien nhô lên quanh rìa hành tinh (x, z) — sau/bên bệ đáp.
const ALIEN_SPOTS = [
  [-2.4, -1.6],
  [2.5, -1.2],
  [-1.3, -2.3],
  [1.7, -2.0],
  [3.0, 0.3],
  [-3.0, 0.1],
]

// Alien xanh lấm ló: nhô lên ở một chỗ, ngó nghiêng tò mò, rồi thụt xuống và
// hiện ở chỗ khác. Toàn bộ trong useFrame, theo chu kỳ thời gian.
function Alien() {
  const group = useRef()

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const time = state.clock.elapsedTime
    const period = 4.6
    const idx = Math.floor(time / period) % ALIEN_SPOTS.length
    const lt = time % period

    // Bao hình "lấm ló": nhô lên → giữ → thụt xuống → ẩn.
    let p
    if (lt < 0.8) p = easeOut(lt / 0.8)
    else if (lt < 3.0) p = 1
    else if (lt < 3.8) p = 1 - easeIn((lt - 3.0) / 0.8)
    else p = 0

    const [x, z] = ALIEN_SPOTS[idx]
    const bob = p > 0.5 ? Math.sin(time * 3) * 0.05 : 0
    g.position.set(x, lerp(PAD_Y - 0.7, PAD_Y + 0.45, p) + bob, z)
    g.scale.setScalar(0.0001 + p * 0.62)
    g.visible = p > 0.01
    g.rotation.y = Math.sin(time * 1.6) * 0.32 // ngó qua ngó lại
    g.rotation.z = Math.sin(time * 2.3) * 0.05
  })

  return (
    <group ref={group} visible={false}>
      {/* Đầu */}
      <mesh>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshStandardMaterial color="#86e3a6" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Mắt to + đốm sáng */}
      {[-0.16, 0.16].map((dx, i) => (
        <group key={i} position={[dx, 0.05, 0.34]}>
          <mesh>
            <sphereGeometry args={[0.13, 18, 18]} />
            <meshStandardMaterial color="#0c1020" roughness={0.2} metalness={0.3} />
          </mesh>
          <mesh position={[0.04, 0.05, 0.1]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* Miệng nhỏ */}
      <mesh position={[0, -0.2, 0.37]}>
        <boxGeometry args={[0.13, 0.03, 0.02]} />
        <meshBasicMaterial color="#0c1020" toneMapped={false} />
      </mesh>
      {/* Ăng-ten phát sáng */}
      {[-0.14, 0.14].map((dx, i) => (
        <group key={`a${i}`} position={[dx, 0.36, 0]} rotation={[0, 0, dx < 0 ? 0.32 : -0.32]}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.26, 8]} />
            <meshStandardMaterial color="#5fae7e" />
          </mesh>
          <mesh position={[0, 0.27, 0]}>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial color="#ffe07a" emissive="#ffb24d" emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* Hai bàn tay bám mép */}
      {[-0.34, 0.34].map((dx, i) => (
        <mesh key={`h${i}`} position={[dx, -0.34, 0.22]}>
          <sphereGeometry args={[0.085, 12, 12]} />
          <meshStandardMaterial color="#86e3a6" roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

export default function RocketStage({ thrust, run, outcome, built }) {
  // Mỗi giá trị một ref (mutate ref trong effect là hợp lệ); vòng useFrame đọc
  // .current để khỏi re-render mỗi frame.
  const thrustRef = useRef(0)
  const runRef = useRef(0)
  const outcomeRef = useRef(null)
  const builtRef = useRef(false)
  const refs = { thrust: thrustRef, run: runRef, outcome: outcomeRef, built: builtRef }

  useEffect(() => {
    thrustRef.current = thrust / 100
    runRef.current = run
    outcomeRef.current = outcome
    builtRef.current = built
  })

  return (
    <Canvas className="rocket-canvas" camera={{ position: [0, 1.25, 6.2], fov: 42 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} color="#dceeff" />
      <Stars radius={40} depth={30} count={1200} factor={3} saturation={0} fade speed={0.6} />

      {/* Mặt đất hành tinh + bệ đáp */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, PAD_Y - 0.05, 0]}>
        <circleGeometry args={[7, 48]} />
        <meshStandardMaterial color="#21324f" metalness={0.2} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, PAD_Y, 0]}>
        <ringGeometry args={[0.5, 0.9, 32]} />
        <meshBasicMaterial color="#e8c354" transparent opacity={0.75} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>

      <Rocket refs={refs} />
      <Alien />
    </Canvas>
  )
}
