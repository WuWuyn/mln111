import { useEffect, useRef } from 'react'
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

    // --- Cỗ máy thời gian của Doraemon (Nobita + Doraemon ngồi trên) ---
    // Vẽ hoàn toàn bằng canvas 2D, đơn vị toạ độ ~[-1, 1]. Mũi/đuôi thời gian
    // hướng xuống (+y) như luồng đẩy, hai nhân vật quay mặt ra ngoài để nhận diện.
    const drawShip = (t) => {
      const cruiseT = clamp01(t / PHASE.cruiseEnd)
      let px = cx
      let py = cy + h * 0.2
      let scale = 1
      let flame = 1

      if (t > PHASE.cruiseEnd) {
        const wt = clamp01((t - PHASE.cruiseEnd) / (PHASE.warpEnd - PHASE.cruiseEnd))
        const e = smoothstep(wt)
        py = cy + h * 0.2 * (1 - e) // lao về tâm
        scale = 1 - 0.86 * e // thu nhỏ như vọt ra xa
        flame = 1 + e * 5
      } else {
        py += Math.sin(t * 0.005) * 6 * cruiseT // bồng bềnh nhẹ
      }

      const s = scale * Math.min(w, h) * 0.06
      // nhấp nháy năng lượng cho vệt thời gian sống động
      const flick = 0.82 + Math.sin(t * 0.04) * 0.12 + Math.sin(t * 0.11) * 0.06

      ctx.save()
      ctx.translate(px, py)
      ctx.scale(s, s)

      // --- Hào quang quanh cỗ máy ---
      ctx.globalCompositeOperation = 'lighter'
      const aura = ctx.createRadialGradient(0, -0.1, 0, 0, -0.1, 1.3)
      aura.addColorStop(0, 'rgba(180,150,255,0.22)')
      aura.addColorStop(1, 'rgba(150,120,255,0)')
      ctx.fillStyle = aura
      ctx.beginPath()
      ctx.arc(0, -0.1, 1.3, 0, Math.PI * 2)
      ctx.fill()

      // --- Vệt xoáy thời gian (thay cho luồng phản lực) ---
      const trailLen = (0.95 + flame * 0.95) * flick
      const trail = ctx.createLinearGradient(0, 0.35, 0, 0.35 + trailLen)
      trail.addColorStop(0, 'rgba(255,255,255,0.95)')
      trail.addColorStop(0.28, 'rgba(190,150,255,0.8)')
      trail.addColorStop(0.6, 'rgba(120,190,255,0.42)')
      trail.addColorStop(1, 'rgba(120,90,255,0)')
      ctx.fillStyle = trail
      ctx.beginPath()
      ctx.moveTo(-0.42, 0.35)
      ctx.quadraticCurveTo(-0.18, 0.35 + trailLen * 0.5, 0, 0.35 + trailLen)
      ctx.quadraticCurveTo(0.18, 0.35 + trailLen * 0.5, 0.42, 0.35)
      ctx.closePath()
      ctx.fill()
      // vài vòng xoáy thời gian rời rạc
      for (let i = 0; i < 4; i += 1) {
        const ph = (t * 0.004 + i * 0.7) % 1
        const ry = 0.4 + ph * trailLen
        const rr = (0.34 - ph * 0.26) * flick
        if (rr <= 0.02) continue
        ctx.strokeStyle = `rgba(200,180,255,${(1 - ph) * 0.5})`
        ctx.lineWidth = 0.035
        ctx.beginPath()
        ctx.ellipse(0, ry, rr, rr * 0.32, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalCompositeOperation = 'source-over'

      // --- Bệ đĩa cỗ máy thời gian (vàng kim) ---
      // mặt hông đĩa
      const rim = ctx.createLinearGradient(0, 0.12, 0, 0.42)
      rim.addColorStop(0, '#f4b938')
      rim.addColorStop(1, '#a96f12')
      ctx.fillStyle = rim
      ctx.beginPath()
      ctx.moveTo(-0.66, 0.16)
      ctx.lineTo(-0.66, 0.28)
      ctx.quadraticCurveTo(0, 0.5, 0.66, 0.28)
      ctx.lineTo(0.66, 0.16)
      ctx.closePath()
      ctx.fill()
      // mặt trên đĩa
      const top = ctx.createLinearGradient(0, -0.04, 0, 0.32)
      top.addColorStop(0, '#ffe79a')
      top.addColorStop(1, '#f0b53a')
      ctx.fillStyle = top
      ctx.beginPath()
      ctx.ellipse(0, 0.16, 0.66, 0.2, 0, 0, Math.PI * 2)
      ctx.fill()
      // viền sáng quanh mép đĩa
      ctx.strokeStyle = 'rgba(255,247,210,0.85)'
      ctx.lineWidth = 0.03
      ctx.beginPath()
      ctx.ellipse(0, 0.16, 0.66, 0.2, 0, 0, Math.PI * 2)
      ctx.stroke()

      // --- Mặt đồng hồ thời gian phía trước đĩa ---
      ctx.fillStyle = '#fff8e6'
      ctx.beginPath()
      ctx.ellipse(0, 0.27, 0.2, 0.1, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#b9801f'
      ctx.lineWidth = 0.022
      ctx.stroke()
      // kim đồng hồ quay theo thời gian
      ctx.strokeStyle = '#7a4a0c'
      ctx.lineWidth = 0.024
      ctx.beginPath()
      ctx.moveTo(0, 0.27)
      ctx.lineTo(Math.cos(t * 0.012) * 0.12, 0.27 + Math.sin(t * 0.012) * 0.06)
      ctx.moveTo(0, 0.27)
      ctx.lineTo(Math.cos(t * 0.004) * 0.08, 0.27 + Math.sin(t * 0.004) * 0.04)
      ctx.stroke()

      // ====== Doraemon (ngồi bên trái) ======
      ctx.save()
      ctx.translate(-0.3, -0.16)
      // thân/đầu tròn xanh
      const dBlue = ctx.createRadialGradient(-0.08, -0.1, 0.03, 0, 0, 0.34)
      dBlue.addColorStop(0, '#63d2f6')
      dBlue.addColorStop(1, '#0a93da')
      ctx.fillStyle = dBlue
      ctx.beginPath()
      ctx.arc(0, 0, 0.32, 0, Math.PI * 2)
      ctx.fill()
      // mặt trắng
      ctx.fillStyle = '#f6fdff'
      ctx.beginPath()
      ctx.arc(0, 0.04, 0.24, 0, Math.PI * 2)
      ctx.fill()
      // hai mắt
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#222'
      ctx.lineWidth = 0.012
      for (const ex of [-0.075, 0.075]) {
        ctx.beginPath()
        ctx.ellipse(ex, -0.13, 0.05, 0.07, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.arc(-0.045, -0.12, 0.018, 0, Math.PI * 2)
      ctx.arc(0.045, -0.12, 0.018, 0, Math.PI * 2)
      ctx.fill()
      // mũi đỏ
      ctx.fillStyle = '#e23b2e'
      ctx.beginPath()
      ctx.arc(0, -0.05, 0.032, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.beginPath()
      ctx.arc(-0.01, -0.06, 0.012, 0, Math.PI * 2)
      ctx.fill()
      // sống mũi xuống miệng
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 0.014
      ctx.beginPath()
      ctx.moveTo(0, -0.02)
      ctx.lineTo(0, 0.12)
      ctx.stroke()
      // miệng cười
      ctx.beginPath()
      ctx.arc(0, 0.06, 0.13, 0.2 * Math.PI, 0.8 * Math.PI)
      ctx.stroke()
      // râu
      ctx.lineWidth = 0.012
      for (const side of [-1, 1]) {
        for (const yy of [-0.06, -0.02, 0.02]) {
          ctx.beginPath()
          ctx.moveTo(side * 0.06, yy)
          ctx.lineTo(side * 0.2, yy - 0.01)
          ctx.stroke()
        }
      }
      // vòng cổ đỏ + chuông vàng
      ctx.strokeStyle = '#d8332a'
      ctx.lineWidth = 0.05
      ctx.beginPath()
      ctx.arc(0, 0.02, 0.24, 0.18 * Math.PI, 0.82 * Math.PI)
      ctx.stroke()
      const bell = ctx.createRadialGradient(0, 0.21, 0.01, 0, 0.23, 0.06)
      bell.addColorStop(0, '#fff0a8')
      bell.addColorStop(1, '#e9a81b')
      ctx.fillStyle = bell
      ctx.beginPath()
      ctx.arc(0, 0.23, 0.05, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#9a6f10'
      ctx.lineWidth = 0.012
      ctx.beginPath()
      ctx.moveTo(-0.04, 0.22)
      ctx.lineTo(0.04, 0.22)
      ctx.moveTo(0, 0.23)
      ctx.lineTo(0, 0.27)
      ctx.stroke()
      ctx.restore()

      // ====== Nobita (ngồi bên phải) ======
      ctx.save()
      ctx.translate(0.32, -0.12)
      // thân áo vàng
      const shirt = ctx.createLinearGradient(0, 0.0, 0, 0.34)
      shirt.addColorStop(0, '#ffd34d')
      shirt.addColorStop(1, '#e9a92a')
      ctx.fillStyle = shirt
      ctx.beginPath()
      ctx.moveTo(-0.16, 0.32)
      ctx.quadraticCurveTo(-0.2, 0.04, -0.1, -0.02)
      ctx.lineTo(0.1, -0.02)
      ctx.quadraticCurveTo(0.2, 0.04, 0.16, 0.32)
      ctx.closePath()
      ctx.fill()
      // đầu da
      ctx.fillStyle = '#ffe0bd'
      ctx.beginPath()
      ctx.arc(0, -0.13, 0.18, 0, Math.PI * 2)
      ctx.fill()
      // tóc đen
      ctx.fillStyle = '#231a17'
      ctx.beginPath()
      ctx.arc(0, -0.16, 0.18, Math.PI * 1.04, Math.PI * 2.04)
      ctx.fill()
      for (let i = 0; i < 5; i += 1) {
        const ang = Math.PI * (1.08 + i * 0.21)
        ctx.beginPath()
        ctx.moveTo(Math.cos(ang) * 0.16, -0.16 + Math.sin(ang) * 0.16)
        ctx.lineTo(Math.cos(ang) * 0.2, -0.16 + Math.sin(ang) * 0.2 - 0.02)
        ctx.lineWidth = 0.04
        ctx.strokeStyle = '#231a17'
        ctx.stroke()
      }
      // kính tròn
      ctx.strokeStyle = '#3a2f2a'
      ctx.lineWidth = 0.018
      ctx.fillStyle = '#fff'
      for (const ex of [-0.075, 0.075]) {
        ctx.beginPath()
        ctx.arc(ex, -0.12, 0.06, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.moveTo(-0.015, -0.12)
      ctx.lineTo(0.015, -0.12)
      ctx.stroke()
      // mắt
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.arc(-0.075, -0.12, 0.016, 0, Math.PI * 2)
      ctx.arc(0.075, -0.12, 0.016, 0, Math.PI * 2)
      ctx.fill()
      // miệng cười
      ctx.strokeStyle = '#9a5a45'
      ctx.lineWidth = 0.014
      ctx.beginPath()
      ctx.arc(0, -0.04, 0.05, 0.1 * Math.PI, 0.9 * Math.PI)
      ctx.stroke()
      ctx.restore()

      ctx.restore()
    }

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
      drawShip(t)
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
      <p ref={captionRef} className="warp-intro__caption is-cruise">
        Khởi hành vào không gian sâu thẳm
      </p>
      <button type="button" className="warp-intro__skip" onClick={onSkip}>
        Bỏ qua ›
      </button>
    </div>
  )
}
