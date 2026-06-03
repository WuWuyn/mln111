import { useMemo, useState } from 'react'
import './ContradictionBalance.css'

const QUANTA = [
  { label: '+ Quan sát', value: 8 },
  { label: '+ Kinh nghiệm', value: 10 },
  { label: '+ Lần thử', value: 12 },
  { label: '+ Điều chỉnh', value: 14 },
  { label: '+ Thực tiễn', value: 16 },
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export default function ContradictionBalance() {
  const [oldForce, setOldForce] = useState(58)
  const [newForce, setNewForce] = useState(56)
  const [quantity, setQuantity] = useState(24)
  const [insideCore, setInsideCore] = useState(false)

  const gap = Math.abs(oldForce - newForce)
  const strength = Math.min(oldForce, newForce)
  const balanced = gap <= 16 && strength >= 42
  const oldDominates = oldForce - newForce > 24
  const newDominates = newForce - oldForce > 24
  const leapt = quantity >= 100

  const state = useMemo(() => {
    if (leapt) {
      return {
        id: 'leapt',
        label: 'Chất mới ra đời.',
        note: 'Lượng tích lũy vượt điểm nút, hệ sao chuyển hóa sang cấu trúc mới.',
      }
    }
    if (oldDominates) {
      return {
        id: 'frozen',
        label: 'Đình trệ',
        note: 'Khi cái cũ kìm hãm hoàn toàn cái mới, sự phát triển bị đình trệ.',
      }
    }
    if (newDominates) {
      return {
        id: 'chaos',
        label: 'Đổ vỡ',
        note: 'Thay đổi thiếu điều kiện có thể dẫn đến đổ vỡ, không tạo ra phát triển bền vững.',
      }
    }
    if (balanced) {
      return {
        id: 'balanced',
        label: 'Phát triển',
        note: 'Mâu thuẫn được giải quyết đúng là động lực của sự phát triển.',
      }
    }
    return {
      id: 'struggle',
      label: 'Đấu tranh',
      note: 'Bên trong mọi sự vật đều có những mặt đối lập. Sự tác động giữa chúng tạo nên vận động.',
    }
  }, [balanced, leapt, newDominates, oldDominates])

  const updateQuantity = (value) => {
    if (!balanced && !leapt) return
    setQuantity(clamp(value, 0, 100))
  }

  const addQuantum = (value) => {
    updateQuantity(quantity + value)
  }

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
      <div className="core-stage" aria-label="Lõi sao biện chứng">
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

        <button type="button" className="core-zoom" onClick={() => setInsideCore((current) => !current)}>
          {insideCore ? 'Ra ngoài sao' : 'Nhìn vào lõi sao'}
        </button>

        <div className="core-readout" role="status">
          <span>{state.label}</span>
          <p>{state.note}</p>
        </div>
      </div>

      <div className="core-controls">
        <div className="opposition-panel">
          <label className="core-slider core-slider--old">
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

          <label className="core-slider core-slider--new">
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

        <div className={`quantity-panel ${balanced || leapt ? 'is-open' : ''}`}>
          <label className="core-slider core-slider--quantity">
            <span>
              Lượng tích lũy
              <strong>{quantity}%</strong>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={quantity}
              disabled={!balanced && !leapt}
              onChange={(event) => updateQuantity(Number(event.target.value))}
              aria-label="Lượng tích lũy"
            />
          </label>

          <div className="quantity-milestones" aria-hidden="true">
            <span style={{ left: '30%' }} />
            <span style={{ left: '60%' }} />
            <span style={{ left: '90%' }} />
            <strong style={{ left: '100%' }}>Điểm nút</strong>
          </div>

          <div className="quanta-tray" aria-label="Thêm lượng tích lũy">
            {QUANTA.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={!balanced && !leapt}
                onClick={() => addQuantum(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="core-reset" onClick={() => setQuantity(0)}>
          Tái tạo sao
        </button>
      </div>
    </div>
  )
}
