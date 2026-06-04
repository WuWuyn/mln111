import { useMemo, useRef, useState } from 'react'
import { useHandTargets } from '../../hand/useHandTargets'
import HandControlBar from './HandControlBar'
import './RelationNetwork.css'

const MODES = {
  static: {
    label: 'Nhìn siêu hình',
    message: 'Nhìn sự vật cô lập, tách rời, đứng yên.',
  },
  dialectic: {
    label: 'Nhìn biện chứng',
    message: 'Nhìn sự vật trong mối liên hệ, vận động và phát triển.',
  },
}

const PHASES = [
  {
    label: 'Bụi vũ trụ',
    message: 'Sự vật bắt đầu từ những dạng tồn tại đơn giản.',
  },
  {
    label: 'Kết tụ',
    message: 'Các yếu tố liên hệ với nhau, tạo nên cấu trúc.',
  },
  {
    label: 'Hệ ổn định',
    message: 'Khi các mối liên hệ đạt trật tự nhất định, hệ thống mới ra đời.',
  },
  {
    label: 'Điều kiện sống',
    message: 'Sự phát triển diễn ra qua quá trình tích lũy và biến đổi điều kiện.',
  },
  {
    label: 'Nhận thức xuất hiện',
    message: 'Sự phát triển có thể tạo ra trình độ mới, phức tạp hơn.',
  },
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function pointPercent(event, element) {
  const rect = element?.getBoundingClientRect()
  if (!rect) return null
  return {
    x: clamp(((event.clientX - rect.left) / rect.width) * 100, 12, 88),
    y: clamp(((event.clientY - rect.top) / rect.height) * 100, 14, 86),
  }
}

function distanceFromCenter(point) {
  return Math.hypot(point.x - 50, point.y - 52)
}

export default function RelationNetwork({ handStore }) {
  const stageRef = useRef(null)
  const [mode, setMode] = useState('dialectic')
  const [dragging, setDragging] = useState(false)
  const [planet, setPlanet] = useState({ x: 69, y: 42 })
  const [time, setTime] = useState(2)
  const phase = PHASES[time]

  const handTargets = [
    { key: 'time', kind: 'slider', label: 'Thời gian', get: () => time, set: setTime, min: 0, max: PHASES.length - 1, step: 1 },
    { key: 'static', kind: 'button', label: 'Siêu hình', onPress: () => setMode('static') },
    { key: 'dialectic', kind: 'button', label: 'Biện chứng', onPress: () => setMode('dialectic') },
  ]
  const hand = useHandTargets(handStore, handTargets)
  const influence = useMemo(() => {
    const pull = clamp(Math.abs(distanceFromCenter(planet) - 24) / 28, 0, 1)
    return mode === 'dialectic' ? pull : 0
  }, [mode, planet])

  const updatePlanet = (event) => {
    const point = pointPercent(event, stageRef.current)
    if (!point) return
    setPlanet(point)
  }

  const startDrag = (event) => {
    event.preventDefault()
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    updatePlanet(event)
  }

  const moveDrag = (event) => {
    if (dragging) updatePlanet(event)
  }

  const stopDrag = (event) => {
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div
      className={`widget dialectic-system is-${mode} is-phase-${time} ${dragging ? 'is-dragging' : ''}`}
      style={{
        '--planet-x': `${planet.x}%`,
        '--planet-y': `${planet.y}%`,
        '--influence': influence,
        '--speed': `${8 - influence * 5}s`,
        '--phase': time,
      }}
    >
      <div ref={stageRef} className="dialectic-stage">
        <div className="cosmic-dust-cloud" aria-hidden="true" />
        <div className="dialectic-star" aria-hidden="true" />

        <div className="orbit orbit--one" aria-hidden="true" />
        <div className="orbit orbit--two" aria-hidden="true" />
        <div className="orbit orbit--three" aria-hidden="true" />
        <div className="force-line force-line--a" aria-hidden="true" />
        <div className="force-line force-line--b" aria-hidden="true" />
        <div className="force-line force-line--c" aria-hidden="true" />

        <button
          type="button"
          className="system-planet system-planet--driver"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          aria-label="Kéo hành tinh để thay đổi quỹ đạo"
        >
          <span />
        </button>
        <div className="system-planet system-planet--echo system-planet--echo-a" aria-hidden="true" />
        <div className="system-planet system-planet--echo system-planet--echo-b" aria-hidden="true" />
        <div className="system-planet system-planet--echo system-planet--echo-c" aria-hidden="true" />
        <div className="asteroid-deflect" aria-hidden="true" />
        <div className="life-band" aria-hidden="true" />
        <div className="observer-station" aria-hidden="true" />

        <div className="system-readout" role="status">
          <strong>{mode === 'dialectic' ? 'Toàn hệ phản ứng' : 'Chỉ một vật đổi chỗ'}</strong>
          <p>{mode === 'dialectic' ? 'Một yếu tố lệch quỹ đạo làm đường lực, tốc độ và thiên thể khác biến đổi.' : MODES.static.message}</p>
        </div>
      </div>

      <div className="dialectic-controls">
        {handStore && <HandControlBar targets={handTargets} {...hand} />}

        <div className="mode-switch" aria-label="Chọn cách nhìn">
          {Object.entries(MODES).map(([id, item]) => (
            <button key={id} type="button" className={mode === id ? 'is-active' : ''} onClick={() => setMode(id)}>
              {item.label}
            </button>
          ))}
        </div>

        <label className={`time-control ${hand.lockedKey === 'time' ? 'is-hand-locked' : ''}`}>
          <span>
            Kéo thời gian
            <strong>{phase.label}</strong>
          </span>
          <input
            type="range"
            min="0"
            max={PHASES.length - 1}
            step="1"
            value={time}
            onChange={(event) => setTime(Number(event.target.value))}
            aria-label="Dòng thời gian phát triển của hệ sao"
          />
        </label>

        <div className="dialectic-message">
          <span>{mode === 'dialectic' ? MODES.dialectic.message : MODES.static.message}</span>
          <p>{phase.message}</p>
        </div>
      </div>
    </div>
  )
}
