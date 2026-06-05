import { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Hộp hướng dẫn dùng chung cho trạm thực nghiệm + quiz.
//  • steps    — các bước chơi (đánh số). Tương thích ngược: nếu chỉ truyền
//    `items` (như QuizChallenge) thì coi đó là steps.
//  • controls — hướng dẫn ĐIỀU KHIỂN cho cả hai mode: chuột và camera tay.
//  • tips     — mẹo phụ (lướt đổi trạm, mở quiz…).
export default function GuidanceModal({ title, eyebrow = 'Hướng dẫn', items, steps, controls, tips, onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const stepList = steps ?? items ?? []

  const modal = (
    <div className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-modal-title">
      <div className="guide-modal-panel">
        <header className="guide-modal-head">
          <div>
            <p className="guide-modal-eyebrow">{eyebrow}</p>
            <h3 id="guide-modal-title">{title}</h3>
          </div>
          <button type="button" className="guide-modal-close" onClick={onClose} aria-label="Đóng hướng dẫn">
            ×
          </button>
        </header>

        {stepList.length > 0 && (
          <>
            <p className="guide-modal-section">Các bước</p>
            <ol className="guide-modal-list">
              {stepList.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </>
        )}

        {controls && controls.length > 0 && (
          <>
            <p className="guide-modal-section">Điều khiển</p>
            <ul className="guide-controls">
              {controls.map((control) => (
                <li key={control.label} className="guide-control">
                  <span className="guide-control-mode">
                    <span className="guide-control-ico" aria-hidden="true">
                      {control.icon}
                    </span>
                    {control.label}
                  </span>
                  <span className="guide-control-text">{control.text}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {tips && tips.length > 0 && (
          <ul className="guide-tips">
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
