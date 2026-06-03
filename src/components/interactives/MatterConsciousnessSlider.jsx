import { useState } from 'react'

// Vật chất ↔ Ý thức: drag the slider to turn a wish (ý thức) into a real result
// through practical, material activity. Low end = pure desire; high end = the
// idea realised through action. Mirrors the "sinh viên muốn điểm cao" example.
const STAGES = [
  {
    max: 15,
    state: 'Chỉ là mong muốn',
    note: 'Ý thức mới dừng ở ước muốn "đạt điểm cao". Vật chất (kết quả thật) chưa thay đổi.',
  },
  {
    max: 45,
    state: 'Bắt đầu hành động',
    note: 'Ý thức định hướng hành động: bạn mở sách, ghi chép. Vật chất bắt đầu được tác động.',
  },
  {
    max: 80,
    state: 'Thực tiễn đều đặn',
    note: 'Học tập, luyện đề lặp lại mỗi ngày. Ý thức tác động trở lại hiện thực qua thực tiễn.',
  },
  {
    max: 100,
    state: 'Thành kết quả thật',
    note: 'Mong muốn đã chuyển thành kết quả vật chất cụ thể — điểm số. Ý thức đúng + thực tiễn = hiện thực.',
  },
]

function stageFor(value) {
  return STAGES.find((stage) => value <= stage.max) ?? STAGES[STAGES.length - 1]
}

export default function MatterConsciousnessSlider() {
  const [value, setValue] = useState(8)
  const stage = stageFor(value)

  return (
    <div className="widget widget-matter">
      <div className="matter-stage" style={{ '--act': value / 100 }}>
        <div className="matter-core" aria-hidden="true">
          <span className="matter-core-label">Vật chất</span>
        </div>
        <div className="matter-halo" aria-hidden="true" />
        <div className="matter-spark" aria-hidden="true">
          Ý thức
        </div>
      </div>

      <label className="widget-control">
        <span className="widget-control-label">
          Ý thức → Thực tiễn → Hiện thực
          <strong>{value}%</strong>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          aria-label="Mức độ ý thức chuyển hóa thành hiện thực qua thực tiễn"
        />
      </label>

      <div className="widget-readout">
        <span className="widget-tag">{stage.state}</span>
        <p>{stage.note}</p>
      </div>
    </div>
  )
}
