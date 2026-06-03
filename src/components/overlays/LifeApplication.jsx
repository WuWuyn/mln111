import { lifeCards } from '../../data/learning'
import OverlayShell from './OverlayShell'
import './LifeApplication.css'

export default function LifeApplication({ onClose, onGoQuiz, onGoBadge, progress }) {
  const hasChallengeScore = progress?.challengeScore !== null && progress?.challengeScore !== undefined

  return (
    <OverlayShell variant="overlay-panel--life" onClose={onClose}>
      <header className="life-header">
        <div className="life-header-text">
          <p className="overlay-eyebrow">Vận dụng</p>
          <h2 className="life-title">Đưa triết học trở lại đời sống</h2>
        </div>
        <button type="button" className="overlay-close" onClick={onClose} aria-label="Đóng">
          ×
        </button>
      </header>

      <p className="life-lead">
        Mỗi tình huống là một cách kiểm nghiệm: khái niệm không chỉ để nhớ, mà để nhìn lại lựa chọn,
        mâu thuẫn và điều kiện cụ thể trong đời sống.
      </p>

      <div className="life-actions">
        <button type="button" className="primary-action" onClick={onGoQuiz}>
          Làm quiz vận dụng
        </button>
        <button type="button" className="ghost-action" onClick={onGoBadge}>
          {hasChallengeScore ? 'Xem huy hiệu' : 'Hồ sơ hành trình'}
        </button>
      </div>

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
