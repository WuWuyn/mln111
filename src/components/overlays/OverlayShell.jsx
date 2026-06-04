import { useEffect } from 'react'

// Shared shell for every 2D content page. Full pages fill the viewport; modal
// pages sit above the live cosmos scene. Escape sends the reader back.
export default function OverlayShell({ variant = '', modal = false, onClose, children }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={`content-page ${variant}`} role={modal ? 'dialog' : undefined} aria-modal={modal || undefined}>
      <div className="content-page-inner">{children}</div>
    </div>
  )
}
