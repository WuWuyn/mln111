import { useCallback, useEffect, useRef, useState } from 'react'

const MODEL_PATH = '/mediapipe/hand_landmarker.task'
const WASM_PATH = '/mediapipe/wasm'

const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function lerp(previous, next, amount) {
  return previous + (next - previous) * amount
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function angleBetween(a, b) {
  return Math.atan2(a.y - b.y, a.x - b.x)
}

function normalizeAngleDelta(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

function drawHand(canvas, landmarks) {
  const context = canvas.getContext('2d')

  context.clearRect(0, 0, canvas.width, canvas.height)

  if (!landmarks) return

  context.save()
  context.scale(-1, 1)
  context.translate(-canvas.width, 0)
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.strokeStyle = 'rgba(126, 220, 255, 0.88)'
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
    context.beginPath()
    context.fillStyle = index === 8 ? '#ffd27a' : 'rgba(255, 255, 255, 0.9)'
    context.arc(point.x * canvas.width, point.y * canvas.height, index === 8 ? 5 : 3, 0, Math.PI * 2)
    context.fill()
  })

  context.restore()
}

function mapAroundCenter(value, center, range) {
  return clamp(0.5 + (value - center) / range, 0, 1)
}

function createControlFromLandmarks(landmarks, previousControl, calibration) {
  const wrist = landmarks[0]
  const thumbTip = landmarks[4]
  const indexBase = landmarks[5]
  const indexTip = landmarks[8]
  const middleBase = landmarks[9]
  const pinkyBase = landmarks[17]

  const rawX = clamp(1 - indexTip.x, 0, 1)
  const rawY = clamp(indexTip.y, 0, 1)
  const palmCenterX = 1 - (indexBase.x + pinkyBase.x + wrist.x) / 3
  const palmCenterY = (indexBase.y + pinkyBase.y + wrist.y) / 3
  const palmWidth = distance(indexBase, pinkyBase)
  const palmDepth = distance(wrist, middleBase)
  const handOpen = distance(indexTip, thumbTip)
  const pinchDistance = distance(indexTip, thumbTip)
  const handScale = clamp((palmWidth + palmDepth + handOpen * 0.55 - 0.2) / 0.3, 0, 1)
  const rollRaw = angleBetween(indexBase, pinkyBase)

  const nextX = mapAroundCenter(rawX, calibration.cursorX, calibration.cursorRangeX)
  const nextY = mapAroundCenter(rawY, calibration.cursorY, calibration.cursorRangeY)
  const nextRotationX = clamp((palmCenterX - calibration.palmX) / 0.28, -1, 1)
  const nextRotationY = clamp((palmCenterY - calibration.palmY) / 0.24, -1, 1)
  const nextRoll = clamp(normalizeAngleDelta(rollRaw - calibration.roll) / 0.72, -1, 1)
  const nextZoom = clamp(0.5 + (handScale - calibration.zoom) * 3.6, 0, 1)

  const previous = previousControl?.active
    ? previousControl
    : {
        x: nextX,
        y: nextY,
        rotationX: 0,
        rotationY: 0,
        roll: 0,
        zoom: nextZoom,
      }

  return {
    active: true,
    rawX,
    rawY,
    palmX: palmCenterX,
    palmY: palmCenterY,
    handScale,
    rollRaw,
    pinched: pinchDistance < palmWidth * 0.74,
    x: lerp(previous.x, nextX, 0.82),
    y: lerp(previous.y, nextY, 0.82),
    rotationX: lerp(previous.rotationX, nextRotationX, 0.18),
    rotationY: lerp(previous.rotationY, nextRotationY, 0.18),
    roll: lerp(previous.roll, nextRoll, 0.2),
    zoom: lerp(previous.zoom, nextZoom, 0.18),
  }
}

export default function HandTrackingPanel({ store }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const landmarkerRef = useRef(null)
  const frameRef = useRef(null)
  const streamRef = useRef(null)
  const controlRef = useRef({ active: false })
  const statusRef = useRef('Tắt hand tracking')
  const calibrationRef = useRef({
    cursorX: 0.5,
    cursorY: 0.5,
    cursorRangeX: 0.62,
    cursorRangeY: 0.66,
    palmX: 0.5,
    palmY: 0.5,
    roll: 0,
    zoom: 0.5,
  })
  const lastRawControlRef = useRef(null)
  const [enabled, setEnabled] = useState(false)
  const [status, setStatus] = useState('Tắt hand tracking')

  // The detect loop runs every frame; only push status changes to React state
  // so we don't queue a redundant render ~60 times per second.
  const updateStatus = useCallback((next) => {
    if (statusRef.current === next) return
    statusRef.current = next
    setStatus(next)
  }, [])

  const calibrate = () => {
    if (!lastRawControlRef.current) {
      updateStatus('Chưa thấy bàn tay để căn chỉnh')
      return
    }

    calibrationRef.current = {
      ...calibrationRef.current,
      cursorX: lastRawControlRef.current.rawX,
      cursorY: lastRawControlRef.current.rawY,
      palmX: lastRawControlRef.current.palmX,
      palmY: lastRawControlRef.current.palmY,
      roll: lastRawControlRef.current.rollRaw,
      zoom: lastRawControlRef.current.handScale,
    }
    controlRef.current = { active: false }
    updateStatus('Đã căn chỉnh tâm tay')
  }

  useEffect(() => {
    if (!enabled) {
      controlRef.current = { active: false }
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
          minHandDetectionConfidence: 0.42,
          minHandPresenceConfidence: 0.42,
          minTrackingConfidence: 0.42,
        })

        if (cancelled) {
          landmarker.close()
          return
        }

        landmarkerRef.current = landmarker
        updateStatus('Đang xin quyền camera...')

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 960 },
            height: { ideal: 540 },
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
        updateStatus('Đưa bàn tay vào khung hình')

        const detect = () => {
          if (!videoRef.current || !canvasRef.current || !landmarkerRef.current) return

          const video = videoRef.current
          const canvas = canvasRef.current

          if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth
          if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight

          const result = landmarkerRef.current.detectForVideo(video, performance.now())
          const landmarks = result.landmarks?.[0]

          if (landmarks) {
            const control = createControlFromLandmarks(landmarks, controlRef.current, calibrationRef.current)

            controlRef.current = control
            lastRawControlRef.current = control
            drawHand(canvas, landmarks)
            store.set(control)
            updateStatus('Ngón trỏ chọn, bàn tay xoay, đưa gần/xa để zoom')
          } else {
            controlRef.current = { active: false }
            drawHand(canvas, null)
            store.set({ active: false })
            updateStatus('Đưa bàn tay vào khung hình')
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
  }, [enabled, store, updateStatus])

  return (
    <aside className={`hand-tracking-panel ${enabled ? 'is-enabled' : ''}`}>
      <div className="hand-tracking-preview">
        <video ref={videoRef} playsInline muted />
        <canvas ref={canvasRef} />
      </div>
      <div className="hand-tracking-copy">
        <p className="eyebrow">MediaPipe Hand Tracking</p>
        <p>{status}</p>
        <button type="button" onClick={() => setEnabled((current) => !current)}>
          {enabled ? 'Tắt camera' : 'Bật hand tracking'}
        </button>
        <button type="button" onClick={calibrate} disabled={!enabled}>
          Căn chỉnh
        </button>
      </div>
    </aside>
  )
}
