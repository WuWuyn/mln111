import { useMemo, useRef, useState } from 'react'
import './ConsciousnessMirror.css'

const HOTSPOTS = [
  { id: 'planet', label: 'Hành tinh', x: 46, y: 55, radius: 22 },
  { id: 'orbit', label: 'Quỹ đạo', x: 50, y: 58, radius: 31 },
  { id: 'storm', label: 'Bão từ', x: 80, y: 80, radius: 18 },
]

const PLAN_ITEMS = [
  { id: 'probe', label: 'Robot' },
  { id: 'station', label: 'Trạm đo' },
]

const REFLECTION_MESSAGES = {
  reflect: 'Ý thức bắt đầu từ sự phản ánh thế giới vật chất.',
  verify:
    'Ý thức không phải bản sao hoàn hảo ngay lập tức. Nhận thức là quá trình phản ánh hiện thực ngày càng sâu sắc hơn.',
  create:
    'Ý thức phản ánh thế giới vật chất, nhưng thông qua thực tiễn, ý thức có thể định hướng hoạt động của con người để cải biến thế giới.',
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

function statusFor({ mode, reflected, corrected, orbitPath, planItems, executed }) {
  if (executed) {
    return { mark: '!', title: 'Cải biến hiện thực', body: REFLECTION_MESSAGES.create }
  }

  if (mode === 'create') {
    const readyCount = Number(Boolean(orbitPath)) + Object.values(planItems).filter(Boolean).length
    return {
      mark: readyCount >= 3 ? '!' : '?',
      title: readyCount >= 3 ? 'Kế hoạch đã đủ' : 'Lập kế hoạch trong ý thức',
      body: REFLECTION_MESSAGES.create,
    }
  }

  if (mode === 'verify') {
    return {
      mark: corrected ? '!' : '?',
      title: corrected ? 'Vũ trụ trong ý thức đã sáng đủ' : 'Phản ánh chưa đầy đủ',
      body: REFLECTION_MESSAGES.verify,
    }
  }

  return {
    mark: reflected >= 1 ? '!' : '?',
    title: reflected >= 1 ? 'Hiện thực đã được phản ánh' : 'Soi vũ trụ thật',
    body: REFLECTION_MESSAGES.reflect,
  }
}

export default function ConsciousnessMirror() {
  const realRef = useRef(null)
  const mindRef = useRef(null)
  const [mode, setMode] = useState('reflect')
  const [lens, setLens] = useState({ x: 30, y: 56 })
  const [scanned, setScanned] = useState([])
  const [draggingLens, setDraggingLens] = useState(false)
  const [corrected, setCorrected] = useState(false)
  const [planItems, setPlanItems] = useState({ probe: null, station: null })
  const [draggingItem, setDraggingItem] = useState(null)
  const [itemGhost, setItemGhost] = useState(null)
  const [drawingOrbit, setDrawingOrbit] = useState(false)
  const [orbitDraft, setOrbitDraft] = useState(null)
  const [orbitPath, setOrbitPath] = useState(null)
  const [executed, setExecuted] = useState(false)

  const reflected = scanned.length / HOTSPOTS.length
  const readyToExecute = corrected && orbitPath && planItems.probe && planItems.station
  const status = useMemo(
    () => statusFor({ mode, reflected, corrected, orbitPath, planItems, executed }),
    [mode, reflected, corrected, orbitPath, planItems, executed],
  )

  const updateLens = (event) => {
    const point = pointPercent(event, realRef.current)
    if (!point) return
    const newParts = findScannedParts(point)

    setMode('reflect')
    setExecuted(false)
    setLens(point)
    setScanned((parts) => Array.from(new Set([...parts, ...newParts])))
  }

  const startLens = (event) => {
    event.preventDefault()
    setDraggingLens(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    updateLens(event)
  }

  const moveLens = (event) => {
    if (draggingLens) updateLens(event)
  }

  const stopLens = (event) => {
    const point = pointPercent(event, realRef.current)
    const finalParts = point ? Array.from(new Set([...scanned, ...findScannedParts(point)])) : scanned
    const isComplete = finalParts.length === HOTSPOTS.length

    setDraggingLens(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setScanned(finalParts)
    setMode(isComplete ? 'create' : 'verify')
    setCorrected(isComplete)
  }

  const startPlanDrag = (event, itemId) => {
    if (!corrected) return
    event.preventDefault()
    setMode('create')
    setExecuted(false)
    setDraggingItem(itemId)
    setItemGhost({ id: itemId, x: event.clientX, y: event.clientY })
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const movePlanDrag = (event) => {
    if (!draggingItem) return
    setItemGhost({ id: draggingItem, x: event.clientX, y: event.clientY })
  }

  const stopPlanDrag = (event) => {
    if (!draggingItem) return
    const point = pointPercent(event, mindRef.current)
    if (point) setPlanItems((items) => ({ ...items, [draggingItem]: point }))
    setDraggingItem(null)
    setItemGhost(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const startOrbit = (event) => {
    if (!corrected || event.target.closest('.mirror-plan-palette') || event.target.closest('.mirror-execute')) return
    const point = pointPercent(event, mindRef.current)
    if (!point) return
    setMode('create')
    setExecuted(false)
    setDrawingOrbit(true)
    setOrbitDraft({ start: point, end: point })
  }

  const moveOrbit = (event) => {
    if (!drawingOrbit) return
    const point = pointPercent(event, mindRef.current)
    if (!point) return
    setOrbitDraft((draft) => (draft ? { ...draft, end: point } : null))
  }

  const stopOrbit = () => {
    if (orbitDraft) setOrbitPath(orbitDraft)
    setDrawingOrbit(false)
    setOrbitDraft(null)
  }

  const execute = () => {
    if (!readyToExecute) return
    setMode('create')
    setExecuted(true)
  }

  const activeOrbit = orbitDraft ?? orbitPath

  return (
    <div
      className={`widget consciousness-mirror mirror-redesign is-${mode} ${corrected ? 'is-corrected' : ''} ${
        executed ? 'is-executed' : ''
      } ${draggingLens ? 'is-dragging-lens' : ''}`}
      style={{
        '--clarity': reflected,
        '--lens-x': `${lens.x}%`,
        '--lens-y': `${lens.y}%`,
      }}
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
              aria-hidden="true"
            />
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
          className="mirror-world mirror-world--mind"
          aria-label="Vũ trụ trong ý thức"
          onPointerDown={startOrbit}
          onPointerMove={moveOrbit}
          onPointerUp={stopOrbit}
          onPointerCancel={stopOrbit}
        >
          <span className="mirror-panel-label">Vũ trụ trong ý thức</span>
          <div className="mind-grid" aria-hidden="true" />
          <div className="mirror-orbit mirror-orbit--mind" aria-hidden="true" />
          <div className="mirror-planet mirror-planet--mind" aria-hidden="true">
            <span className="mirror-core" />
          </div>
          <div className={`mind-part mind-part--planet ${scanned.includes('planet') ? 'is-lit' : ''}`} aria-hidden="true" />
          <div className={`mind-part mind-part--orbit ${scanned.includes('orbit') ? 'is-lit' : ''}`} aria-hidden="true" />
          <div className={`mind-part mind-part--storm ${scanned.includes('storm') ? 'is-lit' : ''}`} aria-hidden="true" />
          <div className="mirror-error mirror-error--orbit" aria-hidden="true" />
          <div className="mirror-error mirror-error--storm" aria-hidden="true" />
          {activeOrbit && (
            <svg className="drawn-orbit" viewBox="0 0 100 100" aria-hidden="true">
              <path
                d={`M ${activeOrbit.start.x} ${activeOrbit.start.y} C ${(activeOrbit.start.x + activeOrbit.end.x) / 2} ${
                  Math.min(activeOrbit.start.y, activeOrbit.end.y) - 24
                }, ${(activeOrbit.start.x + activeOrbit.end.x) / 2} ${Math.max(activeOrbit.start.y, activeOrbit.end.y) + 18}, ${
                  activeOrbit.end.x
                } ${activeOrbit.end.y}`}
              />
            </svg>
          )}
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
              {PLAN_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`mirror-tool ${planItems[item.id] ? 'is-active' : ''}`}
                  onPointerDown={(event) => startPlanDrag(event, item.id)}
                  onPointerMove={movePlanDrag}
                  onPointerUp={stopPlanDrag}
                  onPointerCancel={stopPlanDrag}
                >
                  {item.label}
                </button>
              ))}
              <span className={`mirror-tool mirror-tool--draw ${orbitPath ? 'is-active' : ''}`}>Vẽ đường bay</span>
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
        </div>
      </div>

      {itemGhost && (
        <div
          className={`drag-ghost drag-ghost--${itemGhost.id}`}
          style={{ left: `${itemGhost.x}px`, top: `${itemGhost.y}px` }}
          aria-hidden="true"
        >
          {itemGhost.id === 'probe' ? 'Robot' : 'Trạm'}
        </div>
      )}
    </div>
  )
}
