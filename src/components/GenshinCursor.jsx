import { useEffect, useRef } from 'react'

/**
 * GenshinCursor – vệt sao băng (comet trail) + bụi sao lấp lánh (stardust)
 * mô phỏng hiệu ứng con trỏ trên web Genshin Impact.
 *
 * Cách dùng: đặt <GenshinCursor /> một lần ở component gốc (App.jsx).
 * Không cần thư viện ngoài. Chạy trên canvas full-screen, pointer-events: none
 * nên không chặn click vào trang.
 *
 * Hiệu năng:
 * - KHÔNG dùng ctx.shadowBlur (lệnh đắt nhất của canvas 2D); glow được tạo
 *   hoàn toàn bằng gradient + globalCompositeOperation 'lighter'.
 * - Vòng lặp tự NGỦ khi chuột đứng yên và không còn hạt nào -> 0% CPU khi idle,
 *   và tự thức dậy khi có mousemove.
 * - Giới hạn số hạt stardust để tránh tích tụ gây giật.
 */
const TRAIL_MAX = 22
const PARTICLE_MAX = 120

export default function GenshinCursor() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)

    const onResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    // Vị trí chuột thật + vị trí "đuôi" nội suy cho mượt
    const mouse = { x: w / 2, y: h / 2 }
    const tail = { x: w / 2, y: h / 2 }
    let moving = false
    let lastMoveTime = 0

    // raf == null nghĩa là vòng lặp đang ngủ.
    let raf = null

    const wake = () => {
      if (raf == null) raf = requestAnimationFrame(draw)
    }

    const onMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      moving = true
      lastMoveTime = performance.now()
      wake()
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    const trail = []
    const particles = []

    function spawnStardust(x, y, count) {
      for (let i = 0; i < count; i++) {
        if (particles.length >= PARTICLE_MAX) break
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 1.2 + 0.2
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.3, // hơi bay lên
          life: 1,
          decay: Math.random() * 0.02 + 0.012,
          size: Math.random() * 2.2 + 0.8,
          hue: 195 + Math.random() * 50, // xanh -> tím nhẹ
        })
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)

      // nội suy đuôi bám theo chuột -> mượt, có quán tính
      tail.x += (mouse.x - tail.x) * 0.28
      tail.y += (mouse.y - tail.y) * 0.28

      const dx = mouse.x - tail.x
      const dy = mouse.y - tail.y
      const speed = Math.hypot(dx, dy)

      // ngừng di chuyển sau 80ms -> giảm spawn
      if (performance.now() - lastMoveTime > 80) moving = false

      // thêm điểm vào trail (chỉ khi đuôi còn nhúc nhích, tránh tích điểm trùng)
      trail.push({ x: tail.x, y: tail.y })
      if (trail.length > TRAIL_MAX) trail.shift()

      // ---- Comet trail (vệt sáng gradient mờ dần) ----
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'round'
      for (let i = 1; i < trail.length; i++) {
        const p0 = trail[i - 1]
        const p1 = trail[i]
        const t = i / trail.length // 0 (đuôi) -> 1 (đầu)
        const alpha = t * 0.6

        const grad = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y)
        grad.addColorStop(0, `hsla(200, 100%, 75%, ${alpha})`)
        grad.addColorStop(1, `hsla(265, 100%, 80%, ${alpha})`)

        ctx.strokeStyle = grad
        ctx.lineWidth = t * 9 + 0.5
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p1.x, p1.y)
        ctx.stroke()
      }

      // ---- Đầu comet: lõi sáng trắng glow (gradient thay cho shadowBlur) ----
      const coreGrad = ctx.createRadialGradient(tail.x, tail.y, 0, tail.x, tail.y, 18)
      coreGrad.addColorStop(0, 'rgba(255,255,255,0.95)')
      coreGrad.addColorStop(0.35, 'rgba(180,225,255,0.6)')
      coreGrad.addColorStop(1, 'rgba(140,200,255,0)')
      ctx.fillStyle = coreGrad
      ctx.beginPath()
      ctx.arc(tail.x, tail.y, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // ---- Spawn stardust khi di chuyển ----
      if (moving && speed > 0.5) {
        spawnStardust(tail.x, tail.y, Math.min(3, Math.ceil(speed / 6)))
      }

      // ---- Vẽ stardust (glow bằng gradient, không shadowBlur) ----
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.015 // trọng lực nhẹ
        p.life -= p.decay

        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        const r = p.size * p.life * 2.2
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
        g.addColorStop(0, `hsla(${p.hue}, 100%, 82%, ${p.life})`)
        g.addColorStop(1, `hsla(${p.hue}, 100%, 70%, 0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      // ---- Ngủ khi không còn gì để vẽ -> tiết kiệm CPU hoàn toàn ----
      const idle = !moving && particles.length === 0 && speed < 0.1
      if (idle) {
        ctx.clearRect(0, 0, w, h)
        trail.length = 0
        raf = null
        return
      }

      raf = requestAnimationFrame(draw)
    }

    const onVisibility = () => {
      if (document.hidden) {
        if (raf != null) cancelAnimationFrame(raf)
        raf = null
      } else {
        wake()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    wake()

    return () => {
      if (raf != null) cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // không chặn click
        zIndex: 9999,
      }}
    />
  )
}
