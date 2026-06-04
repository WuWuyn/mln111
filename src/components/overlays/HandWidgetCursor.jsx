import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// ── Cầu nối điều khiển bằng tay cho các widget thực nghiệm ──────────────────
// Các widget (Cosmic Mirror, Praxis Lab, …) đều đã chuyển sang thao tác bằng
// con trỏ + cú bấm, nên thay vì nhúng logic tay vào từng widget, ta đặt MỘT lớp
// cầu nối ở trang chi tiết. Bộ điều khiển ở đây CỐ TÌNH KHÔNG dùng cách đếm
// ngón (point/confirm) vì việc phân biệt 1–2 ngón rất kén; thay vào đó dùng hai
// tín hiệu nhẹ tay và ổn định:
//
//   • Con trỏ  → bám đầu ngón trỏ, LUÔN chạy (không cần giữ pose nào).
//   • Pinch    → chạm ngón cái vào ngón trỏ = một cú "bấm" (down/up + click).
//                Biên độ nhỏ, ít mỏi, chỉ dựa 2 landmark rõ → rất robust.
//   • Dwell    → ai pinch khó: cứ giữ con trỏ yên trên một nút ~0.7s, vòng tròn
//                đầy dần rồi tự bấm. Không cần cử chỉ nào.
//
// Toạ độ thật (clientX/Y) được gắn vào sự kiện để handler của widget đọc đúng vị
// trí (vd đặt Robot, soi kính lúp). Reticle để pointer-events:none + portal ra
// body để không bị overlay che/cắt và không chắn elementFromPoint.

const CLICKABLE = 'button, .mirror-world--mind, a, input, [data-hand-click]'

// Dwell: thời gian giữ yên để tự bấm, và bán kính "đứng yên" cho phép (px).
const DWELL_MS = 700
const DWELL_MOVE_TOLERANCE = 30

function pointerOpts(x, y) {
  return {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
  }
}

export default function HandWidgetCursor({ store }) {
  const reticleRef = useRef(null)

  useEffect(() => {
    if (!store) return undefined
    const reticle = reticleRef.current
    if (!reticle) return undefined

    let raf = 0
    let prevPinch = false
    // Trạng thái dwell giữa các frame.
    let dwellTarget = null
    let dwellStart = 0
    let dwellAnchorX = 0
    let dwellAnchorY = 0
    let dwellArmed = false

    const dispatchMove = (x, y) => {
      const el = document.elementFromPoint(x, y)
      if (!el) return
      try {
        el.dispatchEvent(new PointerEvent('pointermove', pointerOpts(x, y)))
      } catch {
        /* handler có thể ném (vd setPointerCapture) — bỏ qua, frame sau thử lại */
      }
    }

    const clickAt = (x, y) => {
      const el = document.elementFromPoint(x, y)
      if (!el) return
      const target = el.closest(CLICKABLE)
      if (!target) return
      try {
        target.dispatchEvent(new PointerEvent('pointerdown', pointerOpts(x, y)))
        target.dispatchEvent(new PointerEvent('pointerup', pointerOpts(x, y)))
        target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y }))
      } catch {
        /* nuốt lỗi handler để vòng lặp không gãy */
      }
      // Hiệu ứng "đã bấm" trên reticle (reflow để chạy lại animation).
      reticle.classList.remove('did-click')
      void reticle.offsetWidth
      reticle.classList.add('did-click')
    }

    const resetDwell = () => {
      dwellTarget = null
      dwellArmed = false
      reticle.style.setProperty('--dwell', '0')
    }

    const updateDwell = (x, y, now) => {
      const el = document.elementFromPoint(x, y)
      const target = el?.closest(CLICKABLE) ?? null

      if (!target) {
        resetDwell()
        return
      }

      // Đổi mục tiêu, hoặc đi quá xa điểm neo → khởi động lại đồng hồ.
      const movedFar = Math.hypot(x - dwellAnchorX, y - dwellAnchorY) > DWELL_MOVE_TOLERANCE
      if (target !== dwellTarget || movedFar) {
        dwellTarget = target
        dwellStart = now
        dwellAnchorX = x
        dwellAnchorY = y
        dwellArmed = true
        reticle.style.setProperty('--dwell', '0')
        return
      }

      if (!dwellArmed) return // đã bấm trên mục tiêu này, chờ rời ra mới nạp lại

      const progress = Math.min(1, (now - dwellStart) / DWELL_MS)
      reticle.style.setProperty('--dwell', String(progress))

      if (progress >= 1) {
        dwellArmed = false
        reticle.style.setProperty('--dwell', '0')
        clickAt(x, y)
      }
    }

    const loop = () => {
      raf = requestAnimationFrame(loop)
      const control = store.get()

      if (!control.active) {
        reticle.style.opacity = '0'
        prevPinch = false
        resetDwell()
        return
      }

      const cx = control.cursorX ?? control.x ?? 0.5
      const cy = control.cursorY ?? control.y ?? 0.5
      const x = cx * window.innerWidth
      const y = cy * window.innerHeight
      const now = performance.now()

      reticle.style.opacity = String(control.fade ?? 1)
      reticle.style.left = `${x}px`
      reticle.style.top = `${y}px`
      const pinching = Boolean(control.pinch)
      reticle.classList.toggle('is-pinch', pinching)

      // Luôn bắn pointermove (để kính lúp "soi" được khi đang bật).
      dispatchMove(x, y)

      // Pinch: cạnh lên = một cú bấm. Khi đang pinch, không chạy dwell.
      if (pinching) {
        if (!prevPinch) clickAt(x, y)
        resetDwell()
      } else {
        updateDwell(x, y, now)
      }
      prevPinch = pinching
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [store])

  // Portal ra body: reticle là position:fixed, đặt thẳng dưới body để không bị
  // overflow/transform của lớp overlay cắt mất.
  return createPortal(
    <div ref={reticleRef} className="hand-widget-cursor" aria-hidden="true" style={{ opacity: 0 }} />,
    document.body,
  )
}
