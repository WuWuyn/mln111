import { useEffect, useMemo, useRef, useState } from 'react'
import { useHandTargets } from '../../hand/useHandTargets'
import HandControlBar from './HandControlBar'
import './RelationNetwork.css'

// Độ nhạy khi "cầm" quả cầu bằng tay: di tay 1 đơn vị (toàn khung camera) →
// quả cầu đi bao nhiêu phần trăm sân khấu. Kéo tương đối từ điểm bắt đầu cầm.
const HAND_GRAB_GAIN = 165

const MODES = {
  static: {
    label: 'Siêu hình',
    message: 'Nhìn sự vật cô lập, tách rời, đứng yên.',
  },
  dialectic: {
    label: 'Biện chứng',
    message: 'Nhìn sự vật trong mối liên hệ, vận động và phát triển.',
  },
}

// Trạng thái ban đầu của hệ sao — nút "Tái tạo sao" đưa mọi thứ về đây.
const PLANET_HOME = { x: 69, y: 42 }
const TIME_HOME = 2

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
  const [handGrab, setHandGrab] = useState(false)
  const [planet, setPlanet] = useState(PLANET_HOME)
  const planetRef = useRef(planet)
  useEffect(() => {
    planetRef.current = planet
  }, [planet])
  // `time` là giá trị LIÊN TỤC (0..PHASES.length-1) để thanh trượt mượt và
  // `--phase` nội suy mượt các hiệu ứng. Mốc phase rời rạc lấy bằng làm tròn.
  const [time, setTime] = useState(TIME_HOME)
  const phaseIndex = Math.round(time)
  const phase = PHASES[phaseIndex]

  const handTargets = [
    // "Quả cầu": chọn mục này rồi ☝ trỏ + di tay để KÉO quả cầu 2D (thêm cách di
    // chuyển ngoài chụm tay). Hook bỏ qua kind 'pad' (không rate/không press) —
    // việc kéo do effect bên dưới xử lý.
    { key: 'ball', kind: 'pad', label: 'Quả cầu' },
    // step MỊN (≈80 nấc trên dải 0..4) để rate-control bằng tay trượt mượt như
    // trang "Lõi sao biện chứng"; mốc phase rời rạc vẫn lấy bằng làm tròn `time`.
    { key: 'time', kind: 'slider', label: 'Thời gian', get: () => time, set: setTime, min: 0, max: PHASES.length - 1, step: 0.05 },
    { key: 'static', kind: 'button', label: 'Siêu hình', onPress: () => setMode('static') },
    { key: 'dialectic', kind: 'button', label: 'Biện chứng', onPress: () => setMode('dialectic') },
  ]
  // Khi đang CẦM quả cầu (chụm tay) thì tạm khoá thanh trượt/nút, để cử chỉ chụm
  // không vô tình kéo "Thời gian".
  const hand = useHandTargets(handStore, handGrab ? [] : handTargets)

  // ── Cầm quả cầu bằng tay ──────────────────────────────────────────────────
  // Chụm ngón (pinch = "cầm quả bóng") để bắt quả cầu, di tay để kéo nó tới chỗ
  // khác minh hoạ phép biện chứng làm lệch quỹ đạo, mở tay để thả. Dùng rawX/rawY
  // (vị trí tay, luôn cập nhật) và kéo TƯƠNG ĐỐI từ lúc bắt đầu cầm.
  useEffect(() => {
    if (!handStore) return undefined
    const anchor = { active: false, hx: 0, hy: 0, px: 0, py: 0 }

    const unsubscribe = handStore.subscribe((control) => {
      const grabbing = Boolean(control.active && control.pinch)

      if (grabbing && !anchor.active) {
        anchor.active = true
        anchor.hx = control.rawX ?? 0.5
        anchor.hy = control.rawY ?? 0.5
        anchor.px = planetRef.current.x
        anchor.py = planetRef.current.y
        setHandGrab(true)
      } else if (!grabbing && anchor.active) {
        anchor.active = false
        setHandGrab(false)
      }

      if (anchor.active) {
        const nx = clamp(anchor.px + ((control.rawX ?? anchor.hx) - anchor.hx) * HAND_GRAB_GAIN, 12, 88)
        const ny = clamp(anchor.py + ((control.rawY ?? anchor.hy) - anchor.hy) * HAND_GRAB_GAIN, 14, 86)
        setPlanet((current) =>
          Math.abs(current.x - nx) < 0.15 && Math.abs(current.y - ny) < 0.15 ? current : { x: nx, y: ny },
        )
      }
    })

    return unsubscribe
  }, [handStore])

  // ── Di chuyển quả cầu bằng MỤC "Quả cầu" trên thanh điều khiển tay ───────────
  // Khi đã chọn mục 'ball' và đang ☝ trỏ (không chụm), di tay để kéo quả cầu 2D
  // tương đối — cùng cảm giác với chụm tay, nhưng theo lối chọn-mục quen thuộc.
  const activeKeyRef = useRef(hand.activeKey)
  useEffect(() => {
    activeKeyRef.current = hand.activeKey
  }, [hand.activeKey])
  useEffect(() => {
    if (!handStore) return undefined
    const anchor = { active: false, hx: 0, hy: 0, px: 0, py: 0 }

    const unsubscribe = handStore.subscribe((control) => {
      const driving = Boolean(
        control.active && control.mode === 'point' && !control.pinch && activeKeyRef.current === 'ball',
      )

      if (driving && !anchor.active) {
        anchor.active = true
        anchor.hx = control.rawX ?? 0.5
        anchor.hy = control.rawY ?? 0.5
        anchor.px = planetRef.current.x
        anchor.py = planetRef.current.y
      } else if (!driving && anchor.active) {
        anchor.active = false
      }

      if (anchor.active) {
        const nx = clamp(anchor.px + ((control.rawX ?? anchor.hx) - anchor.hx) * HAND_GRAB_GAIN, 12, 88)
        const ny = clamp(anchor.py + ((control.rawY ?? anchor.hy) - anchor.hy) * HAND_GRAB_GAIN, 14, 86)
        setPlanet((current) =>
          Math.abs(current.x - nx) < 0.15 && Math.abs(current.y - ny) < 0.15 ? current : { x: nx, y: ny },
        )
      }
    })

    return unsubscribe
  }, [handStore])
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

  // Đưa hệ sao về trạng thái ban đầu: hành tinh về quỹ đạo gốc, thời gian về mốc
  // đầu. Tiện khi đã kéo hành tinh đi lung tung và muốn dựng lại hệ từ đầu.
  const recreateStar = () => {
    setPlanet(PLANET_HOME)
    setTime(TIME_HOME)
  }

  return (
    <div
      className={`widget dialectic-system is-${mode} is-phase-${phaseIndex} ${dragging ? 'is-dragging' : ''} ${handGrab ? 'is-hand-grab' : ''}`}
      style={{
        '--planet-x': `${planet.x}%`,
        '--planet-y': `${planet.y}%`,
        '--influence': influence,
        '--speed': `${8 - influence * 5}s`,
        '--phase': time,
      }}
    >
      <div
        ref={stageRef}
        className="dialectic-stage"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        role="application"
        aria-label="Kéo bất kỳ đâu trong sân khấu để di chuyển quả cầu (hoặc chụm tay để cầm)"
      >
        <div className="cosmic-dust-cloud" aria-hidden="true" />
        <div className="dialectic-star" aria-hidden="true" />

        <div className="orbit orbit--one" aria-hidden="true" />
        <div className="orbit orbit--two" aria-hidden="true" />
        <div className="orbit orbit--three" aria-hidden="true" />
        <div className="force-line force-line--a" aria-hidden="true" />
        <div className="force-line force-line--b" aria-hidden="true" />
        <div className="force-line force-line--c" aria-hidden="true" />

        <div className="system-planet system-planet--driver" aria-hidden="true">
          <span />
        </div>
        <div className="system-planet system-planet--echo system-planet--echo-a" aria-hidden="true" />
        <div className="system-planet system-planet--echo system-planet--echo-b" aria-hidden="true" />
        <div className="system-planet system-planet--echo system-planet--echo-c" aria-hidden="true" />
        <div className="asteroid-deflect" aria-hidden="true" />
        <div className="life-band" aria-hidden="true" />
        <div className="observer-station" aria-hidden="true" />

        <div className="view-toggle" role="group" aria-label="Chọn cách nhìn">
          {Object.entries(MODES).map(([id, item]) => (
            <button
              key={id}
              type="button"
              className={mode === id ? 'is-active' : ''}
              onClick={() => setMode(id)}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="star-reset"
          onClick={recreateStar}
          onPointerDown={(event) => event.stopPropagation()}
          title="Tái tạo sao — đưa hệ về ban đầu"
          aria-label="Tái tạo sao"
        >
          ⟳
        </button>

        <div className="system-readout" role="status">
          <strong>{mode === 'dialectic' ? 'Toàn hệ phản ứng' : 'Chỉ một vật đổi chỗ'}</strong>
          <p>{mode === 'dialectic' ? 'Một yếu tố lệch quỹ đạo làm đường lực, tốc độ và thiên thể khác biến đổi.' : MODES.static.message}</p>
        </div>
      </div>

      <div className="dialectic-controls">
        {handStore && <HandControlBar targets={handGrab ? [] : handTargets} {...hand} />}
        {handStore && (
          <p className="grab-hint">🤏 Chụm tay để cầm quả cầu · mở tay để thả.</p>
        )}

        <label className={`time-control ${hand.lockedKey === 'time' ? 'is-hand-locked' : ''}`}>
          <span>
            Thời gian
            <strong>{phase.label}</strong>
          </span>
          <input
            type="range"
            min="0"
            max={PHASES.length - 1}
            step="0.01"
            value={time}
            onChange={(event) => setTime(Number(event.target.value))}
            aria-label="Dòng thời gian phát triển của hệ sao"
          />
        </label>
      </div>
    </div>
  )
}
