import { useState } from 'react'
import { planetPalette, planets } from '../../data/cosmos'
import { quizBankByPlanet } from '../../data/quizBank'
import PlanetWidget from '../interactives'
import GuidanceModal from './GuidanceModal'
import MiniQuiz from './MiniQuiz'
import OverlayShell from './OverlayShell'
import './PlanetDetail.css'

const EXPERIENCE_COPY = {
  matter: {
    title: 'The Silent Universe',
    kicker: 'Vũ trụ trước khi có ý thức.',
    prompt:
      'Bật hoặc tắt lớp quan sát để thấy điểm cốt lõi: khi nhãn, scan và dữ liệu biến mất, hành tinh vẫn quay, quỹ đạo vẫn chạy và vật chất vẫn vận động.',
  },
  consciousness: {
    title: 'Cosmic Mirror',
    kicker: 'Tấm gương vũ trụ trong ý thức.',
    prompt:
      'Soi vũ trụ thật, kiểm tra xem mô hình trong ý thức đã phản ánh đủ chưa, rồi biến mô hình đó thành kế hoạch thực tiễn.',
  },
  relation: {
    title: 'Hệ Quỹ Đạo Biện Chứng',
    kicker: 'Không có gì cô lập, không có gì đứng yên.',
    prompt:
      'Kéo một hành tinh để thấy toàn hệ sao phản ứng, rồi kéo thời gian để xem hệ phát triển từ bụi vũ trụ tới nhận thức.',
  },
  contradiction: {
    title: 'Lõi Sao Biện Chứng',
    kicker: 'Mâu thuẫn tạo động lực. Lượng tích lũy tạo bước nhảy.',
    prompt:
      'Nhìn vào lõi sao, cân hai lực đối lập rồi tích lũy lượng đến điểm nút. Trước điểm nút sao chỉ sáng dần; vượt điểm nút, chất mới ra đời.',
  },
  praxis: {
    title: 'Trạm Kiểm Nghiệm Thực Tiễn',
    kicker: 'Nghĩ đúng chưa đủ, phải kiểm chứng trong hiện thực.',
    prompt:
      'Quan sát hành tinh, kéo dữ liệu vào giả thuyết, phóng robot kiểm nghiệm rồi điều chỉnh nhận thức. Khi giả thuyết đi qua thực tiễn thành công, hãy dùng nó để xây trạm trên hiện thực.',
  },
}

function isVisualFirst(widget) {
  return widget === 'matter' || widget === 'consciousness' || widget === 'relation' || widget === 'contradiction' || widget === 'praxis'
}

export default function PlanetDetail({ planet, onClose, onNavigate, onQuizPass, handControlStore }) {
  const [guideOpen, setGuideOpen] = useState(false)
  const colors = planetPalette[planet.color] ?? planetPalette.cyan
  const index = planets.findIndex((item) => item.id === planet.id)
  const prev = planets[(index - 1 + planets.length) % planets.length]
  const next = planets[(index + 1) % planets.length]
  const relatedPlanets = planets.filter((item) => item.widget === planet.widget)
  const copy = EXPERIENCE_COPY[planet.widget] ?? {
    title: `Thực nghiệm ${planet.name}`,
    kicker: 'Tương tác trực tiếp với mô hình để tự rút ra quy luật.',
    prompt: planet.summary,
  }

  return (
    <OverlayShell variant="overlay-panel--detail" modal onClose={onClose}>
      <header className="detail-head" style={{ '--accent': colors[1], '--accent-soft': colors[0] }}>
        <div className="detail-title-stack">
          <p className="overlay-eyebrow">Trạm tương tác</p>
          <h2 className="detail-title">{copy.title}</h2>
          <div className="detail-title-meta">
            <span className="detail-type">{copy.kicker}</span>
            <span className="detail-stage-tag">{planet.concept}</span>
          </div>
        </div>
        <div className="detail-head-actions">
          <button
            type="button"
            className="guide-icon-button detail-back-map"
            onClick={onClose}
            aria-label="Quay lại bản đồ vũ trụ"
            title="Quay lại bản đồ"
          >
            ← Bản đồ
          </button>
          <MiniQuiz
            key={planet.id}
            quizzes={quizBankByPlanet[planet.id] ?? [planet.miniQuiz]}
            onPass={() => onQuizPass?.(planet.id)}
          />
          <button
            type="button"
            className="guide-icon-button"
            onClick={() => setGuideOpen(true)}
            aria-label="Mở hướng dẫn tương tác"
            title="Hướng dẫn"
          >
            Hướng dẫn
          </button>
          <button type="button" className="overlay-close" onClick={onClose} aria-label="Đóng trang">
            ×
          </button>
        </div>
      </header>

      <div className={`detail-body ${isVisualFirst(planet.widget) ? 'detail-body--visual-first' : ''}`}>
        <div className="detail-text">
          <section className="detail-block detail-block--experience">
            <h3>Cách chơi</h3>
            <p className="detail-define">{copy.prompt}</p>
          </section>

          <section className="detail-block">
            <h3>Khái niệm trong cụm</h3>
            <div className="experience-planet-list">
              {relatedPlanets.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`experience-planet-card ${item.id === planet.id ? 'is-active' : ''}`}
                  onClick={() => onNavigate?.(item)}
                >
                  <span>{item.signal}</span>
                  <strong>{item.name}</strong>
                  <small>{item.concept}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="detail-block detail-block--example">
            <h3>Gợi ý quan sát</h3>
            <p>
              Bắt đầu từ <strong>{planet.name}</strong>, thay đổi mô hình bên cạnh rồi đọc phản hồi. Mục tiêu không phải
              thuộc lòng định nghĩa, mà là thấy quan hệ vận động của khái niệm.
            </p>
          </section>
        </div>

        <aside className="detail-interactive">
          <p className="overlay-eyebrow">Mô hình tương tác</p>
          <PlanetWidget widget={planet.widget} handStore={handControlStore} />
        </aside>
      </div>

      <footer className="detail-foot">
        <button
          type="button"
          className="detail-nav"
          onClick={() => onNavigate?.(prev)}
          aria-label={`Chuyển đến ${prev.name}`}
          title={prev.name}
        >
          <span className="detail-nav-label">{prev.name}</span>
        </button>
        <span className="detail-foot-meta">
          Trạm {index + 1}/{planets.length}
        </span>
        <button
          type="button"
          className="detail-nav detail-nav--next"
          onClick={() => onNavigate?.(next)}
          aria-label={`Chuyển đến ${next.name}`}
          title={next.name}
        >
          <span className="detail-nav-label">{next.name}</span>
        </button>
      </footer>

      {guideOpen && (
        <GuidanceModal
          title={copy.title}
          items={[
            copy.prompt,
            'Thử kéo, bấm hoặc thay đổi các nút điều khiển trong mô hình để quan sát phản hồi.',
            'Sau khi hiểu cơ chế, mở mini quiz ở hàng nút trên cùng để tự kiểm tra nhanh.',
          ]}
          onClose={() => setGuideOpen(false)}
        />
      )}
    </OverlayShell>
  )
}
