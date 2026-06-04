import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { planets } from '../data/cosmos'
import { challengeQuestions } from '../data/learning'
import BadgeResult from './overlays/BadgeResult'
import PlanetDetail from './overlays/PlanetDetail'
import InfoPanel from './space/InfoPanel'
import Scene from './space/Scene'
import WarpIntro from './space/intro/WarpIntro'
import './SpaceExperience.css'

// Cinematic mở màn chạy mỗi lần vào trang khám phá (tức mỗi lần bấm "Bắt đầu
// du hành", vì lúc đó SpaceExperience mount lại). Chỉ bỏ qua khi vào thẳng một
// trang con qua hash (deep link) để không chắn nội dung.
function initialIntro() {
  if (typeof window === 'undefined') return 'done'
  if (getViewFromHash()) return 'done'
  return 'playing'
}

const NAV_ITEMS = [
  { id: 'map', label: 'Khám phá' },
  { id: 'detail', label: 'Thực nghiệm' },
  { id: 'badge', label: 'Hồ sơ hành trình' },
]

// Thứ tự trang để "lướt tay" chuyển qua lại (trùng thứ tự thanh điều hướng).
const NAV_ORDER = ['map', 'detail', 'badge']
// TẠM TẮT cử chỉ "lướt bàn tay để chuyển trang": bật lại = đổi cờ này thành true.
// Khi tắt, toàn bộ logic + gợi ý liên quan đều bị bỏ qua nhưng code vẫn còn nguyên.
const SWIPE_NAV_ENABLED = false
// Ngưỡng nhận diện một cú lướt: tay (xòe bàn tay) phải quét ngang ít nhất chừng
// này theo trục X chuẩn hoá (0..1) trong khoảng thời gian ngắn này.
const SWIPE_DISTANCE = 0.3
const SWIPE_WINDOW_MS = 320
const SWIPE_MIN_MS = 70
const SWIPE_COOLDOWN_MS = 1100
// Để người chơi kịp thấy vụ nổ trước khi quiz hiện lên ("nổ rồi mới mở quiz").
const SHOT_QUIZ_DELAY_MS = 650
// Xác suất một câu hỏi đã xuất hiện được hỏi lại (thay vì rút câu mới) — 5%.
const QUESTION_REPEAT_CHANCE = 0.05

function BackIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M11 6 5 12l6 6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12h13" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function PanelIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M5 5.5h14v13H5z" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M8 9h8M8 12h8M8 15h5" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

// Cử chỉ tay dành riêng cho các trang trải nghiệm (khám phá / thực nghiệm / hồ sơ).
const EXPLORE_GUIDE_SEEN_KEY = 'vutru-explore-guide-seen'
const EXPLORE_GESTURES = [
  { icon: '☝️', title: 'Một ngón trỏ', text: 'Trỏ vào một hành tinh để chọn & giữ — con trỏ dính chặt vào nó cho tới khi bạn nắm tay.' },
  { icon: '✌️', title: 'Hai ngón', text: 'Khi đang giữ một hành tinh, giơ hai ngón để mở trang Thực nghiệm của nó.' },
  { icon: '🖐️', title: 'Xòe bàn tay', text: 'Di tay để xoay camera; vặn cổ tay như vặn nút âm lượng để phóng to / thu nhỏ.' },
  // Cử chỉ lướt chuyển trang chỉ hiện trong hướng dẫn khi tính năng đang bật.
  ...(SWIPE_NAV_ENABLED
    ? [{ icon: '👋', title: 'Lướt bàn tay', text: 'Xòe tay rồi lướt nhanh sang trái / phải để chuyển trang: Khám phá · Thực nghiệm · Hồ sơ.' }]
    : []),
  { icon: '✊', title: 'Nắm tay', text: 'Nắm tay để thả hành tinh đang giữ, rồi trỏ chọn hành tinh khác.' },
]

// Bảng hướng dẫn cử chỉ riêng cho phần trải nghiệm — tái dùng giao diện modal
// `.hand-guide` (định nghĩa trong App.css) nên không cần CSS mới.
function ExperienceGuide({ onClose }) {
  return (
    <div className="hand-guide" role="dialog" aria-modal="true" aria-labelledby="explore-guide-title">
      <div className="hand-guide-card">
        <p className="eyebrow">Cử chỉ tay khi khám phá</p>
        <h2 id="explore-guide-title">Điều khiển vũ trụ bằng tay</h2>
        <p className="hand-guide-lead">
          Bật nút <strong>“Điều khiển tay”</strong> ở góc màn hình rồi đưa một bàn tay vào khung camera.
          Giữ tay quanh giữa khung là điều khiển nhẹ nhất, sau đó dùng các cử chỉ dưới đây.
        </p>
        <ul className="hand-guide-list">
          {EXPLORE_GESTURES.map((item) => (
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
          Bắt đầu khám phá
        </button>
      </div>
    </div>
  )
}

const EXPLORE_BASE = '#kham-pha'
const VIEW_TO_SLUG = {
  detail: 'trai-nghiem',
  badge: 'huy-hieu',
}
const SLUG_TO_VIEW = {
  ...Object.fromEntries(Object.entries(VIEW_TO_SLUG).map(([view, slug]) => [slug, view])),
  'chi-tiet': 'detail',
  'doi-song': 'badge',
  'thu-thach': 'badge',
}

function getViewFromHash() {
  if (typeof window === 'undefined') return null
  const slug = window.location.hash.split('/')[1]
  return SLUG_TO_VIEW[slug] ?? null
}

function addUnique(list, id) {
  return list.includes(id) ? list : [...list, id]
}

function shuffleQuestionIndexes(lastQuestionIndex) {
  const indexes = challengeQuestions.map((_, index) => index)

  for (let i = indexes.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indexes[i], indexes[j]] = [indexes[j], indexes[i]]
  }

  if (indexes.length > 1 && indexes[0] === lastQuestionIndex) {
    ;[indexes[0], indexes[1]] = [indexes[1], indexes[0]]
  }

  return indexes
}

function ShotQuiz({ quiz, onAnswer, onClose }) {
  const [picked, setPicked] = useState(null)
  const question = challengeQuestions[quiz.questionIndex % challengeQuestions.length]
  const answered = picked !== null
  const isCorrect = answered && picked === question.answer

  const choose = (value) => {
    if (answered) return
    setPicked(value)
    onAnswer?.(value === question.answer)
  }

  return (
    <div className="asteroid-quiz" role="dialog" aria-modal="true" aria-labelledby="asteroid-quiz-title">
      <div className="asteroid-quiz-card">
        <header className="asteroid-quiz-head">
          <div>
            <p className="asteroid-quiz-kicker">{quiz.kicker}</p>
            <h2 id="asteroid-quiz-title">{quiz.title}</h2>
          </div>
          <button type="button" className="asteroid-quiz-close" onClick={onClose} aria-label="Đóng quiz">
            ×
          </button>
        </header>

        <p className="asteroid-quiz-prompt">{question.prompt}</p>
        <div className="asteroid-quiz-options">
          {question.options.map((option) => {
            const isAnswer = option.value === question.answer
            const isPicked = option.value === picked
            const cls = answered ? (isAnswer ? 'is-correct' : isPicked ? 'is-wrong' : 'is-muted') : ''

            return (
              <button
                key={option.value}
                type="button"
                className={`asteroid-quiz-option ${cls}`}
                onClick={() => choose(option.value)}
                disabled={answered}
              >
                <span>{option.value.toUpperCase()}</span>
                {option.label}
              </button>
            )
          })}
        </div>

        {answered && (
          <div className={`asteroid-quiz-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
            <strong>{isCorrect ? 'Chính xác' : 'Chưa đúng'}</strong>
            <p>{question.explain}</p>
            <button type="button" className="primary-action" onClick={onClose}>
              Tiếp tục bắn
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function runSceneTransition(update) {
  const canTransition =
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!canTransition) {
    update()
    return
  }

  document.startViewTransition(() => {
    flushSync(update)
  })
}

export default function SpaceExperience({ onBack, handControlStore, latchStore }) {
  const [selectedPlanet, setSelectedPlanet] = useState(planets[0])
  const [panelVisible, setPanelVisible] = useState(true)
  const [activeView, setActiveView] = useState(getViewFromHash)
  const [progress, setProgress] = useState({
    visited: [],
    passed: [],
    challengeScore: null,
    shotAnswered: 0,
    shotCorrect: 0,
  })
  const [gameMode, setGameMode] = useState(false)
  // Trong chế độ bắn: có hiện quiz sau khi nổ hay không (bắn + hỏi nhanh / bắn tự do).
  const [quizEnabled, setQuizEnabled] = useState(true)
  const quizEnabledRef = useRef(true)
  const [destroyed, setDestroyed] = useState([])
  const [shotQuiz, setShotQuiz] = useState(null)
  const [resetSignal, setResetSignal] = useState(0)
  const [intro, setIntro] = useState(initialIntro)
  const [swipeFlash, setSwipeFlash] = useState(null)
  const [showGuide, setShowGuide] = useState(false)
  const questionBag = useRef({ remaining: [], last: null, seen: [] })
  // Hẹn giờ mở quiz sau khi nổ — giữ lại để dọn khi khôi phục / tắt game / unmount.
  const quizTimers = useRef([])

  // Mở bảng hướng dẫn cử chỉ nếu phiên này chưa xem (gọi từ các điểm kết thúc
  // intro — đều là callback/timer nên không vướng luật "setState trong effect").
  const openGuideIfUnseen = useCallback(() => {
    let seen = false
    try {
      seen = window.sessionStorage.getItem(EXPLORE_GUIDE_SEEN_KEY) === '1'
    } catch {
      // sessionStorage bị chặn — coi như chưa xem, cứ hiện hướng dẫn.
    }
    if (!seen) setShowGuide(true)
  }, [])

  // Big Bang lóe lên -> bắt đầu cho hành tinh 3D mọc ra.
  const handleIntroReveal = useCallback(() => setIntro('forming'), [])

  // Intro kết thúc (hoặc bỏ qua): vào phần trải nghiệm và bật hướng dẫn lần đầu.
  const finishIntro = useCallback(() => {
    setIntro('done')
    openGuideIfUnseen()
  }, [openGuideIfUnseen])

  // Lưới an toàn: dù vòng lặp animation của intro có khựng hay lỗi giữa chừng,
  // sau ~7s vẫn buộc intro kết thúc để lớp phủ warp gỡ ra và lộ bản đồ + bảng
  // tri thức bên dưới (tránh trường hợp panel bị che vĩnh viễn).
  useEffect(() => {
    if (intro === 'done') return undefined
    const timer = setTimeout(() => {
      setIntro('done')
      openGuideIfUnseen()
    }, 7000)
    return () => clearTimeout(timer)
  }, [intro, openGuideIfUnseen])

  const introReady = intro === 'done'
  const formState = intro === 'done' ? 'shown' : intro === 'forming' ? 'forming' : 'hidden'

  const nextQuestionIndex = useCallback(() => {
    const bag = questionBag.current

    // 5% cơ hội gặp lại một câu đã từng xuất hiện (tránh lặp ngay câu vừa hỏi).
    if (bag.seen.length > 0 && Math.random() < QUESTION_REPEAT_CHANCE) {
      const pool = bag.seen.filter((idx) => idx !== bag.last)
      const choices = pool.length > 0 ? pool : bag.seen
      const repeat = choices[Math.floor(Math.random() * choices.length)]
      bag.last = repeat
      return repeat
    }

    if (bag.remaining.length === 0) {
      bag.remaining = shuffleQuestionIndexes(bag.last)
    }

    const next = bag.remaining.shift() ?? 0
    bag.last = next
    if (!bag.seen.includes(next)) bag.seen.push(next)
    return next
  }, [])

  // Khóa câu hỏi ngay lúc trúng đích, nhưng đợi vụ nổ chơi xong một nhịp rồi mới
  // bật quiz lên (vẫn dọn timer khi khôi phục / tắt game / rời trang).
  const scheduleShotQuiz = useCallback((payload) => {
    const timer = setTimeout(() => {
      setShotQuiz(payload)
      quizTimers.current = quizTimers.current.filter((t) => t !== timer)
    }, SHOT_QUIZ_DELAY_MS)
    quizTimers.current.push(timer)
  }, [])

  const clearQuizTimers = useCallback(() => {
    quizTimers.current.forEach(clearTimeout)
    quizTimers.current = []
  }, [])

  const destroyPlanet = useCallback((id) => {
    setDestroyed((prev) => (prev.includes(id) ? prev : [...prev, id]))
    if (!quizEnabledRef.current) return
    const planet = id === 'central' ? null : planets.find((item) => item.id === id)
    scheduleShotQuiz({
      key: `planet-${id}-${Date.now()}`,
      questionIndex: nextQuestionIndex(),
      kicker: planet ? `Hành tinh ${planet.name}` : 'Lõi trung tâm',
      title: 'Mục tiêu vỡ, quiz xuất hiện',
    })
  }, [nextQuestionIndex, scheduleShotQuiz])

  const resetGame = useCallback(() => {
    clearQuizTimers()
    setDestroyed([])
    setShotQuiz(null)
    setResetSignal((n) => n + 1)
  }, [clearQuizTimers])

  useEffect(() => {
    const sync = () => setActiveView(getViewFromHash())
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  // Bật/tắt chế độ bắn phá — khi tắt thì hủy quiz đang chờ + đóng quiz hiện có.
  const toggleGameMode = useCallback(() => {
    if (gameMode) {
      clearQuizTimers()
      setShotQuiz(null)
    }
    setGameMode((on) => !on)
  }, [gameMode, clearQuizTimers])

  // Chuyển giữa "bắn + hỏi nhanh" và "bắn phá tự do" (không hiện quiz). Tắt quiz
  // thì hủy luôn quiz đang chờ / đang mở. Đọc qua ref để destroyPlanet ổn định.
  const toggleQuiz = useCallback(() => {
    setQuizEnabled((on) => {
      const next = !on
      quizEnabledRef.current = next
      if (!next) {
        clearQuizTimers()
        setShotQuiz(null)
      }
      return next
    })
  }, [clearQuizTimers])

  // Dọn hẹn giờ còn sót khi rời trang.
  useEffect(() => () => clearQuizTimers(), [clearQuizTimers])

  const navigateView = useCallback((view) => {
    const hash = view ? `${EXPLORE_BASE}/${VIEW_TO_SLUG[view]}` : EXPLORE_BASE

    runSceneTransition(() => {
      if (window.location.hash !== hash) {
        window.location.hash = hash
      }
      setActiveView(view)
    })
  }, [])

  const selectPlanet = useCallback((planet) => {
    setSelectedPlanet(planet)
    setPanelVisible(true)
  }, [])

  const openExperience = useCallback(
    (planet) => {
      if (planet) setSelectedPlanet(planet)
      const target = planet ?? selectedPlanet
      setProgress((prev) => ({ ...prev, visited: addUnique(prev.visited, target.id) }))
      navigateView('detail')
    },
    [selectedPlanet, navigateView],
  )

  const handleNav = useCallback(
    (id) => {
      if (id === 'map') {
        navigateView(null)
        return
      }
      if (id === 'detail') {
        openExperience(selectedPlanet)
        return
      }
      navigateView(id)
    },
    [openExperience, selectedPlanet, navigateView],
  )

  // Chuyển trang tương đối: dir = +1 sang trang bên phải, -1 sang trái (kẹp ở
  // hai đầu, không vòng lại) — dùng cho cả lướt tay lẫn phím mũi tên.
  const shiftView = useCallback(
    (dir) => {
      const currentId = activeView ?? 'map'
      const index = NAV_ORDER.indexOf(currentId)
      const nextIndex = Math.min(NAV_ORDER.length - 1, Math.max(0, index + dir))
      if (nextIndex === index) return
      setSwipeFlash({ dir, key: Date.now() })
      handleNav(NAV_ORDER[nextIndex])
    },
    [activeView, handleNav],
  )

  // Giữ bản mới nhất của shiftView + điều kiện cho phép lướt trong ref, để vòng
  // đăng ký store bên dưới chỉ chạy một lần mà vẫn đọc được giá trị hiện tại.
  const shiftViewRef = useRef(shiftView)
  const canSwipeRef = useRef(false)
  useEffect(() => {
    shiftViewRef.current = shiftView
    canSwipeRef.current = SWIPE_NAV_ENABLED && introReady && !gameMode
  })

  // Phát hiện "lướt tay": khi xòe bàn tay (mode 'navigate') và quét ngang nhanh,
  // gom các mẫu rawX trong một cửa sổ ngắn; nếu dịch ngang đủ lớn thì chuyển
  // trang theo hướng quét (sang phải = trang kế, sang trái = trang trước).
  useEffect(() => {
    const swipe = { samples: [], cooldownUntil: 0 }

    const unsubscribe = handControlStore.subscribe((control) => {
      if (
        !canSwipeRef.current ||
        !control.active ||
        control.mode !== 'navigate' ||
        typeof control.rawX !== 'number'
      ) {
        swipe.samples.length = 0
        return
      }

      const now = performance.now()
      if (now < swipe.cooldownUntil) return

      swipe.samples.push({ t: now, x: control.rawX })
      const cutoff = now - SWIPE_WINDOW_MS
      while (swipe.samples.length && swipe.samples[0].t < cutoff) swipe.samples.shift()
      if (swipe.samples.length < 3) return

      const oldest = swipe.samples[0]
      const dx = control.rawX - oldest.x
      if (Math.abs(dx) >= SWIPE_DISTANCE && now - oldest.t >= SWIPE_MIN_MS) {
        swipe.cooldownUntil = now + SWIPE_COOLDOWN_MS
        swipe.samples.length = 0
        shiftViewRef.current(dx > 0 ? 1 : -1)
      }
    })

    return unsubscribe
  }, [handControlStore])

  // Tắt báo hiệu mũi tên sau một nhịp ngắn.
  useEffect(() => {
    if (!swipeFlash) return undefined
    const timer = setTimeout(() => setSwipeFlash(null), 650)
    return () => clearTimeout(timer)
  }, [swipeFlash])

  const dismissGuide = useCallback(() => {
    try {
      window.sessionStorage.setItem(EXPLORE_GUIDE_SEEN_KEY, '1')
      // Bảng hướng dẫn này đã bao trùm cử chỉ khám phá, nên đánh dấu luôn bảng
      // chung (bật khi mở camera) là đã xem để không hiện hai hướng dẫn liền nhau.
      window.localStorage.setItem('vutru-hand-guide-seen', '1')
    } catch {
      // Chế độ ẩn danh / storage tắt — không sao, lần sau hướng dẫn lại hiện.
    }
    setShowGuide(false)
  }, [])


  const markQuizPass = useCallback((planetId) => {
    setProgress((prev) => ({ ...prev, passed: addUnique(prev.passed, planetId) }))
  }, [])

  const recordShotQuiz = useCallback((correct) => {
    setProgress((prev) => {
      const shotAnswered = (prev.shotAnswered ?? 0) + 1
      const shotCorrect = (prev.shotCorrect ?? 0) + (correct ? 1 : 0)

      return {
        ...prev,
        shotAnswered,
        shotCorrect,
        challengeScore: Math.round((shotCorrect / shotAnswered) * 100),
      }
    })
  }, [])

  const handleAsteroidDestroy = useCallback((index) => {
    if (!quizEnabledRef.current) return
    scheduleShotQuiz({
      key: `asteroid-${index}-${Date.now()}`,
      questionIndex: nextQuestionIndex(),
      kicker: `Mảnh tri thức #${index + 1}`,
      title: 'Thiên thạch vỡ, quiz xuất hiện',
    })
  }, [nextQuestionIndex, scheduleShotQuiz])

  // Mọi view con (thực nghiệm + hồ sơ) giờ là trang riêng toàn màn hình: ẩn scene
  // 3D phía sau thay vì lồng trạm thực nghiệm thành popup nổi trên bản đồ.
  const fullPageViewOpen = Boolean(activeView)

  return (
    <section className="experience-page">
      {activeView === null && introReady && (
        <>
          {/* Chỉ còn một nút back nổi riêng ở góc trên-trái — không bọc thành
              thanh header để nhường trọn không gian cho bản đồ 3D. */}
          <div className="experience-topbar experience-topbar--bare">
            <button
              className="secondary-action icon-action"
              type="button"
              onClick={onBack}
              aria-label="Quay lại trang landing"
              title="Quay lại trang landing"
            >
              <BackIcon />
            </button>
          </div>

          <nav className="experience-nav" aria-label="Điều hướng vũ trụ">
            {NAV_ITEMS.map((item) => {
              const isActive = (item.id === 'map' && activeView === null) || item.id === activeView
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-pill ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleNav(item.id)}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>
        </>
      )}

      <div className="space-experience" hidden={fullPageViewOpen}>
        <Canvas
          camera={{ position: [0, 14, 23], fov: 48, near: 0.1, far: 120 }}
          dpr={[1, 1.5]}
          gl={{ powerPreference: 'high-performance' }}
          performance={{ min: 0.5 }}
          frameloop={fullPageViewOpen ? 'never' : 'always'}
        >
          <Suspense fallback={null}>
            <Scene
              selectedPlanet={selectedPlanet}
              setSelectedPlanet={selectPlanet}
              onOpenExperience={openExperience}
              handControlStore={handControlStore}
              latchStore={latchStore}
              overlayOpen={Boolean(activeView) || panelVisible}
              gameMode={gameMode}
              destroyed={destroyed}
              onDestroyPlanet={destroyPlanet}
              onDestroyAsteroid={handleAsteroidDestroy}
              resetKey={resetSignal}
              formState={formState}
              lockHand={Boolean(activeView)}
            />
          </Suspense>
        </Canvas>

        {introReady && (
          <>
        <div className="space-game-controls">
          <button
            type="button"
            className={`game-toggle ${gameMode ? 'is-active' : ''}`}
            onClick={toggleGameMode}
          >
            {gameMode ? 'Đang bắn phá' : 'Chế độ bắn phá'}
          </button>
          {gameMode && (
            <button
              type="button"
              className={`game-toggle ${quizEnabled ? 'is-active' : ''}`}
              onClick={toggleQuiz}
              aria-pressed={quizEnabled}
              title="Bật/tắt quiz sau khi bắn trúng"
            >
              {quizEnabled ? 'Bắn + Hỏi nhanh' : 'Bắn phá tự do'}
            </button>
          )}
          {gameMode && (
            <button type="button" className="game-reset" onClick={resetGame}>
              Khôi phục
            </button>
          )}
        </div>

        {gameMode && (
          <p className="game-hint">
            {quizEnabled
              ? 'Nhắm vào thiên thạch hoặc hành tinh rồi bấm để bắn. Mục tiêu vỡ sẽ mở quiz nhanh và cộng điểm hồ sơ.'
              : 'Bắn phá tự do — nhắm thiên thạch / hành tinh rồi bấm để phóng tên lửa. Không hiện quiz.'}
          </p>
        )}

        {gameMode && quizEnabled && (
          <div className="game-score-pill" aria-live="polite">
            <span>Điểm quiz</span>
            <strong>{progress.challengeScore ?? 0}%</strong>
          </div>
        )}

        {gameMode && shotQuiz && (
          <ShotQuiz
            key={shotQuiz.key}
            quiz={shotQuiz}
            onAnswer={recordShotQuiz}
            onClose={() => setShotQuiz(null)}
          />
        )}

        <div className="hud-bar">
          <div>
            <span>Drag</span> xoay camera
          </div>
          <div>
            <span>Scroll</span> zoom
          </div>
          <div>
            <span>Double click</span> thực nghiệm
          </div>
          <div>
            <span>Ngón trỏ</span> chọn &amp; giữ hành tinh
          </div>
          <div>
            <span>Hai ngón</span> mở thực nghiệm
          </div>
          <div>
            <span>Xòe tay</span> xoay · vặn cổ tay zoom
          </div>
          <div>
            <span>Nắm tay</span> thả hành tinh
          </div>
          {SWIPE_NAV_ENABLED && (
            <div>
              <span>Lướt bàn tay</span> chuyển trang
            </div>
          )}
        </div>
          </>
        )}

        {/* Bảng tri thức luôn hiển thị trên bản đồ (không phụ thuộc intro), để
            phần định nghĩa / chi tiết / khái niệm không bị mất sau màn mở đầu.
            Trong lúc intro chạy, lớp phủ warp toàn màn hình che panel này. */}
        {!gameMode && panelVisible && (
          <InfoPanel
            planet={selectedPlanet}
            onClose={() => setPanelVisible(false)}
          />
        )}
        {!gameMode && !panelVisible && (
          <button
            className="reopen-panel"
            type="button"
            onClick={() => setPanelVisible(true)}
            aria-label="Mở bảng tri thức"
            title="Mở bảng tri thức"
          >
            <PanelIcon />
          </button>
        )}
      </div>

      {intro !== 'done' && (
        <WarpIntro onReveal={handleIntroReveal} onDone={finishIntro} onSkip={finishIntro} />
      )}

      {activeView === 'detail' && (
        <PlanetDetail
          planet={selectedPlanet}
          onClose={() => navigateView(null)}
          onNavigate={openExperience}
          onQuizPass={markQuizPass}
          handControlStore={handControlStore}
        />
      )}
      {activeView === 'badge' && (
        <BadgeResult
          progress={progress}
          onClose={() => navigateView(null)}
          onReplay={() => navigateView(null)}
        />
      )}

      {swipeFlash && (
        <div
          key={swipeFlash.key}
          className={`swipe-flash ${swipeFlash.dir > 0 ? 'to-next' : 'to-prev'}`}
          aria-hidden="true"
        >
          {swipeFlash.dir > 0 ? '⟶' : '⟵'}
        </div>
      )}

      {showGuide && <ExperienceGuide onClose={dismissGuide} />}
    </section>
  )
}
