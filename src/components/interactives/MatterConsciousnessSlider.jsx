import { useMemo, useState } from 'react'
import { useHandTargets } from '../../hand/useHandTargets'
import HandControlBar from './HandControlBar'

const COGNITION_LAYERS = [
  {
    value: 0,
    label: 'Cảm giác',
    insight: 'Ta mới chạm lớp bên ngoài của vật chất: màu, sáng và chuyển động.',
  },
  {
    value: 33,
    label: 'Hiện tượng',
    insight: 'Cái thấy được chưa phải toàn bộ bản chất: bề mặt, khí quyển và đại dương chỉ là lớp hiện ra.',
  },
  {
    value: 66,
    label: 'Cấu trúc',
    insight: 'Nhận thức đi sâu hơn vào lõi, vật chất bên trong và từ trường.',
  },
  {
    value: 100,
    label: 'Quy luật',
    insight: 'Quỹ đạo, lực hút và vận động vẫn hoạt động dù không có người nhìn.',
  },
]

const INSIGHTS = {
  silent: {
    stage: 'Quá trình',
    title: 'Ý thức vắng mặt',
    body: 'Vật chất vẫn vận động khi ta ngừng quan sát.',
  },
  observer: {
    stage: 'Lớp quan sát',
    title: 'Lớp quan sát',
    body: 'Nhãn, số liệu giúp quan sát — không thay được hiện thực.',
  },
  reality: {
    stage: 'Lớp hiện thực',
    title: 'Lớp hiện thực',
    body: 'Vận động, va chạm, lực hút là khách quan.',
  },
}

function layerFor(value) {
  return COGNITION_LAYERS.reduce((closest, layer) => {
    return Math.abs(layer.value - value) < Math.abs(closest.value - value) ? layer : closest
  }, COGNITION_LAYERS[0])
}

export default function MatterConsciousnessSlider({ handStore }) {
  const [observerOn, setObserverOn] = useState(true)
  const [cognition, setCognition] = useState(28)
  const [activeInsight, setActiveInsight] = useState('observer')
  const layer = useMemo(() => layerFor(cognition), [cognition])
  const depth = cognition / 100
  const insight =
    activeInsight === 'layer'
      ? { stage: 'Hiện tượng', title: layer.label, body: layer.insight }
      : INSIGHTS[activeInsight]

  const toggleObserver = () => {
    setObserverOn((value) => {
      const next = !value
      setActiveInsight(next ? 'observer' : 'silent')
      return next
    })
  }

  const updateCognition = (value) => {
    setCognition(value)
    setActiveInsight('layer')
  }

  const handTargets = [
    { key: 'cognition', kind: 'slider', label: 'Nhận thức', get: () => cognition, set: updateCognition, min: 0, max: 100, step: 1, mapping: 'absolute' },
    { key: 'observer', kind: 'button', label: observerOn ? 'Tắt soi' : 'Bật soi', onPress: toggleObserver },
  ]
  const hand = useHandTargets(handStore, handTargets)

  return (
    <div className={`widget widget-matter silent-universe ${observerOn ? 'is-observed' : 'is-silent'}`}>
      <div className="silent-scene" style={{ '--depth': depth }}>
        <div className="cosmic-drift cosmic-drift--one" aria-hidden="true" />
        <div className="cosmic-drift cosmic-drift--two" aria-hidden="true" />
        <div className="gravity-well" aria-hidden="true" />
        <div className="star-model" aria-hidden="true" />
        <div className="orbit-arc orbit-arc--outer" aria-hidden="true" />
        <div className="orbit-arc orbit-arc--inner" aria-hidden="true" />
        <div className="matter-planet-model" aria-hidden="true">
          <div className="planet-shell" />
          <div className="planet-core-cutaway" />
          <div className="planet-field" />
          <div className="planet-scan" />
        </div>
        <div className="meteor meteor--one" aria-hidden="true" />
        <div className="meteor meteor--two" aria-hidden="true" />
        <div className="observer-eye" aria-hidden="true">
          <span />
        </div>
        <div className="observer-grid" aria-hidden="true" />
        <div className="observer-label observer-label--planet">
          <strong>M-01</strong>
          <span>tọa độ / quỹ đạo</span>
        </div>
        <div className="observer-label observer-label--law">
          <strong>Lực hút</strong>
          <span>vẫn vận hành</span>
        </div>

        <button
          type="button"
          className="knowledge-pulse knowledge-pulse--reality"
          onClick={() => setActiveInsight('reality')}
          aria-label="Mở kiến thức về lớp hiện thực"
        >
          <span>Lớp hiện thực</span>
          <strong>Vận động vẫn diễn ra</strong>
        </button>

        <div className="matter-insight" role="status">
          <span>{insight.stage}</span>
          <strong>{insight.title}</strong>
          <p>{insight.body}</p>
        </div>
      </div>

      <div className="matter-controls matter-controls--minimal">
        {handStore && <HandControlBar targets={handTargets} {...hand} />}

        <button
          type="button"
          className={`observer-toggle ${observerOn ? 'is-on' : ''}`}
          onClick={toggleObserver}
          aria-pressed={observerOn}
        >
          <span className="observer-toggle-light" />
          {observerOn ? 'Tắt soi' : 'Bật soi'}
        </button>

        <label className={`widget-control cognition-control ${hand.lockedKey === 'cognition' ? 'is-hand-locked' : ''}`}>
          <span className="widget-control-label">
            Mức độ nhận thức
            <strong>{layer.label}</strong>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={cognition}
            onChange={(event) => updateCognition(Number(event.target.value))}
            aria-label="Mức độ nhận thức về vật chất"
          />
        </label>
      </div>
    </div>
  )
}
