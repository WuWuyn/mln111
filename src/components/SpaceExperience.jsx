import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { planets } from '../data/cosmos'
import { challengeQuestions } from '../data/learning'
import BadgeResult from './overlays/BadgeResult'
import PlanetDetail from './overlays/PlanetDetail'
import InfoPanel from './space/InfoPanel'
import Scene from './space/Scene'
import './SpaceExperience.css'

const NAV_ITEMS = [
  { id: 'map', label: 'Khám phá' },
  { id: 'detail', label: 'Thực nghiệm' },
  { id: 'badge', label: 'Hồ sơ hành trình' },
]

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

export default function SpaceExperience({ onBack, handControlStore }) {
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
  const [destroyed, setDestroyed] = useState([])
  const [shotQuiz, setShotQuiz] = useState(null)
  const [resetSignal, setResetSignal] = useState(0)
  const questionBag = useRef({ remaining: [], last: null })

  const nextQuestionIndex = useCallback(() => {
    if (questionBag.current.remaining.length === 0) {
      questionBag.current.remaining = shuffleQuestionIndexes(questionBag.current.last)
    }

    const next = questionBag.current.remaining.shift() ?? 0
    questionBag.current.last = next
    return next
  }, [])

  const destroyPlanet = useCallback((id) => {
    setDestroyed((prev) => (prev.includes(id) ? prev : [...prev, id]))
    const planet = id === 'central' ? null : planets.find((item) => item.id === id)
    setShotQuiz({
      key: `planet-${id}-${Date.now()}`,
      questionIndex: nextQuestionIndex(),
      kicker: planet ? `Hành tinh ${planet.name}` : 'Lõi trung tâm',
      title: 'Mục tiêu vỡ, quiz xuất hiện',
    })
  }, [nextQuestionIndex])

  const resetGame = useCallback(() => {
    setDestroyed([])
    setShotQuiz(null)
    setResetSignal((n) => n + 1)
  }, [])

  useEffect(() => {
    const sync = () => setActiveView(getViewFromHash())
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

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
    setShotQuiz({
      key: `asteroid-${index}-${Date.now()}`,
      questionIndex: nextQuestionIndex(),
      kicker: `Mảnh tri thức #${index + 1}`,
      title: 'Thiên thạch vỡ, quiz xuất hiện',
    })
  }, [nextQuestionIndex])

  const detailOpen = activeView === 'detail'
  const fullPageViewOpen = Boolean(activeView) && !detailOpen

  return (
    <section className={`experience-page ${detailOpen ? 'has-3d-modal' : ''}`}>
      {activeView === null && (
        <>
          <div className="experience-topbar">
            <button
              className="secondary-action icon-action"
              type="button"
              onClick={onBack}
              aria-label="Quay lại trang landing"
              title="Quay lại trang landing"
            >
              <BackIcon />
            </button>
            <div className="experience-copy">
              <p className="eyebrow">Trang khám phá</p>
              <h1>Bản đồ tri thức 3D</h1>
            </div>
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

      <div className={`space-experience ${detailOpen ? 'is-detail-backdrop' : ''}`} hidden={fullPageViewOpen}>
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
              overlayOpen={Boolean(activeView) || panelVisible}
              gameMode={gameMode}
              destroyed={destroyed}
              onDestroyPlanet={destroyPlanet}
              onDestroyAsteroid={handleAsteroidDestroy}
              resetKey={resetSignal}
            />
          </Suspense>
        </Canvas>

        <div className="space-game-controls">
          <button
            type="button"
            className={`game-toggle ${gameMode ? 'is-active' : ''}`}
            onClick={() => setGameMode((on) => !on)}
          >
            {gameMode ? 'Đang bắn phá' : 'Chế độ bắn phá'}
          </button>
          {gameMode && (
            <button type="button" className="game-reset" onClick={resetGame}>
              Khôi phục
            </button>
          )}
        </div>

        {gameMode && (
          <p className="game-hint">
            Nhắm vào thiên thạch hoặc hành tinh rồi bấm để bắn. Mục tiêu vỡ sẽ mở quiz nhanh và cộng điểm hồ sơ.
          </p>
        )}

        {gameMode && (
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
            <span>Ngón trỏ</span> chọn hành tinh
          </div>
          <div>
            <span>Xòe tay</span> xoay camera
          </div>
          <div>
            <span>Chụm ngón</span> zoom
          </div>
        </div>

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

      {activeView === 'detail' && (
        <PlanetDetail
          planet={selectedPlanet}
          onClose={() => navigateView(null)}
          onNavigate={openExperience}
          onQuizPass={markQuizPass}
        />
      )}
      {activeView === 'badge' && (
        <BadgeResult
          progress={progress}
          onClose={() => navigateView(null)}
          onReplay={() => navigateView(null)}
        />
      )}
    </section>
  )
}
