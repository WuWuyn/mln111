import { useEffect, useRef } from 'react'
import { createComet } from './comet/cometCore'

/**
 * GenshinCursor – vệt sao băng (comet trail) + bụi sao lấp lánh (stardust).
 *
 * Mặc định render trên một Web Worker qua OffscreenCanvas, nên animation chạy ở
 * luồng riêng và KHÔNG bị main thread (Three.js + bloom của trang 3D) làm nghẽn
 * -> mượt kể cả khi cảnh nặng. Nếu trình duyệt không hỗ trợ OffscreenCanvas thì
 * tự fallback sang vẽ trên main thread.
 *
 * Canvas được tạo bằng tay (không qua JSX ref cố định) và bỏ đi khi unmount, để
 * mỗi lần mount có một canvas mới — tránh lỗi "đã transferControlToOffscreen"
 * khi React StrictMode mount hai lần trong dev.
 */
export default function GenshinCursor() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    // Cap the pixel ratio at 2: enough to look crisp on retina without doubling
    // fill cost on 3x phones.
    const getDpr = () => Math.min(window.devicePixelRatio || 1, 2)

    const canvas = document.createElement('canvas')
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    canvas.width = Math.round(window.innerWidth * getDpr())
    canvas.height = Math.round(window.innerHeight * getDpr())
    container.appendChild(canvas)

    const canUseWorker =
      typeof Worker !== 'undefined' &&
      typeof OffscreenCanvas !== 'undefined' &&
      typeof canvas.transferControlToOffscreen === 'function'

    let worker = null
    let fallback = null

    const onMove = (event) => {
      if (worker) worker.postMessage({ type: 'mouse', x: event.clientX, y: event.clientY })
      else fallback?.setMouse(event.clientX, event.clientY)
    }
    const onResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = getDpr()
      if (worker) worker.postMessage({ type: 'resize', width, height, dpr })
      else fallback?.resize(width, height, dpr)
    }
    const onVisibility = () => {
      const hidden = document.hidden
      if (worker) worker.postMessage({ type: 'visibility', hidden })
      else fallback?.setHidden(hidden)
    }

    if (canUseWorker) {
      try {
        worker = new Worker(new URL('./comet/cometWorker.js', import.meta.url), { type: 'module' })
        const offscreen = canvas.transferControlToOffscreen()
        worker.postMessage(
          {
            type: 'init',
            canvas: offscreen,
            width: window.innerWidth,
            height: window.innerHeight,
            dpr: getDpr(),
          },
          [offscreen],
        )
      } catch {
        // Transfer/worker failed -> we can no longer use this canvas on the main
        // thread (it may be half-transferred); rebuild via the fallback path.
        worker?.terminate()
        worker = null
      }
    }

    if (!worker) {
      fallback = createComet(canvas)
      fallback.resize(window.innerWidth, window.innerHeight, getDpr())
      fallback.start()
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      worker?.terminate()
      fallback?.stop()
      canvas.remove()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  )
}
