import { useMemo, useState } from 'react'

// Mối liên hệ phổ biến: a star network around the question "Vì sao một sinh viên
// học kém?". Selecting any cause lights up the whole web — a single fact never
// stands alone; understanding it means seeing its connections.
const CENTER = { id: 'center', label: 'Học kém?' }

const NODES = [
  { id: 'method', label: 'Phương pháp học' },
  { id: 'class', label: 'Môi trường lớp' },
  { id: 'mind', label: 'Tâm lý' },
  { id: 'time', label: 'Thời gian' },
  { id: 'health', label: 'Sức khỏe' },
  { id: 'motive', label: 'Động lực' },
  { id: 'teach', label: 'Cách giảng dạy' },
]

// Pre-compute node positions on a circle so the SVG is stable across renders.
function useLayout() {
  return useMemo(() => {
    const radius = 38
    return NODES.map((node, index) => {
      const angle = (index / NODES.length) * Math.PI * 2 - Math.PI / 2
      return {
        ...node,
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
      }
    })
  }, [])
}

export default function RelationNetwork() {
  const layout = useLayout()
  const [active, setActive] = useState(null)
  const lit = active !== null

  return (
    <div className="widget widget-relation">
      <svg viewBox="0 0 100 100" className={`relation-web ${lit ? 'is-lit' : ''}`} role="presentation">
        {layout.map((node) => (
          <line
            key={`edge-${node.id}`}
            x1="50"
            y1="50"
            x2={node.x}
            y2={node.y}
            className={`relation-edge ${active === node.id ? 'is-active' : ''}`}
          />
        ))}
        {/* peripheral cross-links to suggest a real web, only shown when lit */}
        {lit &&
          layout.map((node, index) => {
            const next = layout[(index + 1) % layout.length]
            return (
              <line
                key={`ring-${node.id}`}
                x1={node.x}
                y1={node.y}
                x2={next.x}
                y2={next.y}
                className="relation-ring"
              />
            )
          })}
        <circle cx="50" cy="50" r="9" className="relation-center" />
      </svg>

      <div className="relation-nodes">
        <button
          type="button"
          className="relation-chip relation-chip--center"
          onClick={() => setActive(null)}
        >
          {CENTER.label}
        </button>
        {NODES.map((node) => (
          <button
            key={node.id}
            type="button"
            className={`relation-chip ${active === node.id ? 'is-active' : ''} ${lit ? 'is-lit' : ''}`}
            onClick={() => setActive((current) => (current === node.id ? null : node.id))}
          >
            {node.label}
          </button>
        ))}
      </div>

      <div className="widget-readout">
        <span className="widget-tag">{lit ? 'Một mối liên hệ trong mạng lưới' : 'Hãy chọn một nguyên nhân'}</span>
        <p>
          {lit
            ? 'Không nguyên nhân nào tồn tại cô lập — chọn một yếu tố, cả mạng lưới sáng lên. Muốn hiểu đúng phải nhìn toàn diện, không phiến diện.'
            : 'Click vào một nguyên nhân để thấy nó liên hệ với tất cả những yếu tố còn lại như thế nào.'}
        </p>
      </div>
    </div>
  )
}
