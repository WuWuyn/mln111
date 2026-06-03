/**
 * Comet cursor renderer — pure drawing logic, no DOM/React.
 *
 * Works with either a regular canvas (main thread) or an OffscreenCanvas
 * (inside a Web Worker): both expose the same 2D context + requestAnimationFrame
 * globals. Running it in a worker keeps the comet smooth even when the main
 * thread is busy rendering the heavy 3D + bloom scene.
 *
 * The system cursor is hidden site-wide (see index.css), so this IS the only
 * pointer. Two consequences shape the design:
 *  - A crisp precise dot is always drawn at the *exact* mouse position (even
 *    while idle) so clicking is accurate and the cursor never disappears.
 *  - The glowing comet head/trail follow with a slight lerp purely for flair.
 *  - The backing store is scaled by devicePixelRatio so it stays sharp on HiDPI.
 */
const TRAIL_MAX = 22
const PARTICLE_MAX = 120

export function createComet(canvas) {
  const ctx = canvas.getContext('2d')
  let dpr = 1
  let w = canvas.width
  let h = canvas.height

  const mouse = { x: w / 2, y: h / 2 }
  const tail = { x: w / 2, y: h / 2 }
  let moving = false
  let lastMoveTime = 0
  let raf = null // null === loop is asleep

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
        vy: Math.sin(angle) * speed - 0.3,
        life: 1,
        decay: Math.random() * 0.02 + 0.012,
        size: Math.random() * 2.2 + 0.8,
        hue: 195 + Math.random() * 50,
      })
    }
  }

  // Crisp pointer dot drawn at the true mouse position — the actual "hotspot".
  function drawPointer() {
    ctx.save()
    const ring = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 7)
    ring.addColorStop(0, 'rgba(255,255,255,0.95)')
    ring.addColorStop(0.5, 'rgba(200,235,255,0.55)')
    ring.addColorStop(1, 'rgba(160,210,255,0)')
    ctx.fillStyle = ring
    ctx.beginPath()
    ctx.arc(mouse.x, mouse.y, 7, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255,255,255,0.98)'
    ctx.beginPath()
    ctx.arc(mouse.x, mouse.y, 2.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  function wake() {
    if (raf == null) raf = requestAnimationFrame(draw)
  }

  function draw() {
    ctx.clearRect(0, 0, w, h)

    // Follow a touch more tightly than before so the glow doesn't lag the dot.
    tail.x += (mouse.x - tail.x) * 0.34
    tail.y += (mouse.y - tail.y) * 0.34

    const dx = mouse.x - tail.x
    const dy = mouse.y - tail.y
    const speed = Math.hypot(dx, dy)

    if (performance.now() - lastMoveTime > 80) moving = false

    trail.push({ x: tail.x, y: tail.y })
    if (trail.length > TRAIL_MAX) trail.shift()

    // ---- Comet trail ----
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.lineCap = 'round'
    for (let i = 1; i < trail.length; i++) {
      const p0 = trail[i - 1]
      const p1 = trail[i]
      const t = i / trail.length
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

    // ---- Core glow (follows with the trail) ----
    const coreGrad = ctx.createRadialGradient(tail.x, tail.y, 0, tail.x, tail.y, 18)
    coreGrad.addColorStop(0, 'rgba(255,255,255,0.95)')
    coreGrad.addColorStop(0.35, 'rgba(180,225,255,0.6)')
    coreGrad.addColorStop(1, 'rgba(140,200,255,0)')
    ctx.fillStyle = coreGrad
    ctx.beginPath()
    ctx.arc(tail.x, tail.y, 18, 0, Math.PI * 2)
    ctx.fill()

    if (moving && speed > 0.5) {
      spawnStardust(tail.x, tail.y, Math.min(3, Math.ceil(speed / 6)))
    }

    // ---- Stardust ----
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.015
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

    // The precise dot sits on top so the hotspot is always crisp and exact.
    drawPointer()

    // ---- Sleep when nothing left to animate ----
    // Note: we do NOT clear here — the static pointer dot stays on screen so the
    // cursor remains visible while the rAF loop is parked.
    const idle = !moving && particles.length === 0 && speed < 0.1
    if (idle) {
      trail.length = 0
      raf = null
      return
    }

    raf = requestAnimationFrame(draw)
  }

  function applyBackingSize() {
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    // Setting width/height resets the transform — re-apply the dpr scale so all
    // drawing can use CSS-pixel coordinates.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  return {
    setMouse(x, y) {
      mouse.x = x
      mouse.y = y
      moving = true
      lastMoveTime = performance.now()
      wake()
    },
    resize(nextWidth, nextHeight, nextDpr) {
      if (nextDpr) dpr = nextDpr
      w = nextWidth
      h = nextHeight
      applyBackingSize()
      // Redraw the static pointer immediately if the loop is parked, otherwise
      // the resize clear would leave no cursor on screen.
      if (raf == null) drawPointer()
    },
    setHidden(hidden) {
      if (hidden) {
        if (raf != null) cancelAnimationFrame(raf)
        raf = null
      } else {
        wake()
      }
    },
    start() {
      wake()
    },
    stop() {
      if (raf != null) cancelAnimationFrame(raf)
      raf = null
    },
  }
}
