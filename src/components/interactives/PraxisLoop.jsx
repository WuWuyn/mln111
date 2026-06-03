import { useState } from 'react'

// Thực tiễn & Nhận thức — the spiral of cognition rendered as a turning loop:
// Thực tiễn → Nhận thức → Kiểm nghiệm → Điều chỉnh → (Thực tiễn mới). Walk it
// step by step against the "học nhóm có hiệu quả hơn không?" situation.
const STEPS = [
  {
    key: 'practice',
    label: 'Thực tiễn',
    text: 'Xuất phát điểm: bạn trực tiếp học nhóm và học một mình — hoạt động vật chất, cảm tính sinh động.',
  },
  {
    key: 'cognition',
    label: 'Nhận thức',
    text: 'Từ trải nghiệm, bạn rút ra giả thuyết: "Học nhóm hiệu quả hơn học một mình."',
  },
  {
    key: 'test',
    label: 'Kiểm nghiệm',
    text: 'Làm sao kiểm chứng? Thử học nhóm 2 tuần, đo điểm số và mức độ hiểu bài so với học một mình.',
  },
  {
    key: 'adjust',
    label: 'Điều chỉnh',
    text: 'Kết quả thực tế thế nào? Nếu chưa hiệu quả, điều chỉnh: nhóm nhỏ hơn, có mục tiêu và thời lượng rõ ràng.',
  },
  {
    key: 'renew',
    label: 'Thực tiễn mới',
    text: 'Áp dụng cách học nhóm đã cải tiến vào thực tế. Một vòng nhận thức mới — cao hơn — lại bắt đầu.',
  },
]

export default function PraxisLoop() {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const count = STEPS.length

  return (
    <div className="widget widget-praxis">
      <div className="praxis-ring" role="presentation">
        {STEPS.map((node, index) => {
          const angle = (index / count) * Math.PI * 2 - Math.PI / 2
          const x = 50 + Math.cos(angle) * 38
          const y = 50 + Math.sin(angle) * 38
          return (
            <button
              key={node.key}
              type="button"
              className={`praxis-node ${index === step ? 'is-active' : ''} ${index < step ? 'is-done' : ''}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => setStep(index)}
            >
              <span>{node.label}</span>
            </button>
          )
        })}
        <div className="praxis-hub" aria-hidden="true">
          <span>{step + 1}/{count}</span>
        </div>
      </div>

      <div className="widget-readout">
        <span className="widget-tag">{current.label}</span>
        <p>{current.text}</p>
      </div>

      <div className="qq-actions">
        <button
          type="button"
          className="widget-btn"
          onClick={() => setStep((value) => (value + 1) % count)}
        >
          {step === count - 1 ? 'Khép vòng, bắt đầu vòng mới ↻' : 'Bước tiếp →'}
        </button>
      </div>
    </div>
  )
}
