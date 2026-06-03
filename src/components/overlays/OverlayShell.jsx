import { useEffect } from 'react'

// Shared shell for every 2D content page that slides over the 3D cosmos. Owns
// the scrim, the scrollable panel, and Escape-to-close so individual overlays
// stay focused on their content.
export default function OverlayShell({ variant = '', onClose, children }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay-root" role="dialog" aria-modal="true">
      <button type="button" className="overlay-scrim" aria-label="Đóng" onClick={onClose} />
      <div className={`overlay-panel ${variant}`}>{children}</div>
    </div>
  )
}
