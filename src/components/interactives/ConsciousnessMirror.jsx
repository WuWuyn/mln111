import { useMemo, useRef, useState } from 'react'
import './ConsciousnessMirror.css'

// Ba vùng cần phản ánh trong "vũ trụ thật". Bán kính đủ rộng để dễ trúng khi
// rê kính lúp — quét là để hiểu ý nghĩa, không phải thử thách nhắm bắn.
const HOTSPOTS = [
  { id: 'planet', label: 'Hành tinh', x: 42, y: 54, radius: 26 },
  { id: 'orbit', label: 'Quỹ đạo', x: 52, y: 60, radius: 30 },
  { id: 'storm', label: 'Bão từ', x: 78, y: 30, radius: 24 },
]

// Công cụ trong "kế hoạch ý thức". Bấm để chọn (arm), rồi bấm vào vũ trụ ý
// thức để đặt — thay cho kéo-thả pointer-capture vốn rất kén con trỏ.
const PLAN_TOOLS = [
  { id: 'probe', label: 'Robot', glyph: 'R' },
  { id: 'station', label: 'Trạm đo', glyph: 'T' },
]

const REFLECTION_MESSAGES = {
  reflect: 'Ý thức bắt đầu từ sự phản ánh thế giới vật chất. Rê kính lúp để soi từng vùng của vũ trụ thật.',
  verify:
    'Phản ánh chưa đủ. Nhận thức là quá trình soi đi soi lại hiện thực ngày càng sâu — hãy soi nốt vùng còn tối.',
  ready:
    'Vũ trụ trong ý thức đã phản ánh đủ. Giờ dùng ý thức để lập kế hoạch: đặt Robot, Trạm đo và vẽ đường bay.',
  create:
    'Ý thức phản ánh thế giới, nhưng qua thực tiễn nó định hướng con người cải biến chính thế giới ấy.',
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function pointPercent(event, element) {
  const rect = element?.getBoundingClientRect()
  if (!rect) return null
  return {
    x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
    y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
  }
}

function findScannedParts(point) {
  return HOTSPOTS.filter((spot) => Math.hypot(point.x - spot.x, point.y - spot.y) <= spot.radius).map((spot) => spot.id)
}

function statusFor({ corrected, scannedCount, planItems, orbitOn, executed }) {
  if (executed) {
    return { mark: '!', title: 'Cải biến hiện thực', body: REFLECTION_MESSAGES.create }
  }

  if (corrected) {
    const placed = Number(Boolean(planItems.probe)) + Number(Boolean(planItems.station)) + Number(Boolean(orbitOn))
    return {
      mark: placed >= 3 ? '!' : '→',
      title: placed >= 3 ? 'Kế hoạch đã đủ — thực hiện' : `Điều khiển kế hoạch (${placed}/3)`,
      body: REFLECTION_MESSAGES.ready,
    }
  }

  if (scannedCount > 0) {
    return {
      mark: '?',
      title: `Đang phản ánh (${scannedCount}/${HOTSPOTS.length})`,
      body: REFLECTION_MESSAGES.verify,
    }
  }

  return { mark: '?', title: 'Soi vũ trụ thật', body: REFLECTION_MESSAGES.reflect }
}

export default function ConsciousnessMirror() {
  const realRef = useRef(null)
  const mindRef = useRef(null)
  const [lens, setLens] = useState({ x: 30, y: 56 })
  const [scanned, setScanned] = useState([])
  const [draggingLens, setDraggingLens] = useState(false)
  const [tool, setTool] = useState(null)
  const [planItems, setPlanItems] = useState({ probe: null, station: null })
  const [orbitOn, setOrbitOn] = useState(false)
  const [executed, setExecuted] = useState(false)

  const corrected = scanned.length === HOTSPOTS.length
  const clarity = scanned.length / HOTSPOTS.length
  const readyToExecute = corrected && orbitOn && planItems.probe && planItems.station

  const status = useMemo(
    () => statusFor({ corrected, scannedCount: scanned.length, planItems, orbitOn, executed }),
    [corrected, scanned.length, planItems, orbitOn, executed],
  )

  // ── Kính lúp: rê để phản ánh hiện thực (pointer-capture trên một núm to,
  //    đáng tin với mọi con trỏ). ────────────────────────────────────────────
  const scanAt = (event) => {
    const point = pointPercent(event, realRef.current)
    if (!point) return
    setLens(point)
    setExecuted(false)
    setScanned((parts) => Array.from(new Set([...parts, ...findScannedParts(point)])))
  }

  const startLens = (event) => {
    event.preventDefault()
    setDraggingLens(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    scanAt(event)
  }

  const moveLens = (event) => {
    if (draggingLens) scanAt(event)
  }

  const stopLens = (event) => {
    setDraggingLens(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  // ── Kế hoạch trong ý thức: bấm công cụ để chọn, bấm vào vũ trụ ý thức để
  //    đặt. Không kéo-thả → không lệ thuộc con trỏ tuỳ biến. ─────────────────
  const armTool = (id) => {
    if (!corrected) return
    setExecuted(false)
    setTool((current) => (current === id ? null : id))
  }

  const toggleOrbit = () => {
    if (!corrected) return
    setExecuted(false)
    setOrbitOn((on) => !on)
    setTool(null)
  }

  const placeOnMind = (event) => {
    if (!corrected || !tool) return
    // Bỏ qua khi bấm trúng chính thanh công cụ / nút thực hiện.
    if (event.target.closest('.mirror-plan-palette') || event.target.closest('.mirror-execute')) return
    const point = pointPercent(event, mindRef.current)
    if (!point) return
    setPlanItems((items) => ({ ...items, [tool]: point }))
    setTool(null)
    setExecuted(false)
  }

  const execute = () => {
    if (!readyToExecute) return
    setExecuted(true)
  }

  const reset = () => {
    setScanned([])
    setTool(null)
    setPlanItems({ probe: null, station: null })
    setOrbitOn(false)
    setExecuted(false)
  }

  return (
    <div
      className={`widget consciousness-mirror mirror-redesign ${corrected ? 'is-corrected' : ''} ${
        executed ? 'is-executed' : ''
      } ${draggingLens ? 'is-dragging-lens' : ''} ${tool ? 'is-arming' : ''}`}
      style={{ '--clarity': clarity, '--lens-x': `${lens.x}%`, '--lens-y': `${lens.y}%` }}
    >
      <div className="mirror-stage mirror-stage--lens">
        <section ref={realRef} className="mirror-world mirror-world--real" aria-label="Vũ trụ thật">
          <span className="mirror-panel-label">Vũ trụ thật</span>
          <div className="mirror-star" aria-hidden="true" />
          <div className="mirror-orbit mirror-orbit--real" aria-hidden="true" />
          <div className="mirror-planet mirror-planet--real" aria-hidden="true">
            <span className="mirror-core" />
          </div>
          <div className="mirror-meteor mirror-meteor--one" aria-hidden="true" />
          <div className="mirror-storm" aria-hidden="true" />
          {HOTSPOTS.map((spot) => (
            <span
              key={spot.id}
              className={`mirror-hotspot mirror-hotspot--${spot.id} ${scanned.includes(spot.id) ? 'is-scanned' : ''}`}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            >
              <i>{spot.label}</i>
            </span>
          ))}
          {executed && (
            <>
              <div className="plan-arc plan-arc--realized" aria-hidden="true" />
              <div className="mirror-robot mirror-robot--real" aria-hidden="true" />
              <div className="mirror-station mirror-station--real" aria-hidden="true" />
            </>
          )}
          <button
            type="button"
            className="mirror-lens"
            onPointerDown={startLens}
            onPointerMove={moveLens}
            onPointerUp={stopLens}
            onPointerCancel={stopLens}
            aria-label="Kéo kính lúp để soi vũ trụ thật"
          >
            <span />
          </button>
        </section>

        <section
          ref={mindRef}
          className={`mirror-world mirror-world--mind ${corrected ? 'is-unlocked' : ''} ${tool ? 'is-placing' : ''}`}
          aria-label="Vũ trụ trong ý thức"
          onClick={placeOnMind}
        >
          <span className="mirror-panel-label">Vũ trụ trong ý thức</span>
          <div className="mind-grid" aria-hidden="true" />
          <div className={`mirror-orbit mirror-orbit--mind ${orbitOn ? 'is-planned' : ''}`} aria-hidden="true" />
          <div className="mirror-planet mirror-planet--mind" aria-hidden="true">
            <span className="mirror-core" />
          </div>
          <div className={`mind-part mind-part--planet ${scanned.includes('planet') ? 'is-lit' : ''}`} aria-hidden="true" />
          <div className={`mind-part mind-part--orbit ${scanned.includes('orbit') ? 'is-lit' : ''}`} aria-hidden="true" />
          <div className={`mind-part mind-part--storm ${scanned.includes('storm') ? 'is-lit' : ''}`} aria-hidden="true" />

          {!corrected && <div className="mind-locked" aria-hidden="true">Soi đủ vũ trụ thật để mở khóa</div>}

          {Object.entries(planItems).map(([id, point]) =>
            point ? (
              <div
                key={id}
                className={`placed-tool placed-tool--${id}`}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                aria-hidden="true"
              >
                {id === 'probe' ? 'R' : 'T'}
              </div>
            ) : null,
          )}

          {corrected && (
            <div className="mirror-plan-palette">
              {PLAN_TOOLS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`mirror-tool ${tool === item.id ? 'is-arming' : ''} ${planItems[item.id] ? 'is-active' : ''}`}
                  onClick={() => armTool(item.id)}
                >
                  {planItems[item.id] ? `${item.label} ✓` : tool === item.id ? `Bấm để đặt ${item.label}` : item.label}
                </button>
              ))}
              <button
                type="button"
                className={`mirror-tool mirror-tool--draw ${orbitOn ? 'is-active' : ''}`}
                onClick={toggleOrbit}
              >
                {orbitOn ? 'Đường bay ✓' : 'Vẽ đường bay'}
              </button>
            </div>
          )}

          {readyToExecute && (
            <button type="button" className="mirror-execute" onClick={execute}>
              Thực hiện trong thực tiễn
            </button>
          )}
        </section>

        <div className="mirror-status" role="status">
          <span>{status.mark}</span>
          <strong>{status.title}</strong>
          <p>{status.body}</p>
          {(corrected || scanned.length > 0) && (
            <button type="button" className="mirror-reset" onClick={reset}>
              Soi lại từ đầu
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
