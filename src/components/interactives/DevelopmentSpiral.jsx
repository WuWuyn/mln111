import { useState } from 'react'

// Sự phát triển / Phủ định của phủ định: walk the dialectical spiral. Each step
// climbs higher and the marker returns "above" its start point — development is
// upward but winding, keeping the rational core of what it negates.
const STAGES = [
  {
    label: 'Khẳng định',
    tag: 'Cái ban đầu',
    text: 'Hạt thóc — sự vật ở trạng thái xuất phát, mang trong mình mầm mống của cái sẽ phủ định nó.',
  },
  {
    label: 'Phủ định lần 1',
    tag: 'Cái cũ bị vượt bỏ',
    text: 'Gieo xuống, hạt thóc mất đi để thành cây lúa. Phủ định biện chứng: không xóa sạch mà giữ lại yếu tố hợp lý để phát triển.',
  },
  {
    label: 'Phủ định của phủ định',
    tag: 'Lặp lại ở mức cao hơn',
    text: 'Cây lúa cho nhiều hạt thóc mới — dường như trở về cái ban đầu, nhưng phong phú hơn, ở một vòng phát triển cao hơn.',
  },
  {
    label: 'Vòng phát triển mới',
    tag: 'Xoáy ốc đi lên',
    text: 'Mỗi chu kỳ là một vòng của đường xoáy ốc: khuynh hướng chung tiến lên, con đường thì quanh co, kế thừa và đổi mới.',
  },
]

export default function DevelopmentSpiral() {
  const [step, setStep] = useState(0)
  const current = STAGES[step]
  const count = STAGES.length

  return (
    <div className="widget widget-spiral">
      <div className="spiral-stage">
        <div className="spiral-track" aria-hidden="true">
          <span className="spiral-line" />
          {STAGES.map((stage, index) => (
            <span
              key={stage.label}
              className={`spiral-dot ${index === step ? 'is-active' : ''} ${index < step ? 'is-done' : ''}`}
              style={{ '--i': index }}
            />
          ))}
          <span className="spiral-marker" style={{ '--step': step }} />
        </div>
      </div>

      <div className="spiral-steps">
        {STAGES.map((stage, index) => (
          <button
            key={stage.label}
            type="button"
            className={`spiral-chip ${index === step ? 'is-active' : ''}`}
            onClick={() => setStep(index)}
          >
            {stage.label}
          </button>
        ))}
      </div>

      <div className="widget-readout">
        <span className="widget-tag">{current.tag}</span>
        <p>{current.text}</p>
      </div>

      <div className="qq-actions">
        <button
          type="button"
          className="widget-btn"
          onClick={() => setStep((value) => (value + 1) % count)}
        >
          {step === count - 1 ? 'Vòng mới ↻' : 'Leo bước tiếp →'}
        </button>
      </div>
    </div>
  )
}
