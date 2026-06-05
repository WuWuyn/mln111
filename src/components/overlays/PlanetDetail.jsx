import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { planetPalette, planets } from '../../data/cosmos'
import { quizBankByPlanet } from '../../data/quizBank'
import PlanetWidget from '../interactives'
import GuidanceModal from './GuidanceModal'
import HandWidgetCursor from './HandWidgetCursor'
import MiniQuiz from './MiniQuiz'
import OverlayShell from './OverlayShell'
import './PlanetDetail.css'

// Mỗi trạm thực nghiệm có:
//  • prompt — tóm tắt "Cách chơi" (hiện ở thân trang + đầu hộp hướng dẫn)
//  • steps  — các bước chơi (mục tiêu từng bước), đúng với game hiện tại
//  • mouse  — cách thao tác bằng CHUỘT cho trạm này
//  • hand   — cách thao tác bằng CAMERA TAY (trạm con trỏ dùng kính lúp/pinch;
//    trạm cử chỉ dùng useHandTargets ✌/🖐/☝/✊)
const EXPERIENCE_COPY = {
  matter: {
    title: 'The Silent Universe',
    kicker: 'Vũ trụ trước khi có ý thức.',
    prompt:
      'Bật / tắt "lớp quan sát" để thấy điểm cốt lõi: khi nhãn, lưới scan và số liệu biến mất, hành tinh vẫn quay và quỹ đạo vẫn chạy — vật chất tồn tại khách quan, không phụ thuộc việc ta nhìn.',
    steps: [
      'Tắt lớp quan sát — chú ý hành tinh và quỹ đạo vẫn vận động dù không còn nhãn, số liệu.',
      'Tăng dần mức nhận thức: Cảm giác → Hiện tượng → Cấu trúc → Quy luật.',
      'Mở "Lớp hiện thực" để hiểu vì sao vận động, va chạm, lực hút là khách quan.',
    ],
    mouse: 'Bấm nút Bật / Tắt soi, kéo thanh "Mức độ nhận thức", bấm ô "Lớp hiện thực".',
    hand: '✌ mục sau · 🖐 mục trước · ☝ kéo để chỉnh thanh / bấm nút · ✊ nghỉ.',
  },
  consciousness: {
    title: 'Cosmic Mirror',
    kicker: 'Tấm gương vũ trụ trong ý thức.',
    prompt:
      'Rê kính lúp soi đủ ba vùng của vũ trụ thật để vũ trụ trong ý thức sáng lên — ý thức là sự phản ánh hiện thực. Khi đã phản ánh đủ, lập kế hoạch trong ý thức rồi thực hiện để cải biến hiện thực.',
    steps: [
      'Soi đủ 3 vùng của vũ trụ thật (hành tinh, quỹ đạo, bão từ) cho vũ trụ trong ý thức sáng lên.',
      'Đặt Robot và Trạm đo vào vũ trụ trong ý thức.',
      'Vẽ đường bay cho kế hoạch.',
      'Thực hiện trong thực tiễn để biến kế hoạch thành hiện thực.',
    ],
    mouse: 'Giữ và rê kính lúp trên vũ trụ thật; kéo–thả Robot / Trạm đo; kéo để vẽ đường bay; bấm "Thực hiện".',
    hand: 'Kính lúp bám theo con trỏ tay · chụm ngón để bấm · giữ con trỏ yên để tự kích hoạt.',
  },
  relation: {
    title: 'Hệ Quỹ Đạo Biện Chứng',
    kicker: 'Không có gì cô lập, không có gì đứng yên.',
    prompt:
      'Kéo một hành tinh để thấy cả hệ sao phản ứng theo — không gì cô lập. Đổi giữa "Siêu hình" và "Biện chứng" để so sánh hai cách nhìn, rồi kéo thời gian để xem hệ phát triển từ bụi vũ trụ tới khi nhận thức xuất hiện.',
    steps: [
      'Di chuyển một hành tinh — ở chế độ Biện chứng, đường lực và các thiên thể khác đổi theo.',
      'So sánh hai cách nhìn: Siêu hình (cô lập, tĩnh tại) vs. Biện chứng (liên hệ, vận động).',
      'Tua dòng Thời gian: Bụi vũ trụ → Kết tụ → Hệ ổn định → Điều kiện sống → Nhận thức.',
      'Tái tạo sao để đưa hệ về trạng thái ban đầu.',
    ],
    mouse: 'Kéo hành tinh bất kỳ đâu trong sân khấu; bấm Siêu hình / Biện chứng; kéo thanh Thời gian; bấm ⟳.',
    hand: '✌/🖐 đổi mục · ☝ kéo chỉnh / bấm nút · 🤏 chụm tay cầm và kéo quả cầu · ✊ nghỉ.',
  },
  contradiction: {
    title: 'Lõi Sao Biện Chứng',
    kicker: 'Mâu thuẫn tạo động lực. Lượng tích lũy tạo bước nhảy.',
    prompt:
      'Cân hai lực "Cái cũ" và "Cái mới" cho cân bằng để mở khoá tích lũy lượng. Sau đó gõ liên tục vào lõi sao để dồn lượng tới điểm nút — vượt điểm nút, chất mới ra đời (bước nhảy). Lệch quá về một phía sẽ đình trệ hoặc đổ vỡ.',
    steps: [
      'Cân hai lực Cái cũ / Cái mới đến trạng thái "Phát triển" để mở tích lũy lượng.',
      'Gõ liên tục vào lõi sao để dồn "Lượng" lên thanh đo.',
      'Đẩy Lượng vượt "Điểm nút" để tạo bước nhảy sang chất mới.',
      'Tái tạo để chơi lại; phóng to để nhìn vào lõi sao.',
    ],
    mouse: 'Kéo hai thanh lực; bấm (click) liên tục vào lõi sao để dồn lượng; bấm "Tái tạo".',
    hand: '☝ rê con trỏ · chụm ngón cái–trỏ để gõ lõi sao (hoặc giữ con trỏ yên để tự gõ) · kéo nhẹ để chỉnh lực.',
  },
  praxis: {
    title: 'Trạm Kiểm Nghiệm Thực Tiễn',
    kicker: 'Nghĩ đúng chưa đủ, phải kiểm chứng trong hiện thực.',
    prompt:
      'Trọng lực hành tinh bị ẩn nên không thể tính ra lực đẩy đúng bằng suy nghĩ suông — chỉ thực tiễn mới trả lời. Chỉnh "Lực đẩy" rồi "Đốt động cơ": quá mạnh tàu vọt lên, quá yếu tàu rơi vỡ, vừa đúng thì hạ cánh êm.',
    meaning:
      'Trọng lực ẩn chính là phần hiện thực mà tư duy chưa nắm được: dù số đông đồng tình, người uy tín khẳng định hay suy luận nghe rất hợp lý, không cách nghĩ nào tự nó cho ra con số đúng — chỉ lần "Đốt động cơ" thật mới phán xử. Mỗi lần thử và đọc phản hồi ↑/↓ là một vòng "thực tiễn → nhận thức → lại thực tiễn": ta hành động, hiện thực trả lời, ta điều chỉnh rồi thử tiếp cho tới khi hạ cánh êm. Đó là lý do triết học Mác – Lênin coi thực tiễn vừa là động lực, vừa là tiêu chuẩn của chân lý — và là điều game này muốn bạn tự tay trải nghiệm thay vì chỉ đọc định nghĩa.',
    steps: [
      'Chọn một mức Lực đẩy để thử.',
      'Đốt động cơ để kiểm nghiệm — tàu vọt lên (quá mạnh) hay rơi vỡ (quá yếu).',
      'Theo phản hồi ↑/↓ điều chỉnh lực rồi đốt lại tới khi hạ cánh êm.',
      'Xây trạm để cải biến hiện thực, hoặc đổi lượt với trọng lực ẩn mới.',
      'Gợi ý của Số đông / Uy tín / Suy luận đều lệch — chỉ thực tiễn mới là tiêu chuẩn của chân lý.',
    ],
    mouse: 'Kéo thanh "Lực đẩy"; bấm "Đốt động cơ"; rồi "Xây trạm" / "Lượt khác".',
    hand: '✌ mục sau · 🖐 mục trước · ☝ kéo chỉnh lực / bấm nút · ✊ nghỉ.',
  },
}

function isVisualFirst(widget) {
  return widget === 'matter' || widget === 'consciousness' || widget === 'relation' || widget === 'contradiction' || widget === 'praxis'
}

// Trạm điều khiển bằng CON TRỎ cần reticle bám ngón + bắn sự kiện chuột:
//  • consciousness — rê kính lúp / đặt robot.
//  • contradiction — "gõ" vào lõi sao bằng pinch (cú bấm) hoặc dwell (giữ yên).
// Các trạm còn lại điều khiển bằng CỬ CHỈ (slider/nút qua useHandTargets) nên
// tắt reticle để hết "chấm theo ngón" và để slider bám ngón mượt hơn.
const CURSOR_WIDGETS = new Set(['consciousness', 'contradiction'])

// Lướt tay đổi trạm — cùng "ngôn ngữ" với lướt chuyển trang ở bản đồ: xòe bàn
// tay (mode 'navigate') rồi quét ngang nhanh. Ngưỡng giống bản đồ cho quen tay.
const SWIPE_DISTANCE = 0.3
const SWIPE_WINDOW_MS = 320
const SWIPE_MIN_MS = 70
const SWIPE_COOLDOWN_MS = 1100

export default function PlanetDetail({ planet, onClose, onNavigate, onQuizPass, handControlStore }) {
  const [guideOpen, setGuideOpen] = useState(false)
  const [swipeFlash, setSwipeFlash] = useState(null)
  const colors = planetPalette[planet.color] ?? planetPalette.cyan
  const index = planets.findIndex((item) => item.id === planet.id)
  const prev = planets[(index - 1 + planets.length) % planets.length]
  const next = planets[(index + 1) % planets.length]

  // Vòng đăng ký store chỉ chạy một lần; đọc trạm trước/kế hiện tại qua ref để
  // không bị "kẹt" giá trị cũ khi đã chuyển sang trạm khác.
  const navRef = useRef({ prev, next, onNavigate })
  useEffect(() => {
    navRef.current = { prev, next, onNavigate }
  })

  useEffect(() => {
    if (!handControlStore) return undefined
    const swipe = { samples: [], cooldownUntil: 0 }

    const unsubscribe = handControlStore.subscribe((control) => {
      if (!control.active || control.mode !== 'navigate' || typeof control.rawX !== 'number') {
        swipe.samples.length = 0
        return
      }

      const now = performance.now()
      if (now < swipe.cooldownUntil) return

      swipe.samples.push({ t: now, x: control.rawX })
      const cutoff = now - SWIPE_WINDOW_MS
      while (swipe.samples.length && swipe.samples[0].t < cutoff) swipe.samples.shift()
      if (swipe.samples.length < 3) return

      const oldest = swipe.samples[0]
      const dx = control.rawX - oldest.x
      if (Math.abs(dx) >= SWIPE_DISTANCE && now - oldest.t >= SWIPE_MIN_MS) {
        swipe.cooldownUntil = now + SWIPE_COOLDOWN_MS
        swipe.samples.length = 0
        const dir = dx > 0 ? 1 : -1
        const { prev: p, next: n, onNavigate: go } = navRef.current
        setSwipeFlash({ dir, key: now })
        go?.(dir > 0 ? n : p)
      }
    })

    return unsubscribe
  }, [handControlStore])

  useEffect(() => {
    if (!swipeFlash) return undefined
    const timer = setTimeout(() => setSwipeFlash(null), 650)
    return () => clearTimeout(timer)
  }, [swipeFlash])
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

          {copy.meaning && (
            <section className="detail-block detail-block--meaning">
              <h3>Ý nghĩa của game</h3>
              <p>{copy.meaning}</p>
            </section>
          )}

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
          steps={copy.steps ?? [copy.prompt]}
          controls={[
            { icon: '🖱️', label: 'Chuột', text: copy.mouse ?? 'Bấm và kéo trực tiếp các nút, thanh trượt trên trạm.' },
            { icon: '✋', label: 'Camera tay', text: copy.hand ?? '☝ rê con trỏ · chụm ngón để bấm · ✊ nghỉ.' },
          ]}
          tips={[
            'Camera tay: xòe bàn tay rồi lướt ngang để chuyển sang trạm trước / kế.',
            'Mở mini quiz ở góc trên để tự kiểm tra nhanh.',
          ]}
          onClose={() => setGuideOpen(false)}
        />
      )}

      {/* Ký hiệu mũi tên lóe lên khi lướt tay đổi trạm — portal ra body để
          position:fixed không bị lớp overlay (transform/overflow) cắt mất. */}
      {swipeFlash &&
        createPortal(
          <div
            key={swipeFlash.key}
            className={`swipe-flash ${swipeFlash.dir > 0 ? 'to-next' : 'to-prev'}`}
            aria-hidden="true"
          >
            {swipeFlash.dir > 0 ? '⟶' : '⟵'}
          </div>,
          document.body,
        )}

      {/* Con trỏ bằng tay CHỈ cho trạm dùng con trỏ (kính lúp/đặt robot). Trạm
          điều khiển bằng cử chỉ không render reticle → hết chấm sáng bám ngón. */}
      {handControlStore && CURSOR_WIDGETS.has(planet.widget) && <HandWidgetCursor store={handControlStore} />}
    </OverlayShell>
  )
}
