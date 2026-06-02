import { introCards } from '../../data/cosmos'

export default function LandingOverlay({ started, onStart }) {
  if (started) return null

  return (
    <section className="landing-overlay" aria-labelledby="landing-title">
      <p className="eyebrow">Cổng vào Vũ Trụ Triết Học</p>
      <h1 id="landing-title">Triết học Mác - Lênin</h1>
      <p className="slogan">Từ những khái niệm trừu tượng, mở ra cách nhìn mới về thế giới.</p>
      <button className="primary-action" type="button" onClick={onStart}>
        Bắt đầu du hành
      </button>
      <div className="intro-grid">
        {introCards.map((card) => (
          <article key={card.id}>
            <span>{card.index}</span>
            <h2>{card.title}</h2>
            <p>{card.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
