import { useMemo, useState } from 'react'

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
    mark: '!',
    title: 'Ý thức vắng mặt',
    body: 'Hành tinh vẫn quay. Vật chất không biến mất khi ta ngừng quan sát.',
  },
  observer: {
    mark: '?',
    title: 'Lớp quan sát',
    body: 'Scan, nhãn và số liệu chỉ là hình ảnh của thế giới trong ý thức.',
  },
  reality: {
    mark: '!',
    title: 'Lớp hiện thực',
    body: 'Chuyển động, va chạm và lực hút thuộc về thế giới khách quan.',
  },
}

function layerFor(value) {
  return COGNITION_LAYERS.reduce((closest, layer) => {
    return Math.abs(layer.value - value) < Math.abs(closest.value - value) ? layer : closest
  }, COGNITION_LAYERS[0])
}

export default function MatterConsciousnessSlider() {
  const [observerOn, setObserverOn] = useState(true)
  const [cognition, setCognition] = useState(28)
  const [activeInsight, setActiveInsight] = useState('observer')
  const layer = useMemo(() => layerFor(cognition), [cognition])
  const depth = cognition / 100
  const insight =
    activeInsight === 'layer'
      ? { mark: cognition < 16 ? '?' : '!', title: layer.label, body: layer.insight }
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
          !
        </button>
        <button
          type="button"
          className="knowledge-pulse knowledge-pulse--observer"
          onClick={() => setActiveInsight('observer')}
          aria-label="Mở kiến thức về lớp quan sát"
        >
          ?
        </button>

        <div className="matter-insight" role="status">
          <span>{insight.mark}</span>
          <strong>{insight.title}</strong>
          <p>{insight.body}</p>
        </div>
      </div>

      <div className="matter-controls matter-controls--minimal">
        <button
          type="button"
          className={`observer-toggle ${observerOn ? 'is-on' : ''}`}
          onClick={toggleObserver}
          aria-pressed={observerOn}
        >
          <span className="observer-toggle-light" />
          {observerOn ? 'Xóa người quan sát' : 'Bật người quan sát'}
        </button>

        <label className="widget-control cognition-control">
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
