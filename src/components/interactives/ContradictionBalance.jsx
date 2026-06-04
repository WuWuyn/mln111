import { useMemo, useRef, useState } from 'react'
import { useHandTargets } from '../../hand/useHandTargets'
import HandControlBar from './HandControlBar'
import './ContradictionBalance.css'

// Lượng không còn kéo bằng thanh trượt nữa: người chơi GÕ (tap) liên tục vào lõi
// sao để dồn lượng tới điểm nút rồi bùng nổ thành chất mới. Mỗi cú gõ thêm một
// "nhịp" lượng và bắn một vòng sáng kiểu osu!. Bằng chuột là click; bằng tay là
// chụm ngón cái–trỏ (pinch) — cú "bấm" 2 landmark rõ nhất, gõ nhanh dồn dập hay
// chậm rãi đều bắt tốt — đi qua cầu nối con trỏ tay (HandWidgetCursor).
const TAP_GAIN = 8 // mỗi cú gõ thêm bao nhiêu lượng
const RIPPLE_MS = 600 // vòng sáng sống bao lâu trước khi gỡ khỏi DOM

// Giá trị khởi tạo — dùng chung cho state ban đầu và nút "Tái tạo".
const INITIAL = { oldForce: 58, newForce: 56, quantity: 24 }

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export default function ContradictionBalance({ handStore }) {
  const [oldForce, setOldForce] = useState(INITIAL.oldForce)
  const [newForce, setNewForce] = useState(INITIAL.newForce)
  const [quantity, setQuantity] = useState(INITIAL.quantity)
  const [insideCore, setInsideCore] = useState(false)
  const [ripples, setRipples] = useState([])

  const stageRef = useRef(null)
  const rippleIdRef = useRef(0)

  const gap = Math.abs(oldForce - newForce)
  const strength = Math.min(oldForce, newForce)
  const balanced = gap <= 16 && strength >= 42
  const oldDominates = oldForce - newForce > 24
  const newDominates = newForce - oldForce > 24
  const leapt = quantity >= 100

  const state = useMemo(() => {
    if (leapt) {
      return { id: 'leapt', label: 'Chất mới', note: 'Lượng vượt điểm nút → chất mới.' }
    }
    if (oldDominates) {
      return { id: 'frozen', label: 'Đình trệ', note: 'Cái cũ lấn át → ngừng phát triển.' }
    }
    if (newDominates) {
      return { id: 'chaos', label: 'Đổ vỡ', note: 'Đổi vội, thiếu điều kiện → đổ vỡ.' }
    }
    if (balanced) {
      return { id: 'balanced', label: 'Phát triển', note: 'Giải quyết mâu thuẫn → động lực.' }
    }
    return { id: 'struggle', label: 'Đấu tranh', note: 'Hai mặt đối lập tác động → vận động.' }
  }, [balanced, leapt, newDominates, oldDominates])

  const canTap = balanced && !leapt

  // Một cú gõ: dồn thêm lượng + bắn vòng sáng tại đúng điểm gõ. Vị trí lấy từ
  // toạ độ thật của sự kiện (chuột hoặc cú "bấm" tay do HandWidgetCursor phát ra)
  // quy về phần trăm trong khung lõi sao.
  const tapCore = (event) => {
    const host = stageRef.current
    if (!host || !canTap) return
    const rect = host.getBoundingClientRect()
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100)
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100)

    const id = (rippleIdRef.current += 1)
    setRipples((list) => [...list, { id, x, y }])
    window.setTimeout(() => {
      setRipples((list) => list.filter((ripple) => ripple.id !== id))
    }, RIPPLE_MS)

    setQuantity((value) => clamp(value + TAP_GAIN, 0, 100))
  }

  // Tái tạo: đưa lõi sao về trạng thái ban đầu để chơi lại từ đầu — nhất là sau
  // khi bước nhảy (leapt) đã xảy ra và không còn gõ được nữa.
  const reset = () => {
    setOldForce(INITIAL.oldForce)
    setNewForce(INITIAL.newForce)
    setQuantity(INITIAL.quantity)
    setRipples([])
    setInsideCore(false)
  }

  const tapHint = leapt
    ? 'Bước nhảy đã xảy ra — chất mới đã hình thành.'
    : !balanced
      ? 'Cân hai lực cho cân bằng trước để mở tích lũy lượng.'
      : handStore
        ? 'Chụm ngón cái + trỏ để “gõ” vào lõi sao, hoặc giữ con trỏ yên để tự gõ.'
        : 'Bấm liên tục vào lõi sao để dồn lượng tới điểm nút.'

  // Điều khiển bằng tay: ✌ đổi mục · 🖐 mục trước · ☝ kéo nhẹ chỉnh · ✊ nghỉ.
  // (Lượng nay gõ bằng pinch qua con trỏ tay, không còn là một thanh trượt.)
  const handTargets = [
    { key: 'old', kind: 'slider', label: 'Cái cũ', get: () => oldForce, set: setOldForce, min: 0, max: 100, step: 1 },
    { key: 'new', kind: 'slider', label: 'Cái mới', get: () => newForce, set: setNewForce, min: 0, max: 100, step: 1 },
  ]
  const hand = useHandTargets(handStore, handTargets)

  // Nút "Tái tạo" nay nằm cạnh hàng chọn Cái cũ / Cái mới ở đầu bảng điều khiển.
  const resetButton = (
    <button type="button" className="core-reset" data-hand-click onClick={reset}>
      Tái tạo
    </button>
  )

  return (
    <div
      className={`widget dialectic-core is-${state.id} ${insideCore ? 'is-inside-core' : ''}`}
      style={{
        '--old-force': oldForce / 100,
        '--new-force': newForce / 100,
        '--quantity': quantity / 100,
        '--gap': gap / 100,
      }}
    >
      <div className="core-stage" aria-label="Lõi sao biện chứng" ref={stageRef}>
        <div className="core-space" aria-hidden="true" />
        <div className="new-quality-system" aria-hidden="true">
          <span className="new-star new-star--a" />
          <span className="new-star new-star--b" />
          <span className="new-planet new-planet--a" />
          <span className="new-planet new-planet--b" />
          <span className="new-orbit new-orbit--a" />
          <span className="new-orbit new-orbit--b" />
        </div>

        <div className="dialectic-star-model">
          <div className="star-corona" />
          <div className="star-shell">
            <span className="energy-stream energy-stream--old" />
            <span className="energy-stream energy-stream--new" />
            <span className="core-ring core-ring--one" />
            <span className="core-ring core-ring--two" />
            <span className="core-ring core-ring--three" />
            <span className="star-core" />
            <span className="supernova-wave supernova-wave--one" />
            <span className="supernova-wave supernova-wave--two" />
          </div>
          <div className="star-crust" />
        </div>

        {/* Bề mặt gõ: phủ kín lõi sao, nằm dưới nút zoom & bảng trạng thái. Mỗi
            pointerdown (chuột hoặc cú bấm tay) là một cú gõ. */}
        <button
          type="button"
          className="tap-field"
          data-hand-click
          onPointerDown={tapCore}
          disabled={!canTap}
          aria-label="Gõ vào lõi sao để tích lũy lượng"
        />

        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="tap-ripple"
            style={{ left: `${ripple.x}%`, top: `${ripple.y}%` }}
            aria-hidden="true"
          />
        ))}

        <button type="button" className="core-zoom" onClick={() => setInsideCore((current) => !current)}>
          {insideCore ? 'Ra ngoài sao' : 'Nhìn vào lõi sao'}
        </button>

        <div className="core-readout" role="status">
          <span>{state.label}</span>
          <p>{state.note}</p>
        </div>
      </div>

      <div className="core-controls">
        {handStore ? (
          <HandControlBar targets={handTargets} {...hand} action={resetButton} />
        ) : (
          <div className="core-actions">{resetButton}</div>
        )}

        <div className="opposition-panel">
          <label className={`core-slider core-slider--old ${hand.activeKey === 'old' ? 'is-hand-locked' : ''}`}>
            <span>
              Ổn định / Cái cũ
              <strong>{oldForce}</strong>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={oldForce}
              onChange={(event) => setOldForce(Number(event.target.value))}
              aria-label="Điều chỉnh lực ổn định, cái cũ"
            />
          </label>

          <label className={`core-slider core-slider--new ${hand.activeKey === 'new' ? 'is-hand-locked' : ''}`}>
            <span>
              Biến đổi / Cái mới
              <strong>{newForce}</strong>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={newForce}
              onChange={(event) => setNewForce(Number(event.target.value))}
              aria-label="Điều chỉnh lực biến đổi, cái mới"
            />
          </label>
        </div>

        <div className={`quantity-panel ${canTap || leapt ? 'is-open' : ''}`}>
          <div className="qty-head">
            <span>Lượng tích lũy</span>
            <strong>{quantity}%</strong>
          </div>

          <div className="qty-meter" style={{ '--fill': `${quantity}%` }} aria-hidden="true">
            <span className="qty-meter-fill" />
            <span className="qty-node" />
            <em className="qty-node-label">Điểm nút</em>
          </div>

          <p className="qty-hint">{tapHint}</p>
        </div>
      </div>
    </div>
  )
}
