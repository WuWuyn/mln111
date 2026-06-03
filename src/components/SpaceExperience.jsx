import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { planets } from '../data/cosmos'
import BadgeResult from './overlays/BadgeResult'
import LifeApplication from './overlays/LifeApplication'
import PlanetDetail from './overlays/PlanetDetail'
import QuizChallenge from './overlays/QuizChallenge'
import InfoPanel from './space/InfoPanel'
import Scene from './space/Scene'
import './SpaceExperience.css'

const NAV_ITEMS = [
  { id: 'map', label: 'Khám phá' },
  { id: 'detail', label: 'Thực nghiệm' },
  { id: 'life', label: 'Vận dụng' },
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
  quiz: 'thu-thach',
  life: 'doi-song',
  badge: 'huy-hieu',
}
const SLUG_TO_VIEW = {
  ...Object.fromEntries(Object.entries(VIEW_TO_SLUG).map(([view, slug]) => [slug, view])),
  'chi-tiet': 'detail',
}

function getViewFromHash() {
  if (typeof window === 'undefined') return null
  const slug = window.location.hash.split('/')[1]
  return SLUG_TO_VIEW[slug] ?? null
}

function addUnique(list, id) {
  return list.includes(id) ? list : [...list, id]
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
  const [progress, setProgress] = useState({ visited: [], passed: [], challengeScore: null })
  const [gameMode, setGameMode] = useState(false)
  const [destroyed, setDestroyed] = useState([])
  const [resetSignal, setResetSignal] = useState(0)

  const destroyPlanet = useCallback((id) => {
    setDestroyed((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const resetGame = useCallback(() => {
    setDestroyed([])
    setResetSignal((n) => n + 1)
  }, [])

  const totalTargets = planets.length + 1

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

  const recordChallenge = useCallback((score) => {
    setProgress((prev) => ({
      ...prev,
      challengeScore: Math.max(prev.challengeScore ?? 0, score),
    }))
  }, [])

  return (
    <section className="experience-page">
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

      <div className="space-experience" hidden={Boolean(activeView)}>
        <Canvas
          camera={{ position: [0, 14, 23], fov: 48, near: 0.1, far: 120 }}
          dpr={[1, 1.5]}
          gl={{ powerPreference: 'high-performance' }}
          performance={{ min: 0.5 }}
          frameloop={activeView ? 'never' : 'always'}
        >
          <Suspense fallback={null}>
            <Scene
              selectedPlanet={selectedPlanet}
              setSelectedPlanet={selectPlanet}
              handControlStore={handControlStore}
              overlayOpen={Boolean(activeView)}
              gameMode={gameMode}
              destroyed={destroyed}
              onDestroyPlanet={destroyPlanet}
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
            <>
              <span className="game-score">
                Đã phá {destroyed.length}/{totalTargets}
              </span>
              <button type="button" className="game-reset" onClick={resetGame}>
                Khôi phục
              </button>
            </>
          )}
        </div>

        {gameMode && <p className="game-hint">Nhắm vào một hành tinh rồi bấm để bắn đá.</p>}

        <div className="hud-bar">
          <div>
            <span>Drag</span> xoay camera
          </div>
          <div>
            <span>Scroll</span> zoom
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
      {activeView === 'quiz' && (
        <QuizChallenge
          onClose={() => navigateView('life')}
          onComplete={recordChallenge}
          onGoBadge={() => navigateView('badge')}
        />
      )}
      {activeView === 'life' && (
        <LifeApplication
          progress={progress}
          onClose={() => navigateView(null)}
          onGoQuiz={() => navigateView('quiz')}
          onGoBadge={() => navigateView('badge')}
        />
      )}
      {activeView === 'badge' && (
        <BadgeResult
          progress={progress}
          onClose={() => navigateView('life')}
          onReplay={() => navigateView(null)}
          onGoQuiz={() => navigateView('quiz')}
        />
      )}
    </section>
  )
}
