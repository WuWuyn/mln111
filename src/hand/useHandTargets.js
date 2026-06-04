import { useEffect, useRef, useState } from 'react'

// Điều khiển bằng tay KHÔNG con trỏ, ít mỏi nhất cho các trạm chỉ có vài thanh
// tăng/giảm. Thay vì di tay tới đúng mục rồi xác nhận (mỏi + thiếu chính xác),
// ta CHUYỂN MỤC BẰNG CỬ CHỈ, rồi chỉ kéo nhẹ để chỉnh giá trị:
//
//   ✌ Hai ngón   → mục kế tiếp        (edge — mỗi lần giơ là nhảy 1 mục)
//   🖐 Xòe tay    → mục trước          (edge)
//   ☝ Một ngón   → chỉnh mục đang chọn: kéo NHẸ lệch tâm để tăng/giảm
//                   (về giữa là dừng — rate control); nếu mục là nút thì bấm.
//   ✊ Nắm tay    → nghỉ (không đổi gì)
//
// `targets`: mảng mục, mỗi mục:
//   { key, label, kind: 'slider' | 'button',
//     get?(), set?(v), min?=0, max?=100, step?=1, disabled?,   // slider
//     onPress?() }                                             // button
const RATE_DEADZONE = 0.05 // vùng chết quanh tâm (X chuẩn hoá 0..1)
const RATE_SPAN = 0.4 // lệch tối đa tính từ tâm để đạt tốc độ tối đa
const RATE_FRACTION = 0.95 // tỉ lệ toàn dải / giây ở mức lệch tối đa

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// Mục kế tiếp/trước còn bật được (bỏ qua mục disabled).
function step(list, from, dir) {
  const n = list.length
  for (let i = 1; i <= n; i += 1) {
    const idx = (from + dir * i + n * i) % n
    if (!list[idx]?.disabled) return idx
  }
  return from
}

export function useHandTargets(handStore, targets) {
  const [handActive, setHandActive] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [rateDir, setRateDir] = useState(0)

  // Gương dữ liệu "sống" cho vòng lặp tay (chạy ngoài React) đọc, tránh stale.
  const targetsRef = useRef(targets)
  useEffect(() => {
    targetsRef.current = targets
  })
  const activeRef = useRef(activeIndex)
  useEffect(() => {
    activeRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    if (!handStore) return undefined

    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
    const rt = { lastT: now(), anchorX: 0.5, valueFloat: 0, range: 1, stp: 1, prevMode: 'idle' }

    const apply = (control) => {
      const active = Boolean(control?.active)
      setHandActive((prev) => (prev === active ? prev : active))

      const list = targetsRef.current
      if (!active || !list.length) {
        rt.prevMode = 'idle'
        rt.lastT = now()
        setRateDir((d) => (d === 0 ? d : 0))
        return
      }

      const t = now()
      const mode = control.mode ?? 'idle'
      const x = clamp(control.x ?? 0.5, 0, 1)
      const prev = rt.prevMode
      rt.prevMode = mode

      const idx = clamp(activeRef.current, 0, list.length - 1)

      // ── Đổi mục bằng cử chỉ (chỉ kích hoạt ở cạnh chuyển) ──
      if (mode === 'confirm' && prev !== 'confirm') {
        setActiveIndex(step(list, idx, +1))
        rt.lastT = t
        setRateDir((d) => (d === 0 ? d : 0))
        return
      }
      if (mode === 'navigate' && prev !== 'navigate') {
        setActiveIndex(step(list, idx, -1))
        rt.lastT = t
        setRateDir((d) => (d === 0 ? d : 0))
        return
      }

      const target = list[idx]

      // ── Chỉnh mục đang chọn bằng một ngón ──
      if (mode === 'point') {
        if (prev !== 'point') {
          // Vừa bắt đầu trỏ: lấy điểm neo tại vị trí tay hiện tại (đặt tay đâu cũng được).
          rt.anchorX = x
          rt.lastT = t
          if (target?.kind === 'button') {
            if (!target.disabled) target.onPress?.()
            return
          }
          if (target?.kind === 'slider') {
            rt.valueFloat = target.get?.() ?? 0
            rt.range = (target.max ?? 100) - (target.min ?? 0) || 1
            rt.stp = target.step ?? 1
          }
        }

        if (target?.kind !== 'slider' || target.disabled) {
          rt.lastT = t
          setRateDir((d) => (d === 0 ? d : 0))
          return
        }

        const dt = clamp((t - rt.lastT) / 1000, 0, 0.05)
        rt.lastT = t
        const offset = x - rt.anchorX
        const mag = Math.max(0, Math.abs(offset) - RATE_DEADZONE)
        const dir = mag <= 0 ? 0 : Math.sign(offset)
        setRateDir((d) => (d === dir ? d : dir))

        if (mag > 0) {
          const lo = target.min ?? 0
          const hi = target.max ?? 100
          const speed = Math.sign(offset) * Math.pow(mag / RATE_SPAN, 1.4) * RATE_FRACTION * rt.range
          rt.valueFloat = clamp(rt.valueFloat + speed * dt, lo, hi)
          const v = clamp(Math.round(rt.valueFloat / rt.stp) * rt.stp, lo, hi)
          target.set?.(v)
        }
        return
      }

      // Nắm tay / tư thế khác: nghỉ.
      rt.lastT = t
      setRateDir((d) => (d === 0 ? d : 0))
    }

    apply(handStore.get())
    return handStore.subscribe(apply)
  }, [handStore])

  // Bấm chuột vào mục trên thanh điều khiển: chọn (slider) hoặc bấm luôn (button).
  const selectTarget = (key) => {
    const i = targets.findIndex((item) => item.key === key)
    if (i < 0 || targets[i].disabled) return
    if (targets[i].kind === 'button') targets[i].onPress?.()
    else setActiveIndex(i)
  }

  const activeKey = targets[clamp(activeIndex, 0, Math.max(0, targets.length - 1))]?.key ?? null

  return { handActive, activeIndex, activeKey, rateDir, selectTarget }
}
