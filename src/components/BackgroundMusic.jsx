import { useEffect, useState } from 'react'
import { createBackgroundMusic } from '../audio/backgroundMusicStore'
import './BackgroundMusic.css'

function NoteIcon({ muted }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 17V6l10-2v9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6.5" cy="17" r="2.5" strokeWidth="1.8" />
      <circle cx="16.5" cy="15" r="2.5" strokeWidth="1.8" />
      {muted && <path d="M3 3l18 18" strokeWidth="2" strokeLinecap="round" />}
    </svg>
  )
}

// Nhạc nền toàn cục (Interstellar) + cài đặt bật/tắt và âm lượng. Store giữ ngoài
// React nên nhạc không bị ngắt khi điều hướng giữa landing và trang khám phá.
export default function BackgroundMusic({ hideUI = false }) {
  const [store] = useState(createBackgroundMusic)
  const [state, setState] = useState(store.get)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = store.subscribe(setState)
    store.start()
    return unsubscribe
  }, [store])

  // Ẩn giao diện ở trang con (detail/badge) để không đè nút đóng — nhưng component
  // vẫn mounted nên nhạc tiếp tục phát.
  if (hideUI) return null

  return (
    <div className={`bgm ${open ? 'is-open' : ''}`}>
      {open && (
        <div className="bgm-panel" role="dialog" aria-label="Cài đặt nhạc nền">
          <div className="bgm-panel-head">
            <span className="bgm-eyebrow">Nhạc nền</span>
            <button
              type="button"
              role="switch"
              aria-checked={state.enabled}
              className={`bgm-switch ${state.enabled ? 'is-on' : ''}`}
              onClick={() => store.setEnabled(!state.enabled)}
            >
              <span className="bgm-switch-knob" />
            </button>
          </div>

          <label className="bgm-volume">
            <span className="bgm-volume-label">
              Âm lượng <strong>{Math.round(state.volume * 100)}%</strong>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(state.volume * 100)}
              onChange={(event) => store.setVolume(Number(event.target.value) / 100)}
              disabled={!state.enabled}
              aria-label="Âm lượng nhạc nền"
            />
          </label>

          <p className="bgm-track">Interstellar — Hans Zimmer</p>
          {state.enabled && state.blocked && (
            <p className="bgm-hint">Bấm vào màn hình để bắt đầu phát.</p>
          )}
        </div>
      )}

      <button
        type="button"
        className={`bgm-toggle ${state.enabled ? 'is-on' : ''} ${state.playing ? 'is-playing' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-label="Cài đặt nhạc nền"
        title="Nhạc nền"
      >
        <NoteIcon muted={!state.enabled} />
      </button>
    </div>
  )
}
