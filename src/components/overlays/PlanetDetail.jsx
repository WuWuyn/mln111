import { useState } from 'react'
import { planetPalette, planets } from '../../data/cosmos'
import { quizBankByPlanet } from '../../data/quizBank'
import PlanetWidget from '../interactives'
import GuidanceModal from './GuidanceModal'
import HandWidgetCursor from './HandWidgetCursor'
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
      'Rê kính lúp soi đủ ba vùng của vũ trụ thật để vũ trụ trong ý thức sáng lên. Sau đó điều khiển kế hoạch: bấm chọn Robot / Trạm đo rồi bấm vào vũ trụ ý thức để đặt, bật đường bay, và thực hiện trong thực tiễn.',
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
      'Bấm dữ liệu (nước, nhiệt độ, bão từ) vào giả thuyết, chọn vùng đáp an toàn rồi phóng robot kiểm nghiệm. Sai thì điều chỉnh theo dữ liệu thật, đúng thì xây trạm để cải biến hiện thực.',
  },
}

function isVisualFirst(widget) {
  return widget === 'matter' || widget === 'consciousness' || widget === 'relation' || widget === 'contradiction' || widget === 'praxis'
}

// Chỉ trạm điều khiển bằng CON TRỎ (kính lúp / đặt robot) mới cần reticle bám
// ngón + bắn sự kiện chuột. Các trạm điều khiển bằng CỬ CHỈ (slider/nút qua
// useHandTargets) không cần — và chấm sáng đó còn vô tình dwell-click lung tung,
// nên tắt hẳn để hết "chấm theo ngón" và để slider bám ngón mượt hơn.
const CURSOR_WIDGETS = new Set(['consciousness'])

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
    <OverlayShell variant="overlay-panel--detail" onClose={onClose}>
      <header className="detail-head" style={{ '--accent': colors[1], '--accent-soft': colors[0] }}>
        <div className="detail-title-stack">
          <h2 className="detail-title">{copy.title}</h2>
          <span className="detail-type">{planet.concept}</span>
        </div>
        <div className="detail-head-actions">
          <button
            type="button"
            className="guide-icon-button detail-back-map"
            onClick={onClose}
            aria-label="Quay lại bản đồ vũ trụ"
            title="Quay lại bản đồ"
          >
            <span aria-hidden="true">←</span>
          </button>

          {/* Chuyển trạm ngay trong trang thực nghiệm — nút bấm nên điều khiển
              bằng tay (pinch/dwell) hoặc chuột đều được. */}
          <div className="detail-stations" role="group" aria-label="Chuyển trạm thực nghiệm">
            <button
              type="button"
              className="station-nav"
              onClick={() => onNavigate?.(prev)}
              aria-label={`Trạm trước: ${prev.name}`}
              title={`Trạm trước: ${prev.name}`}
            >
              ‹
            </button>
            <span className="station-count" aria-hidden="true">
              {index + 1}/{planets.length}
            </span>
            <button
              type="button"
              className="station-nav"
              onClick={() => onNavigate?.(next)}
              aria-label={`Trạm sau: ${next.name}`}
              title={`Trạm sau: ${next.name}`}
            >
              ›
            </button>
          </div>
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
            <span aria-hidden="true">ℹ</span>
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
          <PlanetWidget widget={planet.widget} handStore={handControlStore} />
        </aside>
      </div>

      {guideOpen && (
        <GuidanceModal
          title={copy.title}
          items={[
            copy.prompt,
            'Bằng tay: ✌ đổi mục · ☝ chỉnh hoặc bấm · ✊ nghỉ.',
            'Mở mini quiz ở góc trên để tự kiểm tra nhanh.',
          ]}
          onClose={() => setGuideOpen(false)}
        />
      )}

      {/* Con trỏ bằng tay CHỈ cho trạm dùng con trỏ (kính lúp/đặt robot). Trạm
          điều khiển bằng cử chỉ không render reticle → hết chấm sáng bám ngón. */}
      {handControlStore && CURSOR_WIDGETS.has(planet.widget) && <HandWidgetCursor store={handControlStore} />}
    </OverlayShell>
  )
}
