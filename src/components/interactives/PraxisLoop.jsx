import { useMemo, useRef, useState } from 'react'
import './PraxisLoop.css'

const DATA_POINTS = [
  { id: 'water', label: 'Tín hiệu nước', value: 'cao', risk: false },
  { id: 'temperature', label: 'Nhiệt độ ổn định', value: '18C', risk: false },
  { id: 'storm', label: 'Bão từ mạnh', value: 'cấp 7', risk: true },
  { id: 'terrain', label: 'Địa hình chưa rõ', value: 'thiếu', risk: true },
  { id: 'atmosphere', label: 'Khí quyển dày', value: 'dày', risk: false },
]

const SAFE_ZONE = { x: 32, y: 58, radius: 12 }

// Ba điểm đáp định sẵn — bấm là chọn ngay, không cần rê chuột trúng quả cầu.
// Chỉ "An toàn" nằm trong vùng xanh; hai điểm còn lại để thực tiễn bác bỏ.
const LANDING_ZONES = [
  { id: 'safe', label: 'Vùng an toàn', x: 32, y: 58 },
  { id: 'storm', label: 'Cạnh bão từ', x: 70, y: 30 },
  { id: 'unknown', label: 'Vùng chưa rõ', x: 56, y: 74 },
]

const FLOW = ['Hiện thực', 'Nhận thức', 'Giả thuyết', 'Kiểm nghiệm', 'Điều chỉnh', 'Nhận thức mới']

function hasCoreEvidence(items) {
  return items.includes('water') && items.includes('temperature') && items.includes('storm')
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function pointOnElement(event, element) {
  const rect = element?.getBoundingClientRect()
  if (!rect) return null
  return {
    x: clamp(((event.clientX - rect.left) / rect.width) * 100, 12, 88),
    y: clamp(((event.clientY - rect.top) / rect.height) * 100, 15, 84),
  }
}

function isInsideSafeZone(point) {
  return Math.hypot(point.x - SAFE_ZONE.x, point.y - SAFE_ZONE.y) <= SAFE_ZONE.radius
}

export default function PraxisLoop() {
  const planetRef = useRef(null)
  const [selectedData, setSelectedData] = useState(['water'])
  const [landingPoint, setLandingPoint] = useState({ x: SAFE_ZONE.x, y: SAFE_ZONE.y })
  const [landingZone, setLandingZone] = useState('safe')
  const [placingLanding, setPlacingLanding] = useState(false)
  const [run, setRun] = useState(0)
  const [tested, setTested] = useState(false)
  const [built, setBuilt] = useState(false)

  const enoughData = hasCoreEvidence(selectedData)
  const hypothesisReady = enoughData
  const safePlan = hypothesisReady && isInsideSafeZone(landingPoint)
  const failed = tested && !safePlan
  const succeeded = tested && safePlan

  const message = useMemo(() => {
    if (built) return 'Nhận thức đúng quay lại cải biến hiện thực: trạm nghiên cứu đã được dựng trên vùng an toàn.'
    if (succeeded) return 'Giả thuyết được xác nhận qua thực tiễn. Dữ liệu thật làm bản đồ rõ hơn.'
    if (failed && !enoughData) return 'Thực tiễn bác bỏ: giả thuyết còn thiếu dữ liệu cốt lõi. Bổ sung rồi phóng lại.'
    if (failed) return 'Thực tiễn bác bỏ: điểm đáp rơi vào vùng nguy hiểm. Chọn lại vùng an toàn rồi phóng lại.'
    if (!enoughData) return 'Nhận thức ban đầu chưa đầy đủ. Bấm thêm dữ liệu (nước, nhiệt độ, bão từ) vào giả thuyết.'
    return 'Ý thức đã dự kiến được một kế hoạch. Chọn điểm đáp rồi phóng robot để kiểm nghiệm.'
  }, [built, enoughData, failed, succeeded])

  const toggleData = (id) => {
    setSelectedData((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
    setTested(false)
    setBuilt(false)
  }

  const dropData = (event) => {
    event.preventDefault()
    const id = event.dataTransfer.getData('text/plain')
    if (id) {
      setSelectedData((current) => (current.includes(id) ? current : [...current, id]))
      setTested(false)
      setBuilt(false)
    }
  }

  const pickZone = (zone) => {
    setLandingZone(zone.id)
    setLandingPoint({ x: zone.x, y: zone.y })
    setTested(false)
    setBuilt(false)
  }

  const launchProbe = () => {
    setRun((value) => value + 1)
    setTested(true)
    setBuilt(false)
  }

  const adjust = () => {
    setSelectedData(['water', 'temperature', 'storm'])
    setLandingZone('safe')
    setLandingPoint({ x: SAFE_ZONE.x, y: SAFE_ZONE.y })
    setTested(false)
    setBuilt(false)
  }

  // Vẫn cho phép tự rê điểm đáp trực tiếp trên hành tinh (nâng cao), nhưng các
  // nút "chọn vùng" mới là đường đi chắc chắn.
  const updateLandingPoint = (event) => {
    const point = pointOnElement(event, planetRef.current)
    if (!point) return
    setLandingPoint(point)
    setLandingZone(isInsideSafeZone(point) ? 'safe' : 'custom')
    setTested(false)
    setBuilt(false)
  }

  const startLandingPlacement = (event) => {
    event.preventDefault()
    setPlacingLanding(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    updateLandingPoint(event)
  }

  const moveLandingPlacement = (event) => {
    if (placingLanding) updateLandingPoint(event)
  }

  const stopLandingPlacement = (event) => {
    setPlacingLanding(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div
      className={`widget praxis-lab ${placingLanding ? 'is-placing' : ''} ${tested ? 'has-tested' : ''} ${failed ? 'is-failed' : ''} ${succeeded ? 'is-succeeded' : ''} ${built ? 'is-built' : ''}`}
      style={{ '--zone-x': `${landingPoint.x}%`, '--zone-y': `${landingPoint.y}%`, '--safe-x': `${SAFE_ZONE.x}%`, '--safe-y': `${SAFE_ZONE.y}%` }}
    >
      <div className="praxis-lab-stage">
        <div className="lab-stars" aria-hidden="true" />
        <div className="orbital-station" aria-hidden="true">
          <span className="station-core" />
          <span className="station-wing station-wing--left" />
          <span className="station-wing station-wing--right" />
          <span className="station-dish" />
        </div>

        <div
          ref={planetRef}
          className="praxis-planet"
          role="application"
          aria-label="Bản đồ hành tinh. Kéo điểm đáp để lập kế hoạch kiểm nghiệm."
          onPointerDown={startLandingPlacement}
          onPointerMove={moveLandingPlacement}
          onPointerUp={stopLandingPlacement}
          onPointerCancel={stopLandingPlacement}
        >
          <span className="planet-cloud planet-cloud--one" />
          <span className="planet-cloud planet-cloud--two" />
          <span className="magnetic-storm" />
          <span className="water-signal" />
          <span className="terrain-scan" />
          <span className="safe-landing-field" />
          <span className="landing-marker" />
          <span className="field-station" />
        </div>

        <button type="button" className="probe-launch-pad" onClick={launchProbe} aria-label="Phóng robot thăm dò">
          <span className="probe-mini" />
          <strong>Phóng robot</strong>
        </button>

        <div key={run} className="probe-flight" aria-hidden="true">
          <span className="probe-body" />
          <span className="probe-trail" />
        </div>

        <div className="lab-console lab-console--radar">
          <span>Radar</span>
          <div className="radar-screen" aria-hidden="true">
            <i />
          </div>
        </div>

      </div>

      <div className="praxis-lab-controls">
        <section className="praxis-panel data-panel">
          <span className="panel-kicker">1 · Dữ liệu hiện thực</span>
          <div className="data-bank">
            {DATA_POINTS.map((item) => (
              <button
                key={item.id}
                type="button"
                draggable
                className={`data-chip ${selectedData.includes(item.id) ? 'is-used' : ''} ${item.risk ? 'is-risk' : ''}`}
                onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)}
                onClick={() => toggleData(item.id)}
              >
                <span>{item.label}</span>
                <small>{item.value}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="praxis-panel hypothesis-panel" onDragOver={(event) => event.preventDefault()} onDrop={dropData}>
          <span className="panel-kicker">2 · Giả thuyết</span>
          <div className="hypothesis-dock">
            {selectedData.map((id) => {
              const item = DATA_POINTS.find((data) => data.id === id)
              return item ? <span key={id} className={item.risk ? 'is-risk' : ''}>{item.label}</span> : null
            })}
          </div>
          <div className={`hypothesis-statement ${hypothesisReady ? 'is-ready' : ''}`}>
            <small>Giả thuyết</small>
            <strong>{hypothesisReady ? 'Điểm đáp an toàn nếu tránh bão từ.' : 'Chưa đủ dữ liệu để kết luận.'}</strong>
          </div>
        </section>

        <section className="praxis-panel zone-panel">
          <span className="panel-kicker">3 · Điểm đáp</span>
          <div className="zone-picker">
            {LANDING_ZONES.map((zone) => (
              <button
                key={zone.id}
                type="button"
                className={`${landingZone === zone.id ? 'is-active' : ''} ${zone.id === 'safe' ? 'is-safe' : 'is-risk'}`}
                onClick={() => pickZone(zone)}
              >
                {zone.label}
              </button>
            ))}
          </div>
          <p>Bấm chọn vùng đáp, hoặc tự kéo điểm đáp trên hành tinh. Chỉ vùng an toàn mới qua được thực tiễn.</p>
        </section>

        <section className="praxis-panel action-panel">
          <span className="panel-kicker">4 · Kết quả</span>
          <div className="action-result" role="status">
            <strong>{built ? 'Đã cải biến' : succeeded ? 'Hạ cánh thành công' : failed ? 'Cần điều chỉnh' : 'Chưa kiểm nghiệm'}</strong>
            <p>{message}</p>
          </div>
          {failed && (
            <button type="button" className="adjust-plan" onClick={adjust}>
              Điều chỉnh theo dữ liệu thật
            </button>
          )}
          {(succeeded || built) && (
            <button type="button" className="build-station" disabled={!succeeded} onClick={() => setBuilt(true)}>
              Xây trạm nghiên cứu
            </button>
          )}
        </section>
      </div>

      <div className="praxis-flow" aria-label="Vòng nhận thức và thực tiễn">
        {FLOW.map((item, index) => (
          <span key={item} className={index <= (built ? 5 : succeeded ? 4 : tested ? 3 : enoughData ? 2 : 1) ? 'is-lit' : ''}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
