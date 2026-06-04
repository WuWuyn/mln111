import { useEffect } from 'react'

// Shared shell for every 2D content page. Full pages fill the viewport; modal
// pages sit above the live cosmos scene. Escape sends the reader back.
export default function OverlayShell({ variant = '', modal = false, onClose, style, children }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // The detail station already carries its own per-widget HUD shell (scanlines +
  // frame), so we skip the overlay-level scan there to avoid doubling; every other
  // content page (quiz / life / badge) gets the shared HUD chrome.
  const isDetail = variant.includes('detail')

  return (
    <div
      className={`content-page ${variant}`}
      role={modal ? 'dialog' : undefined}
      aria-modal={modal || undefined}
      style={style}
    >
      <div className="content-page-inner">
        {children}
        {!isDetail && <div className="hud-scan" aria-hidden="true" />}
        <div className="hud-frame" aria-hidden="true" />
      </div>
    </div>
  )
}
