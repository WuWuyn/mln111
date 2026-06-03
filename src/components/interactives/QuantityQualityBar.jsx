import { useState } from 'react'

// Lượng – Chất: accumulate "lượng" (knowledge) day by day. Within the "độ" the
// quality stays the same; crossing the điểm nút at 100 fires a bước nhảy and the
// planet transforms into a new chất. The flagship interaction.
const STAGES = [
  { min: 0, label: 'Mới đọc qua', note: 'Lượng còn ít, chất chưa đổi — bạn vẫn trong "độ".' },
  { min: 10, label: 'Hiểu một phần', note: 'Bắt đầu tích lũy. Thay đổi mới về lượng, chưa tới bước nhảy.' },
  { min: 30, label: 'Nắm được ý chính', note: 'Lượng tăng dần nhưng chất của nhận thức vẫn giữ nguyên trong giới hạn độ.' },
  { min: 60, label: 'Liên hệ được ví dụ', note: 'Đã gần điểm nút — tích lũy đủ nhiều thì chuyển biến sắp xảy ra.' },
  { min: 90, label: 'Sát điểm nút', note: 'Chỉ một chút nữa, lượng sẽ vượt độ và tạo ra bước nhảy về chất.' },
  { min: 100, label: 'Bước nhảy — Chất mới!', note: 'Lượng vượt điểm nút: từ "không hiểu gì" chuyển hóa thành "biết phân tích vấn đề".' },
]

function stageFor(value) {
  return [...STAGES].reverse().find((stage) => value >= stage.min) ?? STAGES[0]
}

export default function QuantityQualityBar() {
  const [value, setValue] = useState(0)
  const stage = stageFor(value)
  const leapt = value >= 100

  const study = () => setValue((current) => Math.min(100, current + 10))

  return (
    <div className="widget widget-quantity">
      <div className={`qq-planet ${leapt ? 'is-leapt' : ''}`} style={{ '--fill': value / 100 }} aria-hidden="true">
        <div className="qq-glow" />
        <span className="qq-planet-label">{leapt ? 'Chất mới' : 'Chất cũ'}</span>
      </div>

      <div className="qq-meter" style={{ '--fill': `${value}%` }}>
        <div className="qq-meter-fill" />
        <span className="qq-node" style={{ left: '100%' }} title="Điểm nút" />
      </div>

      <label className="widget-control">
        <span className="widget-control-label">
          Lượng tri thức tích lũy
          <strong>{value}%</strong>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          aria-label="Lượng tri thức tích lũy"
        />
      </label>

      <div className="qq-actions">
        <button type="button" className="widget-btn" onClick={study}>
          + Học 20 phút hôm nay
        </button>
        <button type="button" className="widget-btn widget-btn--ghost" onClick={() => setValue(0)}>
          Bắt đầu lại
        </button>
      </div>

      <div className="widget-readout">
        <span className="widget-tag">{stage.label}</span>
        <p>{stage.note}</p>
      </div>
    </div>
  )
}
