import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useRef } from 'react'
import IntroTimeMachine from './IntroTimeMachine'
import './WarpIntro.css'

// Cinematic mở màn (~6s): tàu bay trong không gian -> tăng tốc vận tốc ánh sáng
// -> điểm kỳ dị -> BIG BANG -> bàn giao cho vũ trụ 3D hình thành quỹ đạo.
// Vẽ hoàn toàn trên một <canvas> 2D riêng (không phụ thuộc Three.js) nên chạy
// mượt độc lập với việc scene 3D nặng đang tải/khởi tạo phía dưới.

const PHASE = {
  cruiseEnd: 1500, // 0 -> 1.5s: tàu vi hành thong thả
  warpEnd: 3600, //   1.5 -> 3.6s: lao vào tốc độ ánh sáng (sao kéo thành vệt)
  collapseEnd: 4300, // 3.6 -> 4.3s: mọi thứ bị hút về điểm kỳ dị
  flashEnd: 4800, //  4.3 -> 4.8s: chớp sáng Big Bang
  end: 6000, //       4.8 -> 6.0s: vụ nổ tản ra, lộ vũ trụ 3D đang hình thành
}
// Báo cho scene 3D bắt đầu "mọc" hành tinh ngay tại đỉnh chớp sáng, để khi vụ
// nổ tản ra thì các hành tinh đã ló ra như sinh ra từ Big Bang.
const REVEAL_AT = 4350

const CAPTIONS = [
  { until: PHASE.cruiseEnd, text: 'Khởi hành vào không gian sâu thẳm', cls: 'is-cruise' },
  { until: PHASE.warpEnd, text: 'Tăng tốc — vận tốc ánh sáng', cls: 'is-warp' },
  { until: PHASE.collapseEnd, text: 'Điểm kỳ dị nguyên thủy', cls: 'is-collapse' },
  // Khoảnh khắc bùng nổ: không chữ, để tia sáng + chớp tự kể.
  { until: PHASE.flashEnd, text: '', cls: 'is-bang' },
  { until: PHASE.end, text: 'Vũ trụ hình thành quỹ đạo', cls: 'is-form' },
]

const STAR_COUNT = 620
const DEBRIS_COUNT = 200
const DEBRIS_PALETTE = [
  [255, 246, 224],
  [255, 209, 138],
  [255, 150, 92],
  [255, 110, 170],
  [150, 196, 255],
]

const smoothstep = (t) => t * t * (3 - 2 * t)
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

export default function WarpIntro({ onReveal, onDone, onSkip }) {
  const canvasRef = useRef(null)
  const captionRef = useRef(null)
  const rootRef = useRef(null)
  // Thời gian intro (ms) dùng chung: vòng lặp 2D ghi vào, lớp 3D đọc ra để cỗ
  // máy thời gian (model) bay đồng bộ tuyệt đối với hiệu ứng warp 2D.
  const shipTRef = useRef(0)
  // onReveal/onDone đọc qua ref để vòng lặp rAF không phải resubscribe.
  const cb = useRef({ onReveal, onDone })
  useEffect(() => {
    cb.current = { onReveal, onDone }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let w = 0
    let h = 0
    let cx = 0
    let cy = 0
    let focal = 0
    let dpr = 1

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      w = window.innerWidth
      h = window.innerHeight
      cx = w / 2
      cy = h / 2
      focal = Math.min(w, h) * 0.5
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const makeStar = () => ({
      a: Math.random() * Math.PI * 2,
      r: Math.sqrt(Math.random()), // phân bố đều theo diện tích
      z: 0.1 + Math.random() * 0.9,
    })
    const stars = Array.from({ length: STAR_COUNT }, makeStar)
    let debris = null

    const initDebris = () => {
      debris = Array.from({ length: DEBRIS_COUNT }, () => {
        const tone = DEBRIS_PALETTE[(Math.random() * DEBRIS_PALETTE.length) | 0]
        return {
          a: Math.random() * Math.PI * 2,
          speed: (120 + Math.random() * 760) * (Math.min(w, h) / 720),
          size: 1 + Math.random() * 3.2,
          tone,
          alpha: 0.55 + Math.random() * 0.45,
        }
      })
    }

    // Cỗ máy thời gian giờ được dựng bằng MODEL 3D thật (xem component
    // IntroTimeMachine + lớp <Canvas> overlay trong phần return). Canvas 2D này
    // chỉ còn lo nền sao warp / điểm kỳ dị / Big Bang, không vẽ tàu nữa.

    const drawVignette = () => {
      const g = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.25, cx, cy, Math.max(w, h) * 0.7)
      g.addColorStop(0, 'rgba(0,0,0,0)')
      g.addColorStop(1, 'rgba(0,0,0,0.55)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    }

    const drawWarp = (t, dt) => {
      const warpT = t > PHASE.cruiseEnd ? clamp01((t - PHASE.cruiseEnd) / (PHASE.warpEnd - PHASE.cruiseEnd)) : 0
      const warpE = smoothstep(warpT)
      // nền mờ dần để tạo vệt sao; warp càng mạnh, vệt càng dài
      ctx.fillStyle = `rgba(2,4,11,${0.42 - 0.28 * warpE})`
      ctx.fillRect(0, 0, w, h)

      const speed = 0.05 + warpE * 1.85
      ctx.lineCap = 'round'
      for (let i = 0; i < stars.length; i += 1) {
        const star = stars[i]
        const prevSpread = focal / star.z
        star.z -= speed * dt
        if (star.z < 0.04) {
          stars[i] = makeStar()
          stars[i].z = 1
          continue
        }
        const spread = focal / star.z
        const dx = Math.cos(star.a) * star.r
        const dy = Math.sin(star.a) * star.r
        const sx = cx + dx * spread
        const sy = cy + dy * spread
        const px = cx + dx * prevSpread
        const py = cy + dy * prevSpread
        const depth = 1 - star.z
        ctx.strokeStyle = `rgba(${200 + depth * 55},${214 + depth * 30},255,${0.18 + 0.82 * depth})`
        ctx.lineWidth = (0.5 + depth * 2.3) * (0.6 + warpT)
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(sx, sy)
        ctx.stroke()
      }

      drawVignette()
    }

    const drawCollapse = (t) => {
      const ct = clamp01((t - PHASE.warpEnd) / (PHASE.collapseEnd - PHASE.warpEnd))
      const e = smoothstep(ct)
      ctx.fillStyle = 'rgba(2,4,11,0.5)'
      ctx.fillRect(0, 0, w, h)

      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < stars.length; i += 1) {
        const star = stars[i]
        const spread = (focal / star.z) * (1 - e)
        const sx = cx + Math.cos(star.a) * star.r * spread
        const sy = cy + Math.sin(star.a) * star.r * spread
        ctx.fillStyle = `rgba(210,228,255,${0.5 * (1 - e) + 0.2})`
        ctx.fillRect(sx - 1, sy - 1, 2, 2)
      }

      // lõi kỳ dị lớn dần
      const coreR = 8 + e * 120
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR)
      core.addColorStop(0, `rgba(255,255,255,${0.8 * e + 0.2})`)
      core.addColorStop(0.4, `rgba(255,224,170,${0.5 * e})`)
      core.addColorStop(1, 'rgba(255,150,90,0)')
      ctx.fillStyle = core
      ctx.beginPath()
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
    }

    // Tia sáng bùng nổ (starburst) toả ra từ tâm — tia dài/ngắn xen kẽ, xoay nhẹ.
    const drawRays = (len, alpha, rot, count = 16) => {
      if (alpha <= 0.01) return
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rot)
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'round'
      for (let i = 0; i < count; i += 1) {
        const ang = (i / count) * Math.PI * 2
        const long = i % 2 === 0
        const rl = len * (long ? 1 : 0.5)
        const ex = Math.cos(ang) * rl
        const ey = Math.sin(ang) * rl
        const grad = ctx.createLinearGradient(0, 0, ex, ey)
        grad.addColorStop(0, `rgba(255,252,238,${alpha})`)
        grad.addColorStop(0.45, `rgba(255,224,165,${alpha * 0.55})`)
        grad.addColorStop(1, 'rgba(255,180,110,0)')
        ctx.strokeStyle = grad
        ctx.lineWidth = long ? 3.2 : 1.4
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(ex, ey)
        ctx.stroke()
      }
      // restore() khôi phục cả composite + lineCap về trạng thái trước đó.
      ctx.restore()
    }

    const drawFlash = (t) => {
      const ft = clamp01((t - PHASE.collapseEnd) / (PHASE.flashEnd - PHASE.collapseEnd))
      ctx.fillStyle = '#02040b'
      ctx.fillRect(0, 0, w, h)

      // lõi siêu sáng
      ctx.globalCompositeOperation = 'lighter'
      const coreR = 120 + ft * Math.max(w, h) * 0.5
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR)
      core.addColorStop(0, 'rgba(255,255,255,1)')
      core.addColorStop(0.5, 'rgba(255,236,200,0.7)')
      core.addColorStop(1, 'rgba(255,170,110,0)')
      ctx.fillStyle = core
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'source-over'

      // chớp trắng toàn màn hình: dâng nhanh, giữ sáng vào lúc nổ
      const env = ft < 0.45 ? ft / 0.45 : 1 - (ft - 0.45) / 0.55 * 0.35
      ctx.fillStyle = `rgba(255,250,242,${clamp01(env)})`
      ctx.fillRect(0, 0, w, h)

      // tia sáng nở ra cùng chớp
      drawRays(Math.max(w, h) * (0.32 + ft * 0.7), Math.sin(clamp01(ft) * Math.PI) * 0.85, t * 0.0004)
    }

    const drawExplode = (t) => {
      if (!debris) initDebris()
      const et = clamp01((t - PHASE.flashEnd) / (PHASE.end - PHASE.flashEnd))
      const out = 1 - (1 - et) * (1 - et) // ease-out
      ctx.clearRect(0, 0, w, h) // trong suốt -> lộ vũ trụ 3D phía dưới
      ctx.globalCompositeOperation = 'lighter'

      // tàn dư chớp sáng che vết nối flash -> explode
      const bang = clamp01(1 - et / 0.32)
      if (bang > 0) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6)
        g.addColorStop(0, `rgba(255,252,245,${bang})`)
        g.addColorStop(0.5, `rgba(255,226,180,${bang * 0.5})`)
        g.addColorStop(1, 'rgba(255,170,110,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }

      // tia sáng toả ra rồi tan dần khi vũ trụ hiện hình
      drawRays(Math.max(w, h) * (0.55 + et * 0.7), bang * 0.9, t * 0.0004)

      // sóng xung kích
      const ringR = out * Math.max(w, h) * 0.85
      ctx.strokeStyle = `rgba(255,222,180,${(1 - et) * 0.5})`
      ctx.lineWidth = (1 - et) * 16 + 1
      ctx.beginPath()
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
      ctx.stroke()

      // mảnh vật chất bắn ra tứ phía
      for (let i = 0; i < debris.length; i += 1) {
        const p = debris[i]
        const dist = p.speed * out
        const x = cx + Math.cos(p.a) * dist
        const y = cy + Math.sin(p.a) * dist
        const a = clamp01((1 - et) * p.alpha)
        const [r, g, b] = p.tone
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`
        ctx.beginPath()
        ctx.arc(x, y, p.size * (0.6 + et * 1.6), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    let raf = 0
    let start = 0
    let last = 0
    let revealed = false
    let bgCleared = false
    let captionIdx = -1

    const updateCaption = (t) => {
      let idx = CAPTIONS.length - 1
      for (let i = 0; i < CAPTIONS.length; i += 1) {
        if (t < CAPTIONS[i].until) {
          idx = i
          break
        }
      }
      if (idx === captionIdx) return
      captionIdx = idx
      const node = captionRef.current
      if (node) {
        node.textContent = CAPTIONS[idx].text
        node.className = `warp-intro__caption ${CAPTIONS[idx].cls}`
      }
    }

    const frame = (now) => {
      if (!start) {
        start = now
        last = now
      }
      const t = now - start
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      shipTRef.current = t // cho lớp 3D đọc để bay đồng bộ

      updateCaption(t)

      if (t < PHASE.warpEnd) drawWarp(t, dt)
      else if (t < PHASE.collapseEnd) drawCollapse(t)
      else if (t < PHASE.flashEnd) drawFlash(t)
      else {
        // Pha nổ: canvas vẽ trong suốt, nên bỏ luôn nền đục của lớp phủ để lộ
        // vũ trụ 3D đang hình thành phía dưới.
        if (!bgCleared && rootRef.current) {
          bgCleared = true
          rootRef.current.style.background = 'transparent'
        }
        drawExplode(t)
      }

      if (!revealed && t >= REVEAL_AT) {
        revealed = true
        cb.current.onReveal?.()
      }

      if (t >= PHASE.end) {
        ctx.clearRect(0, 0, w, h)
        if (rootRef.current) rootRef.current.classList.add('is-ending')
        cb.current.onDone?.()
        return
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="warp-intro" ref={rootRef} aria-hidden="true">
      <canvas ref={canvasRef} className="warp-intro__canvas" />
      {/* Cỗ máy thời gian 3D bay đè lên nền warp, trong suốt để lộ sao phía sau.
          Đồng bộ với timeline 2D qua shipTRef. */}
      <Canvas
        className="warp-intro__model"
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[3, 5, 4]} intensity={1.5} color="#dfefff" />
        <pointLight position={[-4, -2, 3]} intensity={0.7} color="#9ab8ff" />
        <Suspense fallback={null}>
          <IntroTimeMachine tRef={shipTRef} />
        </Suspense>
      </Canvas>
      <p ref={captionRef} className="warp-intro__caption is-cruise">
        Khởi hành vào không gian sâu thẳm
      </p>
      <button type="button" className="warp-intro__skip" onClick={onSkip}>
        Bỏ qua ›
      </button>
    </div>
  )
}
