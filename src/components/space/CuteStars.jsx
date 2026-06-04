import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { seededRandom } from './random'

/**
 * Vài "con sao" có mặt cute đang lơ lửng trong vũ trụ. Mỗi sao là một ngôi sao
 * 5 cánh bo tròn màu vàng phát sáng, mặt được vẽ trên canvas texture nên có thể
 * ĐỔI BIỂU CẢM theo thời gian: chớp mắt, cười toe (^‿^), nháy mắt, ngạc nhiên
 * (O o), mắt tim (♥ ♥), ngái ngủ... Cả con sao luôn quay mặt về phía camera
 * (billboard) để lúc nào cũng thấy mặt, đồng thời bồng bềnh & lắc lư nhẹ.
 */

// ---- Thân ngôi sao: hình 5 cánh, dựng một lần để tái dùng ----
function makeStarGeometry(outer = 0.62, inner = 0.27, points = 5) {
  const shape = new THREE.Shape()
  const step = Math.PI / points
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = i * step - Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 4,
    curveSegments: 8,
  })
  geometry.center()
  return geometry
}

const STAR_GEOMETRY = makeStarGeometry()
const FACE_Z = 0.22 // nhô khuôn mặt ra trước thân sao

// ---- Vẽ các khuôn mặt kawaii lên canvas, mỗi biểu cảm 1 texture ----
const S = 256 // cạnh canvas
const EYE_Y = 104
const EYE_LX = 92
const EYE_RX = 164
const MOUTH_Y = 150
const INK = '#241405'

function newCtx() {
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  return canvas.getContext('2d')
}

function drawCheeks(ctx) {
  ctx.fillStyle = 'rgba(255,120,150,0.55)'
  ctx.beginPath()
  ctx.ellipse(58, 134, 16, 11, 0, 0, Math.PI * 2)
  ctx.ellipse(198, 134, 16, 11, 0, 0, Math.PI * 2)
  ctx.fill()
}

function roundEye(ctx, x, r = 18) {
  ctx.fillStyle = INK
  ctx.beginPath()
  ctx.arc(x, EYE_Y, r, 0, Math.PI * 2)
  ctx.fill()
  // đốm sáng lấp lánh
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(x - r * 0.32, EYE_Y - r * 0.34, r * 0.34, 0, Math.PI * 2)
  ctx.fill()
}

// Mắt "∩" (cười híp) — nửa trên hình tròn.
function happyEye(ctx, x) {
  ctx.strokeStyle = INK
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(x, EYE_Y + 4, 17, Math.PI, Math.PI * 2)
  ctx.stroke()
}

// Mắt nhắm: gạch ngang.
function lineEye(ctx, x) {
  ctx.strokeStyle = INK
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x - 16, EYE_Y + 2)
  ctx.lineTo(x + 16, EYE_Y + 2)
  ctx.stroke()
}

function heartEye(ctx, x) {
  const r = 13
  ctx.fillStyle = '#ff5d7a'
  ctx.beginPath()
  ctx.moveTo(x, EYE_Y + r)
  ctx.bezierCurveTo(x - r * 1.6, EYE_Y - r * 0.4, x - r * 0.6, EYE_Y - r * 1.5, x, EYE_Y - r * 0.4)
  ctx.bezierCurveTo(x + r * 0.6, EYE_Y - r * 1.5, x + r * 1.6, EYE_Y - r * 0.4, x, EYE_Y + r)
  ctx.fill()
}

function smile(ctx, w = 26) {
  ctx.strokeStyle = INK
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(128, MOUTH_Y - 6, w, 0.15 * Math.PI, 0.85 * Math.PI)
  ctx.stroke()
}

function openSmile(ctx) {
  ctx.fillStyle = INK
  ctx.beginPath()
  ctx.arc(128, MOUTH_Y - 4, 22, 0.05 * Math.PI, 0.95 * Math.PI)
  ctx.closePath()
  ctx.fill()
  // lưỡi
  ctx.fillStyle = '#ff7d97'
  ctx.beginPath()
  ctx.arc(128, MOUTH_Y + 14, 11, Math.PI, Math.PI * 2)
  ctx.fill()
}

function ohMouth(ctx) {
  ctx.fillStyle = INK
  ctx.beginPath()
  ctx.arc(128, MOUTH_Y + 2, 14, 0, Math.PI * 2)
  ctx.fill()
}

// Bộ biểu cảm: hàm vẽ trả về cho mỗi loại mặt.
const FACE_DRAWERS = {
  normal(ctx) {
    drawCheeks(ctx)
    roundEye(ctx, EYE_LX)
    roundEye(ctx, EYE_RX)
    smile(ctx, 24)
  },
  happy(ctx) {
    drawCheeks(ctx)
    happyEye(ctx, EYE_LX)
    happyEye(ctx, EYE_RX)
    openSmile(ctx)
  },
  wink(ctx) {
    drawCheeks(ctx)
    happyEye(ctx, EYE_LX)
    roundEye(ctx, EYE_RX)
    smile(ctx, 26)
  },
  surprised(ctx) {
    drawCheeks(ctx)
    roundEye(ctx, EYE_LX, 22)
    roundEye(ctx, EYE_RX, 22)
    ohMouth(ctx)
  },
  love(ctx) {
    drawCheeks(ctx)
    heartEye(ctx, EYE_LX)
    heartEye(ctx, EYE_RX)
    openSmile(ctx)
  },
  sleepy(ctx) {
    drawCheeks(ctx)
    lineEye(ctx, EYE_LX)
    lineEye(ctx, EYE_RX)
    smile(ctx, 16)
  },
  blink(ctx) {
    drawCheeks(ctx)
    lineEye(ctx, EYE_LX)
    lineEye(ctx, EYE_RX)
    smile(ctx, 22)
  },
}

function buildFaceTextures() {
  const textures = {}
  for (const [type, draw] of Object.entries(FACE_DRAWERS)) {
    const ctx = newCtx()
    draw(ctx)
    const texture = new THREE.CanvasTexture(ctx.canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    textures[type] = texture
  }
  return textures
}

// Vòng lặp biểu cảm chính của mỗi con sao (xen kẽ "normal" cho đỡ loạn).
const EXPRESSION_CYCLE = ['normal', 'happy', 'normal', 'wink', 'surprised', 'normal', 'love', 'sleepy']

// ---- Hiệu ứng nổ ----
const PARTICLES = 70 // số mảnh vỡ
const SPREAD = 3.2 // bán kính văng tối đa
const EXPLODE_DUR = 1.0 // thời gian mảnh vỡ bay + tan (giây)
const RESET_AT = 2.0 // sau bao lâu thì sao hồi sinh (giây)

// 3 con sao: vị trí, kích thước, màu, nhịp khác nhau.
const STARS = [
  { id: 0, position: [-7.5, 4.2, 3.5], scale: 1.0, color: '#ffe07a', bob: 0.55, phase: 0.0, spin: 0.35 },
  { id: 1, position: [8.4, 5.6, -4.2], scale: 0.72, color: '#ffd166', bob: 0.7, phase: 1.9, spin: -0.45 },
  { id: 2, position: [2.6, 6.6, 6.4], scale: 0.85, color: '#ffe9a8', bob: 0.45, phase: 3.5, spin: 0.28 },
]

function CuteStar({ id, position, scale, color, bob, phase, spin, faceTextures }) {
  const group = useRef()
  const faceMaterial = useRef()
  const currentType = useRef('')
  const points = useRef()
  const pointsMaterial = useRef()
  const flashLight = useRef()
  const baseY = position[1]

  const [alive, setAlive] = useState(true)
  // { active, start } — start = -1 nghĩa là chờ frame kế để lấy mốc thời gian.
  const explosion = useRef({ active: false, start: -1 })

  // Hướng văng + tốc độ của từng mảnh vỡ (cố định), và mảng vị trí cập nhật mỗi frame.
  const { dirs, speeds, positions } = useMemo(() => {
    const dirsArray = new Float32Array(PARTICLES * 3)
    const speedsArray = new Float32Array(PARTICLES)
    const positionsArray = new Float32Array(PARTICLES * 3)
    const base = (id + 1) * 911
    for (let i = 0; i < PARTICLES; i += 1) {
      const i3 = i * 3
      // Hướng ngẫu nhiên đều trên mặt cầu (seeded — thuần tuý khi render).
      const u = seededRandom(base + i * 3 + 1) * 2 - 1
      const a = seededRandom(base + i * 3 + 2) * Math.PI * 2
      const r = Math.sqrt(1 - u * u)
      dirsArray[i3] = r * Math.cos(a)
      dirsArray[i3 + 1] = u
      dirsArray[i3 + 2] = r * Math.sin(a)
      speedsArray[i] = 0.6 + seededRandom(base + i * 3 + 3) * 0.7
    }
    return { dirs: dirsArray, speeds: speedsArray, positions: positionsArray }
  }, [id])

  const handleClick = (event) => {
    event.stopPropagation()
    if (!alive || explosion.current.active) return
    setAlive(false)
    explosion.current = { active: true, start: -1 }
  }

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const node = group.current
    if (!node) return

    // --- chuyển động bồng bềnh + billboard + lắc lư (luôn chạy) ---
    node.position.y = baseY + Math.sin(t * 0.7 + phase) * bob
    node.position.x = position[0] + Math.cos(t * 0.4 + phase) * 0.25
    node.quaternion.copy(state.camera.quaternion)
    node.rotateZ(Math.sin(t * spin + phase) * 0.18)

    if (alive) {
      // --- chọn biểu cảm ---
      const local = t + phase * 2.0
      const idx = Math.floor(local / 2.4) % EXPRESSION_CYCLE.length
      let type = EXPRESSION_CYCLE[idx]
      const blink = (local % 3.3) < 0.13
      if (blink && (type === 'normal' || type === 'happy' || type === 'wink')) {
        type = 'blink'
      }
      if (type !== currentType.current && faceMaterial.current) {
        currentType.current = type
        faceMaterial.current.map = faceTextures[type]
        faceMaterial.current.needsUpdate = true
      }
      return
    }

    // --- hiệu ứng nổ (khi !alive) ---
    const exp = explosion.current
    if (!exp.active) return
    if (exp.start < 0) exp.start = t
    const e = t - exp.start
    const k = Math.min(e / EXPLODE_DUR, 1)
    const eased = 1 - Math.pow(1 - k, 3) // bung nhanh rồi chậm dần

    const arr = points.current.geometry.attributes.position.array
    for (let i = 0; i < PARTICLES; i += 1) {
      const i3 = i * 3
      const d = eased * SPREAD * speeds[i]
      arr[i3] = dirs[i3] * d
      arr[i3 + 1] = dirs[i3 + 1] * d - 0.5 * k * k // chút trọng lực
      arr[i3 + 2] = dirs[i3 + 2] * d
    }
    points.current.geometry.attributes.position.needsUpdate = true

    pointsMaterial.current.opacity = Math.max(0, 1 - k)
    pointsMaterial.current.size = 0.05 + 0.18 * (1 - k)
    flashLight.current.intensity = Math.max(0, 9 * (1 - e / 0.35)) // lóe sáng lúc đầu

    if (e >= RESET_AT) {
      // hồi sinh: dọn mảnh vỡ, reset biểu cảm, hiện lại con sao.
      exp.active = false
      currentType.current = ''
      setAlive(true)
    }
  })

  return (
    <group ref={group} position={position} scale={scale}>
      {/* Thân + mặt: chỉ hiện khi còn sống, click để nổ */}
      {alive && (
        <group onClick={handleClick} onPointerDown={handleClick}>
          <mesh geometry={STAR_GEOMETRY}>
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.9}
              roughness={0.35}
              metalness={0.1}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, 0.02, FACE_Z]}>
            <planeGeometry args={[0.98, 0.98]} />
            <meshBasicMaterial
              ref={faceMaterial}
              map={faceTextures.normal}
              transparent
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <pointLight color={color} intensity={2.2} distance={6} />
        </group>
      )}

      {/* Mảnh vỡ khi nổ */}
      <points ref={points} visible={!alive}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLES}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={pointsMaterial}
          color={color}
          size={0.18}
          sizeAttenuation
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
      {/* Ánh lóe lúc nổ */}
      <pointLight ref={flashLight} color={color} intensity={0} distance={10} />
    </group>
  )
}

export default function CuteStars() {
  // Texture biểu cảm dùng chung cho cả 3 con sao, tạo một lần.
  const faceTextures = useMemo(() => buildFaceTextures(), [])

  return (
    <group>
      {STARS.map((star) => (
        <CuteStar key={star.id} {...star} faceTextures={faceTextures} />
      ))}
    </group>
  )
}
