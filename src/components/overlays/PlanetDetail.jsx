import { planetPalette, planets } from '../../data/cosmos'
import PlanetWidget from '../interactives'
import MiniQuiz from './MiniQuiz'
import OverlayShell from './OverlayShell'

// Full detail "page" for a planet: definition + plain explanation + life example
// on the left, the matching interactive experiment on the right, and a mini quiz
// to confirm understanding. Prev/next buttons nudge the user to visit them all.
export default function PlanetDetail({ planet, onClose, onNavigate, onQuizPass }) {
  const colors = planetPalette[planet.color] ?? planetPalette.cyan
  const index = planets.findIndex((item) => item.id === planet.id)
  const prev = planets[(index - 1 + planets.length) % planets.length]
  const next = planets[(index + 1) % planets.length]

  return (
    <OverlayShell variant="overlay-panel--detail" onClose={onClose}>
      <header className="detail-head" style={{ '--accent': colors[1], '--accent-soft': colors[0] }}>
        <div>
          <p className="overlay-eyebrow">{planet.chapter}</p>
          <h2 className="detail-title">{planet.name}</h2>
          <p className="detail-type">{planet.type}</p>
        </div>
        <button type="button" className="overlay-close" onClick={onClose} aria-label="Đóng trang">
          ×
        </button>
      </header>

      <div className="detail-body">
        <div className="detail-text">
          <section className="detail-block">
            <h3>Định nghĩa</h3>
            <p className="detail-define">{planet.definition}</p>
          </section>
          <section className="detail-block">
            <h3>Giải thích dễ hiểu</h3>
            <p>{planet.explanation}</p>
          </section>
          <section className="detail-block detail-block--example">
            <h3>Ví dụ đời sống</h3>
            <p>{planet.example}</p>
          </section>
        </div>

        <aside className="detail-interactive">
          <p className="overlay-eyebrow">Trải nghiệm tương tác</p>
          <PlanetWidget widget={planet.widget} />
        </aside>
      </div>

      <MiniQuiz key={planet.id} quiz={planet.miniQuiz} onPass={() => onQuizPass?.(planet.id)} />

      <footer className="detail-foot">
        <button type="button" className="detail-nav" onClick={() => onNavigate?.(prev)}>
          ← {prev.name}
        </button>
        <span className="detail-foot-meta">
          Hành tinh {index + 1}/{planets.length}
        </span>
        <button type="button" className="detail-nav detail-nav--next" onClick={() => onNavigate?.(next)}>
          {next.name} →
        </button>
      </footer>
    </OverlayShell>
  )
}
