import { lifeCards } from '../../data/learning'
import OverlayShell from './OverlayShell'
import './LifeApplication.css'

// "Triết học trong đời sống" — relatable situations, each read through a
// dialectical-materialist lens, so the philosophy feels close, not textbookish.
export default function LifeApplication({ onClose }) {
  return (
    <OverlayShell variant="overlay-panel--life" onClose={onClose}>
      <header className="life-header">
        <div className="life-header-text">
          <p className="overlay-eyebrow">Triết học trong đời sống</p>
          <h2 className="life-title">Mỗi tình huống một góc nhìn</h2>
        </div>
        <button type="button" className="overlay-close" onClick={onClose} aria-label="Đóng">
          ×
        </button>
      </header>

      <p className="life-lead">
        Triết học không xa vời. Dưới đây là những tình huống quen thuộc của sinh viên, mỗi tình huống
        được soi bằng một nguyên lý của chủ nghĩa duy vật biện chứng.
      </p>

      <div className="life-grid">
        {lifeCards.map((card) => (
          <article key={card.id} className="life-card">
            <div className="life-icon-wrap" aria-hidden="true">
              {card.icon}
            </div>
            <h3 className="life-card-title">{card.title}</h3>
            <span className="life-lens">{card.lens}</span>
            <p className="life-insight">{card.insight}</p>
          </article>
        ))}
      </div>
    </OverlayShell>
  )
}
