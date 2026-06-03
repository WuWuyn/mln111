import { useCallback, useEffect, useRef, useState } from 'react'

const MODEL_PATH = '/mediapipe/hand_landmarker.task'
const WASM_PATH = '/mediapipe/wasm'

// How long we keep the last control alive after the hand briefly leaves the
// frame, so a one-frame detection drop doesn't kill the cursor. During this
// window the reticle fades out gradually instead of snapping off.
const GRACE_MS = 600

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function angleBetween(a, b) {
  return Math.atan2(a.y - b.y, a.x - b.x)
}

// ── One Euro Filter ────────────────────────────────────────────────────────
// Adaptive low-pass filter (Casiez et al. 2012) — the standard for smoothing
// noisy pointer/AR signals. When the hand is still it filters jitter hard; when
// the hand moves fast it lets the signal through so there's no lag. This is the
// single biggest win for "smoothness" over a fixed-alpha lerp.
function smoothingFactor(dt, cutoff) {
  const r = 2 * Math.PI * cutoff * dt
  return r / (r + 1)
}

function makeOneEuro({ minCutoff = 1, beta = 0, dCutoff = 1 } = {}) {
  let xPrev = null
  let dxPrev = 0
  let tPrev = null

  return (value, t) => {
    if (tPrev === null) {
      tPrev = t
      xPrev = value
      return value
    }

    const dt = Math.max(1e-3, t - tPrev)
    tPrev = t

    const dx = (value - xPrev) / dt
    const aD = smoothingFactor(dt, dCutoff)
    const edx = aD * dx + (1 - aD) * dxPrev
    dxPrev = edx

    const cutoff = minCutoff + beta * Math.abs(edx)
    const a = smoothingFactor(dt, cutoff)
    const filtered = a * value + (1 - a) * xPrev
    xPrev = filtered
    return filtered
  }
}

// Cursor wants to feel snappy (low lag) so points land where you expect;
// camera axes want to feel heavy and stable. Tune these to taste.
function makeFilters() {
  return {
    x: makeOneEuro({ minCutoff: 2.0, beta: 0.25 }),
    y: makeOneEuro({ minCutoff: 2.0, beta: 0.25 }),
    rotationX: makeOneEuro({ minCutoff: 0.9, beta: 0.04 }),
    rotationY: makeOneEuro({ minCutoff: 0.9, beta: 0.04 }),
    zoom: makeOneEuro({ minCutoff: 1.2, beta: 0.05 }),
  }
}

// Maps a value around a calibrated centre with a small deadzone (kills jitter
// when the hand is roughly still) and a tunable range. A *small* range means
// *high gain*: the hand only has to move within the central part of the camera
// frame to sweep the whole screen, so it never has to reach the frame edge
// where MediaPipe loses tracking.
function mapAroundCenter(value, center, range, deadzone) {
  const offset = value - center
  const sign = Math.sign(offset)
  const magnitude = Math.max(0, Math.abs(offset) - deadzone)
  return clamp(0.5 + (sign * magnitude) / range, 0, 1)
}

function edgeProximity(landmarks) {
  let minMargin = 0.5

  for (const index of [0, 4, 8, 12, 17]) {
    const point = landmarks[index]
    minMargin = Math.min(minMargin, point.x, 1 - point.x, point.y, 1 - point.y)
  }

  return clamp(1 - minMargin / 0.14, 0, 1)
}

// A finger is "extended" when its tip reaches farther from the wrist than its
// middle (PIP) joint does. Cheap, orientation-independent, no extra model.
function isFingerExtended(landmarks, tip, pip) {
  const wrist = landmarks[0]
  return distance(landmarks[tip], wrist) > distance(landmarks[pip], wrist) * 1.05
}

function readFingers(landmarks) {
  return {
    index: isFingerExtended(landmarks, 8, 6),
    middle: isFingerExtended(landmarks, 12, 10),
    ring: isFingerExtended(landmarks, 16, 14),
    pinky: isFingerExtended(landmarks, 20, 18),
  }
}

// Decide what the hand is doing from its shape, so the control axes never fight
// each other. Each gesture drives exactly one thing:
//   point    (index only)            → move the selection cursor
//   navigate (open palm)             → rotate the camera
//   zoom     (thumb+index pinch)     → zoom the camera
//   idle     (fist / anything else)  → pause
//
// Pinch vs. fist is the tricky part: both bring the thumb near the fingers.
// The tell is the index finger — in a pinch it reaches OUT to the thumb (tip
// stays far from its own base), in a fist it curls IN toward the palm (tip
// collapses onto its base). `indexReach` captures exactly that.
function readGesture(fingers, pinchRatio, indexReach) {
  const openCount = [fingers.index, fingers.middle, fingers.ring, fingers.pinky].filter(Boolean).length

  if (pinchRatio < 0.5 && indexReach > 0.55) return 'zoom'
  if (openCount >= 3) return 'navigate'
  if (fingers.index && !fingers.middle && !fingers.ring) return 'point'
  return 'idle'
}

function readMetrics(landmarks) {
  const wrist = landmarks[0]
  const thumbTip = landmarks[4]
  const indexBase = landmarks[5]
  const indexTip = landmarks[8]
  const middleBase = landmarks[9]
  const pinkyBase = landmarks[17]

  const palmWidth = distance(indexBase, pinkyBase)
  const palmDepth = distance(wrist, middleBase)
  const handOpen = distance(indexTip, thumbTip)
  const pinchDistance = distance(indexTip, thumbTip)
  const fingers = readFingers(landmarks)
  const safeWidth = Math.max(palmWidth, 1e-3)
  const pinchRatio = pinchDistance / safeWidth
  const indexReach = distance(indexTip, indexBase) / safeWidth

  return {
    rawX: clamp(1 - indexTip.x, 0, 1),
    rawY: clamp(indexTip.y, 0, 1),
    palmX: 1 - (indexBase.x + pinkyBase.x + wrist.x) / 3,
    palmY: (indexBase.y + pinkyBase.y + wrist.y) / 3,
    handScale: clamp((palmWidth + palmDepth + handOpen * 0.55 - 0.2) / 0.3, 0, 1),
    rollRaw: angleBetween(indexBase, pinkyBase),
    palmWidth,
    pinchDistance,
    pinchRatio,
    indexReach,
    edge: edgeProximity(landmarks),
    fingers,
    gesture: readGesture(fingers, pinchRatio, indexReach),
  }
}

// Zoom sensitivity for the pinch-and-scrub gesture: how much hand travel (in
// normalised screen height) it takes to sweep the full zoom range.
const ZOOM_GAIN = 2.6

// Build the control object for one frame. Each axis is fed through its One Euro
// filter every frame (so the filters stay warm and continuous), but only the
// axis that belongs to the current gesture is *committed* — the rest hold their
// previous value. That's what fully decouples point / rotate / zoom.
function createControl(metrics, previous, calibration, filters, t, runtime) {
  const gesture = metrics.gesture
  const wasActive = Boolean(previous?.active)
  const prevZoom = wasActive ? previous.zoom : 0.5

  // Pinch-to-zoom: when the pinch begins, anchor to the current hand height and
  // zoom level, so afterwards moving the hand up zooms in / down zooms out,
  // relative to where you grabbed — precise and free of webcam depth noise.
  if (gesture === 'zoom' && runtime.prevGesture !== 'zoom') {
    runtime.zoomAnchorY = metrics.palmY
    runtime.zoomAnchorValue = prevZoom
  }
  runtime.prevGesture = gesture

  const targetX = mapAroundCenter(metrics.rawX, calibration.cursorX, calibration.cursorRangeX, 0.015)
  const targetY = mapAroundCenter(metrics.rawY, calibration.cursorY, calibration.cursorRangeY, 0.015)
  const targetRotationX = clamp((metrics.palmX - calibration.palmX) / 0.26, -1, 1)
  const targetRotationY = clamp((metrics.palmY - calibration.palmY) / 0.22, -1, 1)
  const targetZoom = gesture === 'zoom'
    ? clamp(runtime.zoomAnchorValue + (runtime.zoomAnchorY - metrics.palmY) * ZOOM_GAIN, 0, 1)
    : prevZoom

  // Always run the filters so they never go stale between mode switches.
  const fx = filters.x(targetX, t)
  const fy = filters.y(targetY, t)
  const fRotX = filters.rotationX(targetRotationX, t)
  const fRotY = filters.rotationY(targetRotationY, t)
  const fZoom = filters.zoom(targetZoom, t)

  const base = wasActive ? previous : { x: fx, y: fy, rotationX: 0, rotationY: 0, zoom: fZoom }

  const pointing = gesture === 'point'
  const navigating = gesture === 'navigate'
  const zooming = gesture === 'zoom'

  return {
    active: true,
    fade: 1,
    mode: gesture,
    edge: metrics.edge,
    rawX: metrics.rawX,
    rawY: metrics.rawY,
    palmX: metrics.palmX,
    palmY: metrics.palmY,
    handScale: metrics.handScale,
    rollRaw: metrics.rollRaw,
    pinched: false,
    // Cursor moves only while pointing; otherwise it stays put so it can't drift
    // off the planet you just lined up.
    x: pointing ? fx : base.x,
    y: pointing ? fy : base.y,
    // Rotate only with an open palm.
    rotationX: navigating ? fRotX : base.rotationX,
    rotationY: navigating ? fRotY : base.rotationY,
    roll: 0,
    // Zoom only while pinching.
    zoom: zooming ? fZoom : base.zoom,
  }
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

// Maps a fingertip landmark to the finger it belongs to, so the debug overlay
// can colour each tip by whether that finger reads as extended.
const TIP_FINGER = { 8: 'index', 12: 'middle', 16: 'ring', 20: 'pinky' }

// Debug overlay: draws the skeleton plus extended (green) / curled (red)
// fingertips and the detected gesture, so mis-recognised hand shapes are
// obvious at a glance. Mirrored to match the flipped preview video.
function drawHand(canvas, metrics, landmarks, gesture) {
  const context = canvas.getContext('2d')
  context.clearRect(0, 0, canvas.width, canvas.height)

  if (!landmarks) return

  context.save()
  context.scale(-1, 1)
  context.translate(-canvas.width, 0)
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.strokeStyle = 'rgba(126, 220, 255, 0.85)'
  context.lineWidth = 3

  HAND_CONNECTIONS.forEach(([from, to]) => {
    const start = landmarks[from]
    const end = landmarks[to]
    context.beginPath()
    context.moveTo(start.x * canvas.width, start.y * canvas.height)
    context.lineTo(end.x * canvas.width, end.y * canvas.height)
    context.stroke()
  })

  landmarks.forEach((point, index) => {
    const finger = TIP_FINGER[index]
    let color = 'rgba(255, 255, 255, 0.9)'
    let radius = 3

    if (index === 4) color = '#ffd27a'
    if (finger) {
      color = metrics.fingers[finger] ? '#5dff9b' : '#ff6b6b'
      radius = 5
    }

    context.beginPath()
    context.fillStyle = color
    context.arc(point.x * canvas.width, point.y * canvas.height, radius, 0, Math.PI * 2)
    context.fill()
  })

  context.restore()

  // Text is drawn un-mirrored so it stays readable. The pinch/index numbers let
  // us see exactly why a pinch is (or isn't) recognised and tune the thresholds.
  context.fillStyle = '#ffffff'
  context.font = '600 13px system-ui, sans-serif'
  context.fillText(gesture.toUpperCase(), 8, 18)
  context.font = '500 11px system-ui, sans-serif'
  context.fillStyle = metrics.pinchRatio < 0.5 && metrics.indexReach > 0.55 ? '#5dff9b' : 'rgba(255,255,255,0.8)'
  context.fillText(`pinch ${metrics.pinchRatio.toFixed(2)} (<0.50)  idx ${metrics.indexReach.toFixed(2)} (>0.55)`, 8, 34)
}

const GESTURE_HINTS = {
  point: '☝️ Ngón trỏ — di để chọn hành tinh',
  navigate: '🖐️ Xòe tay — di để xoay camera',
  zoom: '🤏 Chụm ngón — kéo lên/xuống để zoom',
  idle: '✊ Nắm tay — tạm dừng điều khiển',
}

export default function HandTrackingPanel({ store }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const landmarkerRef = useRef(null)
  const frameRef = useRef(null)
  const streamRef = useRef(null)
  const controlRef = useRef({ active: false })
  const statusRef = useRef('Tắt hand tracking')
  const filtersRef = useRef(null)
  // Carries the pinch-to-zoom anchor between frames.
  const runtimeRef = useRef({ prevGesture: 'idle', zoomAnchorY: 0.5, zoomAnchorValue: 0.5 })
  // Tighter ranges than a 1:1 mapping → higher gain, so the hand stays near the
  // centre of the frame and never has to reach the edge to point anywhere.
  const calibrationRef = useRef({
    cursorX: 0.5,
    cursorY: 0.5,
    cursorRangeX: 0.36,
    cursorRangeY: 0.4,
    palmX: 0.5,
    palmY: 0.5,
    roll: 0,
    zoom: 0.5,
  })
  const lastMetricsRef = useRef(null)
  const lastSeenRef = useRef(0)
  const calibratedRef = useRef(false)
  const [enabled, setEnabled] = useState(false)
  const [status, setStatus] = useState('Tắt hand tracking')

  // The detect loop runs every frame; only push status changes to React state
  // so we don't queue a redundant render ~60 times per second.
  const updateStatus = useCallback((next) => {
    if (statusRef.current === next) return
    statusRef.current = next
    setStatus(next)
  }, [])

  const captureCalibration = useCallback((metrics) => {
    calibrationRef.current = {
      ...calibrationRef.current,
      cursorX: metrics.rawX,
      cursorY: metrics.rawY,
      palmX: metrics.palmX,
      palmY: metrics.palmY,
      roll: metrics.rollRaw,
      zoom: metrics.handScale,
    }
  }, [])

  const recalibrate = () => {
    if (!lastMetricsRef.current) {
      updateStatus('Chưa thấy bàn tay để căn chỉnh')
      return
    }

    captureCalibration(lastMetricsRef.current)
    controlRef.current = { active: false }
    filtersRef.current = makeFilters()
    updateStatus('Đã đặt lại tâm tay')
  }

  useEffect(() => {
    if (!enabled) {
      controlRef.current = { active: false }
      calibratedRef.current = false
      store.set({ active: false })
      return undefined
    }

    let cancelled = false

    const start = async () => {
      try {
        updateStatus('Đang tải MediaPipe...')

        const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH)
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_PATH,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })

        if (cancelled) {
          landmarker.close()
          return
        }

        landmarkerRef.current = landmarker
        filtersRef.current = makeFilters()
        updateStatus('Đang xin quyền camera...')

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 60 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        updateStatus('Đưa bàn tay vào tầm camera')

        const detect = () => {
          if (!videoRef.current || !landmarkerRef.current) return

          const video = videoRef.current
          const canvas = canvasRef.current
          const now = performance.now()

          if (canvas && canvas.width !== video.videoWidth) canvas.width = video.videoWidth
          if (canvas && canvas.height !== video.videoHeight) canvas.height = video.videoHeight

          const result = landmarkerRef.current.detectForVideo(video, now)
          const landmarks = result.landmarks?.[0]

          if (landmarks) {
            const metrics = readMetrics(landmarks)

            // Auto-centre on the first hand we see so the user doesn't have to
            // press a button before pointing.
            if (!calibratedRef.current) {
              captureCalibration(metrics)
              calibratedRef.current = true
            }

            const control = createControl(metrics, controlRef.current, calibrationRef.current, filtersRef.current, now / 1000, runtimeRef.current)

            controlRef.current = control
            lastMetricsRef.current = metrics
            lastSeenRef.current = now
            if (canvas) drawHand(canvas, metrics, landmarks, metrics.gesture)
            store.set(control)
            updateStatus(metrics.edge > 0.6 ? 'Bàn tay sắp ra khỏi tầm — kéo về giữa' : GESTURE_HINTS[metrics.gesture])
          } else if (controlRef.current.active && now - lastSeenRef.current < GRACE_MS) {
            // Hand vanished for a moment: hold the last position and fade the
            // cursor instead of cutting control dead.
            const fade = 1 - (now - lastSeenRef.current) / GRACE_MS
            controlRef.current = { ...controlRef.current, fade }
            store.set(controlRef.current)
            updateStatus('Đang giữ — đưa tay trở lại tầm camera')
          } else {
            controlRef.current = { active: false }
            if (canvas) drawHand(canvas, null, null, '')
            store.set({ active: false })
            updateStatus('Đưa bàn tay vào tầm camera')
          }

          frameRef.current = requestAnimationFrame(detect)
        }

        detect()
      } catch (error) {
        updateStatus(error instanceof Error ? error.message : 'Không thể bật hand tracking')
        setEnabled(false)
        store.set({ active: false })
      }
    }

    start()

    return () => {
      cancelled = true
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      landmarkerRef.current?.close()
      landmarkerRef.current = null
    }
  }, [enabled, store, updateStatus, captureCalibration])

  return (
    <aside className={`hand-tracking-panel ${enabled ? 'is-enabled' : ''}`}>
      {/* Debug preview: the mirrored camera feed with the detected skeleton and
          gesture drawn on top, so hand-shape mis-reads are easy to spot. */}
      <div className="hand-tracking-preview">
        <video ref={videoRef} playsInline muted aria-hidden="true" />
        <canvas ref={canvasRef} />
      </div>
      <div className="hand-tracking-copy">
        <p className="eyebrow">Điều khiển bằng tay</p>
        <p>{status}</p>
        <div className="hand-tracking-actions">
          <button type="button" onClick={() => setEnabled((current) => !current)}>
            {enabled ? 'Tắt camera' : 'Bật điều khiển tay'}
          </button>
          <button type="button" onClick={recalibrate} disabled={!enabled}>
            Đặt lại tâm
          </button>
        </div>
      </div>
    </aside>
  )
}
