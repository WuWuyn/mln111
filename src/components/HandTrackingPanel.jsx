import { useCallback, useEffect, useRef, useState } from 'react'
import { publicAsset } from '../utils/publicAsset'

const MODEL_PATH = publicAsset('mediapipe/hand_landmarker.task')
const WASM_PATH = publicAsset('mediapipe/wasm')

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
    x: makeOneEuro({ minCutoff: 1.5, beta: 0.5 }),
    y: makeOneEuro({ minCutoff: 1.5, beta: 0.5 }),
    rotationX: makeOneEuro({ minCutoff: 0.9, beta: 0.04 }),
    rotationY: makeOneEuro({ minCutoff: 0.9, beta: 0.04 }),
    zoom: makeOneEuro({ minCutoff: 1.2, beta: 0.05 }),
    // Lọc tỉ lệ pinch để dập gai 1-frame của MediaPipe ngay trước khi so ngưỡng —
    // beta cao để vẫn bắt/nhả nhạy, minCutoff vừa phải để bóp những lần "nhả" hụt.
    pinchRatio: makeOneEuro({ minCutoff: 2.5, beta: 0.6 }),
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

// "Duỗi hay cụp" tính bằng GÓC GẬP tại khớp PIP, dùng vector 3D (kèm trục z của
// MediaPipe) nên BẤT BIẾN với việc bàn tay nghiêng tới/xa camera — đây là điểm
// yếu lớn nhất của cách cũ (so khoảng cách tới cổ tay, đọc sai mỗi khi tay
// nghiêng, gây nhận nhầm cử chỉ). Trả về cos của góc khúc: ~1 là ngón thẳng,
// thấp/âm là ngón gập lại.
function vec3(a, b) {
  return { x: b.x - a.x, y: b.y - a.y, z: (b.z ?? 0) - (a.z ?? 0) }
}

function straightness(landmarks, mcp, pip, tip) {
  const a = vec3(landmarks[mcp], landmarks[pip])
  const b = vec3(landmarks[pip], landmarks[tip])
  const m = Math.hypot(a.x, a.y, a.z) * Math.hypot(b.x, b.y, b.z)
  return m < 1e-6 ? 1 : (a.x * b.x + a.y * b.y + a.z * b.z) / m
}

// Cos góc khúc cho cả 4 ngón (CHƯA quyết duỗi/cụp — để tầng hysteresis quyết).
function readStraightness(landmarks) {
  return {
    index: straightness(landmarks, 5, 6, 8),
    middle: straightness(landmarks, 9, 10, 12),
    ring: straightness(landmarks, 13, 14, 16),
    pinky: straightness(landmarks, 17, 18, 20),
  }
}

// Hysteresis từng ngón: phải VƯỢT ngưỡng ENTER mới tính "duỗi", và phải TỤT dưới
// EXIT mới quay lại "cụp". Khe hở giữa hai mốc dập rung boolean khi cos dao động
// quanh ngưỡng — đây là nguồn chính còn lại của nhận-nhầm-cử-chỉ ở ranh giới.
// Ngón áp út & út ngắn, nhiễu hơn nên đặt ngưỡng thấp hơn.
const FINGER_ENTER = { index: 0.62, middle: 0.62, ring: 0.55, pinky: 0.5 }
const FINGER_EXIT = { index: 0.42, middle: 0.42, ring: 0.38, pinky: 0.32 }

function resolveFingers(straight, runtime) {
  const state = runtime.fingerState
  for (const f of ['index', 'middle', 'ring', 'pinky']) {
    state[f] = state[f] ? straight[f] > FINGER_EXIT[f] : straight[f] > FINGER_ENTER[f]
  }
  return { ...state }
}

// Decide what the hand is doing purely from *which fingers are extended* — the
// single most robust signal MediaPipe gives us. No pinch/thumb contact (which is
// noisy at an angle or distance): each mode is a clear, countable finger pose.
//   idle     (fist, 0 fingers)            → release the locked planet / pause
//   point    (index only ☝️)              → select & lock a planet
//   confirm  (index + middle ✌️)          → open the locked planet's experiment
//   navigate (open palm, 3+ fingers 🖐️)  → move to orbit, twist wrist to zoom
// The thumb is deliberately ignored, so it doesn't matter whether it's tucked or
// out — that's what makes every pose easy to hold and easy to detect.
function readGesture(fingers) {
  const { index, middle, ring, pinky } = fingers
  const openCount = [index, middle, ring, pinky].filter(Boolean).length

  if (openCount === 0) return 'idle'
  if (index && middle && !ring && !pinky) return 'confirm'
  if (index && !middle && !ring && !pinky) return 'point'
  if (openCount >= 3) return 'navigate'
  return 'idle'
}

// Hand shape jitters frame-to-frame near a gesture boundary (a finger flickers
// "extended" for a single frame), which would make the mode snap around. We only
// *commit* a new gesture once it has held for a few consecutive frames; the
// current gesture wins ties.
const GESTURE_HOLD_FRAMES = 2

function stabilizeGesture(raw, runtime) {
  if (raw === runtime.stableGesture) {
    runtime.pendingGesture = raw
    runtime.pendingCount = 0
    return raw
  }

  if (raw === runtime.pendingGesture) {
    runtime.pendingCount += 1
  } else {
    runtime.pendingGesture = raw
    runtime.pendingCount = 1
  }

  if (runtime.pendingCount >= GESTURE_HOLD_FRAMES) {
    runtime.stableGesture = raw
    runtime.pendingCount = 0
  }

  return runtime.stableGesture
}

function readMetrics(landmarks) {
  const wrist = landmarks[0]
  const thumbTip = landmarks[4]
  const indexBase = landmarks[5]
  const indexDip = landmarks[7]
  const indexTip = landmarks[8]
  const middleBase = landmarks[9]
  const pinkyBase = landmarks[17]

  const palmWidth = distance(indexBase, pinkyBase)
  const palmDepth = distance(wrist, middleBase)
  const handOpen = distance(indexTip, thumbTip)
  const straight = readStraightness(landmarks)

  // Điểm trỏ = pha trộn đầu ngón (8) với khớp DIP (7). Đầu ngón trỏ là landmark
  // nhiễu nhất; lùi nhẹ về khớp giúp con trỏ đằm hơn rõ rệt (giảm jitter tại
  // nguồn) mà gần như không mất độ chính xác khi ngắm.
  const pointX = indexTip.x * 0.65 + indexDip.x * 0.35
  const pointY = indexTip.y * 0.65 + indexDip.y * 0.35

  return {
    rawX: clamp(1 - pointX, 0, 1),
    rawY: clamp(pointY, 0, 1),
    palmX: 1 - (indexBase.x + pinkyBase.x + wrist.x) / 3,
    palmY: (indexBase.y + pinkyBase.y + wrist.y) / 3,
    handScale: clamp((palmWidth + palmDepth + handOpen * 0.55 - 0.2) / 0.3, 0, 1),
    // Khoảng cách đầu ngón cái↔trỏ chuẩn hoá theo bề ngang lòng bàn tay — bất
    // biến với khoảng cách tới camera. Đây là tín hiệu "pinch" dùng cho các
    // widget thực nghiệm: chỉ dựa trên 2 landmark rõ nét nên rất ổn định, không
    // phải đoán "ngón duỗi hay cụp" như việc đếm ngón.
    pinchRatio: palmWidth > 1e-4 ? handOpen / palmWidth : 1,
    rollRaw: angleBetween(indexBase, pinkyBase),
    edge: edgeProximity(landmarks),
    // cos thô từng ngón; duỗi/cụp (kèm hysteresis) + cử chỉ quyết ở vòng lặp.
    straight,
  }
}

// Volume-knob zoom: how much wrist twist (in radians) it takes to sweep the full
// zoom range, plus a small deadzone so a steady open palm doesn't creep the zoom.
const ZOOM_ROLL_GAIN = 0.85
const ROLL_DEADZONE = 0.05

// Pinch (ngón cái chạm trỏ) dùng cho các widget thực nghiệm. Hysteresis: bấm khi
// tỉ lệ < ENGAGE, nhả khi > RELEASE — khoảng đệm để không nhấp nháy ở ranh giới.
const PINCH_ENGAGE = 0.5
const PINCH_RELEASE = 0.72
// Chống "nhả hụt": khi vừa chụm vừa di tay nhanh, MediaPipe hay báo nhả nhầm
// 1–2 frame. Bắt pinch vẫn tức thì, nhưng phải thấy điều kiện nhả giữ liên tiếp
// bấy nhiêu frame mới thực sự nhả — nên không rớt quả cầu giữa lúc đang kéo.
const PINCH_RELEASE_FRAMES = 4

// Smallest signed angle from b to a, handling the ±π wrap of atan2.
function angularDelta(a, b) {
  let d = a - b
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  return d
}

// Build the control object for one frame. Each axis is fed through its One Euro
// filter every frame (so the filters stay warm and continuous), but only the
// axis that belongs to the current gesture is *committed* — the rest hold their
// previous value. That's what fully decouples point / navigate.
function createControl(metrics, previous, calibration, filters, t, runtime) {
  const gesture = metrics.gesture
  const wasActive = Boolean(previous?.active)
  const prevZoom = wasActive ? previous.zoom : 0.5

  // Zoom rides the open-palm (navigate) pose: twisting the wrist like a volume
  // knob dollies the camera. Anchor the roll + zoom when navigation begins, so
  // it's a *relative* twist from wherever you started — no absolute calibration.
  if (gesture === 'navigate' && runtime.prevGesture !== 'navigate') {
    runtime.rollAnchor = metrics.rollRaw
    runtime.zoomAnchorValue = prevZoom
  }
  runtime.prevGesture = gesture

  const targetX = mapAroundCenter(metrics.rawX, calibration.cursorX, calibration.cursorRangeX, 0.015)
  const targetY = mapAroundCenter(metrics.rawY, calibration.cursorY, calibration.cursorRangeY, 0.015)
  const targetRotationX = clamp((metrics.palmX - calibration.palmX) / 0.26, -1, 1)
  const targetRotationY = clamp((metrics.palmY - calibration.palmY) / 0.22, -1, 1)
  let rollTwist = gesture === 'navigate' ? angularDelta(metrics.rollRaw, runtime.rollAnchor) : 0
  rollTwist = Math.sign(rollTwist) * Math.max(0, Math.abs(rollTwist) - ROLL_DEADZONE)
  const targetZoom = gesture === 'navigate'
    ? clamp(runtime.zoomAnchorValue + rollTwist * ZOOM_ROLL_GAIN, 0, 1)
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

  // Pinch với hysteresis + đệm thời gian (trạng thái giữ trong runtime). Độc lập
  // hoàn toàn với việc phân loại cử chỉ point/navigate ở trên. So ngưỡng trên tỉ
  // lệ đã lọc, và yêu cầu nhả phải giữ vài frame (xem PINCH_RELEASE_FRAMES) để
  // không nhả hụt khi vừa chụm vừa di tay.
  const fPinchRatio = filters.pinchRatio(metrics.pinchRatio, t)
  if (runtime.pinching) {
    if (fPinchRatio > PINCH_RELEASE) {
      runtime.pinchReleaseFrames += 1
      if (runtime.pinchReleaseFrames >= PINCH_RELEASE_FRAMES) runtime.pinching = false
    } else {
      runtime.pinchReleaseFrames = 0
    }
  } else {
    runtime.pinchReleaseFrames = 0
    if (fPinchRatio < PINCH_ENGAGE) runtime.pinching = true
  }

  // Con trỏ "tự do" cho widget: LUÔN cập nhật mỗi frame (không cần giữ pose),
  // nhưng ĐÓNG BĂNG khi đang pinch để cú bấm/kéo không làm con trỏ trượt đi.
  const cursorX = runtime.pinching && wasActive ? previous.cursorX ?? fx : fx
  const cursorY = runtime.pinching && wasActive ? previous.cursorY ?? fy : fy

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
    // Cursor moves only while pointing; otherwise it stays put so it can't drift
    // off the planet you just lined up.
    x: pointing ? fx : base.x,
    y: pointing ? fy : base.y,
    // Orbit + zoom both ride the open palm: hand motion rotates, wrist twist zooms.
    rotationX: navigating ? fRotX : base.rotationX,
    rotationY: navigating ? fRotY : base.rotationY,
    roll: 0,
    zoom: navigating ? fZoom : base.zoom,
    // ── Kênh riêng cho widget thực nghiệm (bản đồ 3D không dùng) ──
    cursorX,
    cursorY,
    pinch: runtime.pinching,
    pinchRatio: fPinchRatio,
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

// Debug overlay: draws the hand skeleton plus extended (green) / curled (red)
// fingertips and the detected gesture, so mis-recognised hand shapes are
// obvious at a glance. It is OFF by default and never shows the raw webcam feed
// — only the skeleton on a dark backdrop — so nothing identifying is on screen.
// Mirrored to match a selfie view.
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

  // Text is drawn un-mirrored so it stays readable. The per-finger flags show
  // exactly which fingers read as extended, so a mis-counted pose is obvious.
  const { index, middle, ring, pinky } = metrics.fingers
  context.fillStyle = '#ffffff'
  context.font = '600 13px system-ui, sans-serif'
  context.fillText(gesture.toUpperCase(), 8, 18)
  context.font = '500 11px system-ui, sans-serif'
  context.fillStyle = 'rgba(255,255,255,0.82)'
  context.fillText(`trỏ:${index ? '1' : '0'} giữa:${middle ? '1' : '0'} áp:${ring ? '1' : '0'} út:${pinky ? '1' : '0'}`, 8, 34)

  // Giá trị cos thô từng ngón — để canh FINGER_ENTER/FINGER_EXIT cho khớp tay bạn.
  if (metrics.straight) {
    const s = metrics.straight
    context.fillStyle = 'rgba(255,255,255,0.55)'
    context.fillText(`cos ${s.index.toFixed(2)} ${s.middle.toFixed(2)} ${s.ring.toFixed(2)} ${s.pinky.toFixed(2)}`, 8, 50)
  }
}

// Gợi ý trạng thái + bảng cử chỉ KHÁC NHAU theo ngữ cảnh: bản đồ vũ trụ điều
// khiển bằng đếm ngón (chọn/mở/xoay hành tinh); còn trong trang thực nghiệm thì
// thao tác bằng con trỏ + cú "bấm" (pinch/dwell), thêm lướt tay để đổi trạm.
const GESTURE_HINTS = {
  map: {
    point: '☝️ Một ngón — chọn & giữ hành tinh',
    navigate: '🖐️ Xòe tay — di để xoay, vặn cổ tay để zoom',
    confirm: '✌️ Hai ngón — mở thực nghiệm hành tinh',
    idle: '✊ Nắm tay — thả hành tinh đang giữ',
  },
  experiment: {
    point: '☝️ Một ngón — rê con trỏ · chụm ngón cái để bấm',
    navigate: '🖐️ Xòe tay — lướt ngang để đổi trạm',
    confirm: '✌️ Hai ngón — đang rảnh',
    idle: '✊ Nắm tay — tạm nghỉ',
  },
}

// Mỗi ngữ cảnh một bảng hướng dẫn riêng (eyebrow + tiêu đề + dẫn nhập + cử chỉ).
const GESTURE_GUIDES = {
  map: {
    eyebrow: 'Điều khiển bằng tay · Bản đồ',
    title: 'Cử chỉ du hành vũ trụ',
    lead: 'Đưa một bàn tay vào tầm camera. Lần đầu thấy tay, hệ thống tự lấy tâm — cứ giữ tay giữa khung là điều khiển nhẹ nhất.',
    cta: 'Bắt đầu',
    items: [
      { icon: '☝️', title: 'Một ngón trỏ', text: 'Trỏ vào hành tinh để chọn — con trỏ dính chặt vào nó cho tới khi bạn nắm tay.' },
      { icon: '✌️', title: 'Hai ngón', text: 'Khi đã giữ được hành tinh, giơ hai ngón để mở phần thực nghiệm của nó.' },
      { icon: '🖐️', title: 'Xòe bàn tay', text: 'Di tay để xoay camera; vặn cổ tay như vặn nút âm lượng để phóng to / thu nhỏ.' },
      { icon: '✊', title: 'Nắm tay', text: 'Nắm tay để thả hành tinh đang giữ, rồi trỏ chọn hành tinh khác.' },
    ],
  },
  experiment: {
    eyebrow: 'Điều khiển bằng tay · Thực nghiệm',
    title: 'Cử chỉ trong trang thực nghiệm',
    lead: 'Trong một trạm thực nghiệm, bàn tay điều khiển bằng một con trỏ duy nhất — rê tới đâu, thao tác tới đó.',
    cta: 'Bắt đầu thực nghiệm',
    items: [
      { icon: '☝️', title: 'Một ngón trỏ', text: 'Con trỏ bám đầu ngón trỏ — rê tới nút hoặc chỗ cần thao tác.' },
      { icon: '🤏', title: 'Chụm ngón', text: 'Chạm ngón cái vào ngón trỏ = một cú “bấm” (như nhấp chuột). Chụm liên tục để gõ nhanh.' },
      { icon: '✋', title: 'Giữ con trỏ yên', text: 'Đứng yên con trỏ ~0,7 giây trên một nút là nó tự bấm — không cần chụm.' },
      { icon: '🖐️', title: 'Xòe tay lướt ngang', text: 'Xòe bàn tay rồi lướt nhanh sang trái / phải để chuyển sang trạm thực nghiệm trước / kế.' },
      { icon: '✊', title: 'Nắm tay', text: 'Tạm nghỉ — không thao tác gì.' },
    ],
  },
}

// Khoá "đã xem" tách theo ngữ cảnh: bản đồ giữ khoá cũ (đã được bảng hướng dẫn
// khám phá đánh dấu chung), trang thực nghiệm dùng khoá riêng.
const GUIDE_SEEN_KEYS = {
  map: 'vutru-hand-guide-seen',
  experiment: 'vutru-hand-experiment-guide-seen',
}

function CameraIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="18" height="18">
      <path d="M4 8.5h3l1.4-2h7.2L18 8.5h2a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.1" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

// One-time (and on-demand) cheat sheet of the control gestures, shown the first
// time the user turns hand control on in each context (map / experiment).
function GestureGuide({ context = 'map', onClose }) {
  const guide = GESTURE_GUIDES[context] ?? GESTURE_GUIDES.map
  return (
    <div className="hand-guide" role="dialog" aria-modal="true" aria-labelledby="hand-guide-title">
      <div className="hand-guide-card">
        <p className="eyebrow">{guide.eyebrow}</p>
        <h2 id="hand-guide-title">{guide.title}</h2>
        <p className="hand-guide-lead">{guide.lead}</p>
        <ul className="hand-guide-list">
          {guide.items.map((item) => (
            <li key={item.title}>
              <span className="hand-guide-icon" aria-hidden="true">{item.icon}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" className="hand-guide-done" onClick={onClose}>
          {guide.cta}
        </button>
      </div>
    </div>
  )
}

export default function HandTrackingPanel({ store, hideUI = false, context = 'map' }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const landmarkerRef = useRef(null)
  const frameRef = useRef(null)
  const streamRef = useRef(null)
  const controlRef = useRef({ active: false })
  const statusRef = useRef('')
  const filtersRef = useRef(null)
  // Carries the volume-knob zoom anchor and gesture-stabiliser state between frames.
  const runtimeRef = useRef({
    prevGesture: 'idle',
    rollAnchor: 0,
    zoomAnchorValue: 0.5,
    stableGesture: 'idle',
    pendingGesture: 'idle',
    pendingCount: 0,
    pinching: false,
    pinchReleaseFrames: 0,
    fingerState: { index: false, middle: false, ring: false, pinky: false },
  })
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
  const [status, setStatus] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

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

  // Bản mới nhất của ngữ cảnh cho vòng lặp nhận diện (chạy ngoài React) đọc.
  const contextRef = useRef(context)
  useEffect(() => {
    contextRef.current = context
  }, [context])

  const toggleEnabled = useCallback(() => {
    setEnabled((current) => !current)
  }, [])

  // Tự mở bảng hướng dẫn đúng ngữ cảnh khi bật camera, hoặc khi lần đầu bước
  // sang một ngữ cảnh mới (vd: từ bản đồ vào trang thực nghiệm) lúc đang bật.
  // Hẹn qua timer (không gọi setState đồng bộ trong effect) để khỏi dồn render.
  useEffect(() => {
    if (!enabled || hideUI) return undefined
    let seen = false
    try {
      seen = window.localStorage.getItem(GUIDE_SEEN_KEYS[context]) === '1'
    } catch {
      // Storage blocked — treat as "not seen" and show the guide.
    }
    if (seen) return undefined
    const timer = setTimeout(() => setShowGuide(true), 0)
    return () => clearTimeout(timer)
  }, [enabled, hideUI, context])

  const dismissGuide = useCallback(() => {
    try {
      window.localStorage.setItem(GUIDE_SEEN_KEYS[contextRef.current], '1')
    } catch {
      // Private mode / storage disabled — fine, the guide just shows again next time.
    }
    setShowGuide(false)
  }, [])

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

        // Frame skipping: a hand-less webcam still costs a full GPU inference per
        // frame. When no hand has been seen for a while we run the detector less
        // often (every 2nd, then every 3rd frame) to free the GPU/main thread,
        // and snap back to full rate the instant a hand returns.
        let tick = 0

        const detect = () => {
          if (!videoRef.current || !landmarkerRef.current) return

          const now = performance.now()
          const idleMs = now - lastSeenRef.current
          const stride = idleMs > 2500 ? 3 : idleMs > 700 ? 2 : 1
          tick = (tick + 1) % stride

          if (tick !== 0) {
            frameRef.current = requestAnimationFrame(detect)
            return
          }

          const video = videoRef.current
          const canvas = canvasRef.current

          if (canvas && canvas.width !== video.videoWidth) canvas.width = video.videoWidth
          if (canvas && canvas.height !== video.videoHeight) canvas.height = video.videoHeight

          const result = landmarkerRef.current.detectForVideo(video, now)
          const landmarks = result.landmarks?.[0]

          if (landmarks) {
            const metrics = readMetrics(landmarks)
            metrics.fingers = resolveFingers(metrics.straight, runtimeRef.current)
            metrics.gesture = stabilizeGesture(readGesture(metrics.fingers), runtimeRef.current)

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
            updateStatus(
              metrics.edge > 0.6
                ? 'Bàn tay sắp ra khỏi tầm — kéo về giữa'
                : (GESTURE_HINTS[contextRef.current] ?? GESTURE_HINTS.map)[metrics.gesture],
            )
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
    <>
      {/* The video feed is required for MediaPipe to read frames, but it is kept
          visually hidden — we never show the raw webcam. The optional skeleton
          preview below shows only landmarks on a dark backdrop. */}
      <video ref={videoRef} className="hand-cam-feed" playsInline muted aria-hidden="true" />

      {!hideUI && (
      <div className={`hand-control ${enabled ? 'is-enabled' : ''}`}>
        {enabled && showPreview && (
          <div className="hand-control-preview">
            <canvas ref={canvasRef} />
          </div>
        )}

        {enabled && status && <p className="hand-control-status">{status}</p>}

        <div className="hand-control-actions">
          <button
            type="button"
            className="hand-control-toggle"
            onClick={toggleEnabled}
            aria-pressed={enabled}
          >
            <CameraIcon />
            {enabled ? 'Tắt tay' : 'Điều khiển tay'}
          </button>

          {enabled && (
            <div className="hand-control-tools">
              <button type="button" className="hand-control-mini" onClick={recalibrate} title="Đặt lại tâm tay">
                ⊕
              </button>
              <button
                type="button"
                className={`hand-control-mini ${showPreview ? 'is-on' : ''}`}
                onClick={() => setShowPreview((on) => !on)}
                title="Hiện/ẩn khung xương tay"
                aria-pressed={showPreview}
              >
                ▣
              </button>
              <button
                type="button"
                className="hand-control-mini"
                onClick={() => setShowGuide(true)}
                title="Hướng dẫn cử chỉ"
              >
                ?
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {!hideUI && showGuide && <GestureGuide context={context} onClose={dismissGuide} />}
    </>
  )
}
