import { useEffect } from 'react'

// Shared shell for every 2D content page. Each one is a full, standalone page
// (not a popup over the cosmos): it fills the viewport, scrolls on its own, and
// Escape sends the reader back to the map.
export default function OverlayShell({ variant = '', onClose, children }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={`content-page ${variant}`}>
      <div className="content-page-inner">{children}</div>
    </div>
  )
}
