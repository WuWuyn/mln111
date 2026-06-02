export default function InfoPanel({ planet, onClose }) {
  return (
    <aside className="info-panel">
      <div className="panel-top">
        <p className="eyebrow">{planet.signal}</p>
        <button type="button" onClick={onClose} aria-label="Ẩn bảng thông tin">
          ×
        </button>
      </div>
      <h2>{planet.name}</h2>
      <p className="panel-type">{planet.type}</p>
      <p>{planet.summary}</p>
      <ul>
        {planet.details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
      <div className="concept-strip">
        <span>Khái niệm trọng tâm</span>
        <strong>{planet.concept}</strong>
      </div>
    </aside>
  )
}
