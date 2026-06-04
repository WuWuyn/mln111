import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function GuidanceModal({ title, eyebrow = 'Hướng dẫn', items, onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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

        <ol className="guide-modal-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
