import { publicAsset } from '../utils/publicAsset'

// Nhạc nền toàn cục (phát xuyên suốt landing -> explore, không restart khi đổi
// trang). Lưu lựa chọn bật/tắt + âm lượng vào localStorage. Vì trình duyệt chặn
// autoplay, lần phát đầu sẽ được "mở khoá" bằng cử chỉ người dùng đầu tiên.
const TRACK = publicAsset(
  `audio/${encodeURIComponent('Interstellar Main Theme - Extra Extended - Soundtrack by  Hans Zimmer.mp3')}`,
)
const STORAGE_KEY = 'vutru-bgm'
const DEFAULT_VOLUME = 0.45

function loadPrefs() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    if (raw && typeof raw === 'object') {
      return {
        enabled: raw.enabled !== false,
        volume:
          typeof raw.volume === 'number' ? Math.min(1, Math.max(0, raw.volume)) : DEFAULT_VOLUME,
      }
    }
  } catch {
    /* storage bị chặn -> dùng mặc định */
  }
  return { enabled: true, volume: DEFAULT_VOLUME }
}

export function createBackgroundMusic() {
  const prefs = loadPrefs()
  let state = { enabled: prefs.enabled, volume: prefs.volume, playing: false, blocked: false }
  const listeners = new Set()
  let audio = null
  let gestureBound = false

  const persist = () => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ enabled: state.enabled, volume: state.volume }),
      )
    } catch {
      /* bỏ qua nếu storage bị chặn */
    }
  }

  const emit = () => {
    for (const fn of listeners) fn(state)
  }
  const setState = (patch) => {
    state = { ...state, ...patch }
    emit()
  }

  const ensureAudio = () => {
    if (audio) return audio
    audio = new Audio(TRACK)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = state.volume
    return audio
  }

  const onGesture = () => {
    unbindGesture()
    tryPlay()
  }
  const bindGesture = () => {
    if (gestureBound) return
    gestureBound = true
    window.addEventListener('pointerdown', onGesture)
    window.addEventListener('keydown', onGesture)
    window.addEventListener('touchstart', onGesture)
  }
  function unbindGesture() {
    if (!gestureBound) return
    gestureBound = false
    window.removeEventListener('pointerdown', onGesture)
    window.removeEventListener('keydown', onGesture)
    window.removeEventListener('touchstart', onGesture)
  }

  function tryPlay() {
    if (!state.enabled) return
    const el = ensureAudio()
    el.volume = state.volume
    const p = el.play()
    if (p && typeof p.then === 'function') {
      p.then(() => setState({ playing: true, blocked: false })).catch(() => {
        // Autoplay bị chặn -> chờ cử chỉ đầu tiên để mở khoá.
        setState({ playing: false, blocked: true })
        bindGesture()
      })
    }
  }

  return {
    get: () => state,
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    // Gọi 1 lần khi app mount.
    start() {
      tryPlay()
    },
    setEnabled(on) {
      setState({ enabled: on })
      persist()
      if (on) {
        tryPlay()
      } else {
        if (audio) audio.pause()
        unbindGesture()
        setState({ playing: false, blocked: false })
      }
    },
    setVolume(value) {
      const volume = Math.min(1, Math.max(0, value))
      setState({ volume })
      if (audio) audio.volume = volume
      persist()
    },
  }
}
