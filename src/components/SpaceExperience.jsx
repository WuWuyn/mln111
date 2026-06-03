import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { planets } from '../data/cosmos'
import BadgeResult from './overlays/BadgeResult'
import LifeApplication from './overlays/LifeApplication'
import PlanetDetail from './overlays/PlanetDetail'
import QuizChallenge from './overlays/QuizChallenge'
import InfoPanel from './space/InfoPanel'
import Scene from './space/Scene'
import './SpaceExperience.css'

const NAV_ITEMS = [
  { id: 'map', label: 'Bản đồ', icon: '🪐' },
  { id: 'detail', label: 'Chi tiết', icon: '📖' },
  { id: 'quiz', label: 'Thử thách', icon: '🎯' },
  { id: 'life', label: 'Đời sống', icon: '🌍' },
  { id: 'badge', label: 'Huy hiệu', icon: '🏅' },
]

// Each 2D view gets its own URL so Back/Forward and shareable links work. The
// explore page lives at #kham-pha; a view appends a slug, e.g. #kham-pha/chi-tiet.
const EXPLORE_BASE = '#kham-pha'
const VIEW_TO_SLUG = {
  detail: 'chi-tiet',
  quiz: 'thu-thach',
  life: 'doi-song',
  badge: 'huy-hieu',
}
const SLUG_TO_VIEW = Object.fromEntries(
  Object.entries(VIEW_TO_SLUG).map(([view, slug]) => [slug, view]),
)

function getViewFromHash() {
  if (typeof window === 'undefined') return null
  const slug = window.location.hash.split('/')[1]
  return SLUG_TO_VIEW[slug] ?? null
}

// Adds an id to an array only once — used to track which planets were explored
// and which mini-quizzes were passed, without duplicates.
function addUnique(list, id) {
  return list.includes(id) ? list : [...list, id]
}

export default function SpaceExperience({ onBack, handControlStore }) {
  const [selectedPlanet, setSelectedPlanet] = useState(planets[0])
  const [panelVisible, setPanelVisible] = useState(true)
  // null = just the 3D map; otherwise a 2D content overlay is open over it.
  // Derived from the URL hash so Back/Forward and shared links land on the right view.
  const [activeView, setActiveView] = useState(getViewFromHash)
  const [progress, setProgress] = useState({ visited: [], passed: [], challengeScore: null })
  // Arcade "phá vỡ hành tinh" mode: shoot rocks at planets, they shatter.
  const [gameMode, setGameMode] = useState(false)
  const [destroyed, setDestroyed] = useState([])

  const destroyPlanet = useCallback((id) => {
    setDestroyed((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const resetGame = useCallback(() => setDestroyed([]), [])

  // Total targets = central planet + all orbiting planets.
  const totalTargets = planets.length + 1

  // Keep the open view in sync with the URL — covers browser Back/Forward and
  // someone pasting in a #kham-pha/chi-tiet link.
  useEffect(() => {
    const sync = () => setActiveView(getViewFromHash())
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  // Single entry point for changing the open view: push the matching hash (so a
  // history entry is created) and update state immediately so the UI is snappy.
  const navigateView = useCallback((view) => {
    const hash = view ? `${EXPLORE_BASE}/${VIEW_TO_SLUG[view]}` : EXPLORE_BASE
    if (window.location.hash !== hash) {
      window.location.hash = hash
    }
    setActiveView(view)
  }, [])

  const selectPlanet = useCallback((planet) => {
    setSelectedPlanet(planet)
    setPanelVisible(true)
  }, [])

  const openDetail = useCallback((planet) => {
    if (planet) setSelectedPlanet(planet)
    const target = planet ?? selectedPlanet
    setProgress((prev) => ({ ...prev, visited: addUnique(prev.visited, target.id) }))
    navigateView('detail')
  }, [selectedPlanet, navigateView])

  const handleNav = useCallback(
    (id) => {
      if (id === 'map') {
        navigateView(null)
        return
      }
      if (id === 'detail') {
        openDetail(selectedPlanet)
        return
      }
      navigateView(id)
    },
    [openDetail, selectedPlanet, navigateView],
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
      {/* Map-only chrome: the top bar and the section nav belong to the 3D map,
          not to the standalone content pages. */}
      {activeView === null && (
        <>
          <div className="experience-topbar">
            <button className="secondary-action" type="button" onClick={onBack}>
              Trang landing
            </button>
            <div className="experience-copy">
              <p className="eyebrow">Trang khám phá</p>
              <h1>Bản đồ tri thức 3D</h1>
            </div>
          </div>

          <nav className="experience-nav" aria-label="Điều hướng vũ trụ">
            {NAV_ITEMS.map((item) => {
              const isActive =
                (item.id === 'map' && activeView === null) ||
                item.id === activeView
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-pill ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleNav(item.id)}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </nav>
        </>
      )}

      {/* The 3D map stays mounted but hidden while a content page is open, so
          returning to it doesn't pay to rebuild the whole Three.js scene. */}
      <div className="space-experience" hidden={Boolean(activeView)}>
        <Canvas
          camera={{ position: [0, 14, 23], fov: 48, near: 0.1, far: 120 }}
          dpr={[1, 1.5]}
          gl={{ powerPreference: 'high-performance' }}
          performance={{ min: 0.5 }}
          // Park the render loop whenever a 2D overlay covers the scene — the
          // heavy Three.js + bloom pass shouldn't keep running behind the scrim.
          // This frees the main thread so overlay scrolling/interaction is smooth.
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
            />
          </Suspense>
        </Canvas>

        <div className="space-game-controls">
          <button
            type="button"
            className={`game-toggle ${gameMode ? 'is-active' : ''}`}
            onClick={() => setGameMode((on) => !on)}
          >
            {gameMode ? '🚀 Đang bắn phá' : '🎮 Chế độ bắn phá'}
          </button>
          {gameMode && (
            <>
              <span className="game-score">
                Đã phá {destroyed.length}/{totalTargets}
              </span>
              <button type="button" className="game-reset" onClick={resetGame} disabled={destroyed.length === 0}>
                ↺ Khôi phục
              </button>
            </>
          )}
        </div>

        {gameMode && (
          <p className="game-hint">Nhắm vào một hành tinh rồi bấm để bắn đá — hành tinh sẽ vỡ tan 💥</p>
        )}

        <div className="hud-bar">
          <div>
            <span>Drag</span> xoay camera
          </div>
          <div>
            <span>Scroll</span> zoom
          </div>
          <div>
            <span>☝️ Ngón trỏ</span> di để chọn hành tinh
          </div>
          <div>
            <span>🖐️ Xòe tay</span> di để xoay camera
          </div>
          <div>
            <span>🤏 Chụm ngón</span> kéo lên/xuống để zoom
          </div>
          <div>
            <span>✊ Nắm tay</span> tạm dừng
          </div>
        </div>

        {!gameMode && panelVisible && (
          <InfoPanel
            planet={selectedPlanet}
            onClose={() => setPanelVisible(false)}
            onOpenDetail={openDetail}
            visited={progress.visited.includes(selectedPlanet.id)}
          />
        )}
        {!gameMode && !panelVisible && (
          <button className="reopen-panel" type="button" onClick={() => setPanelVisible(true)}>
            Mở bảng tri thức
          </button>
        )}
      </div>

      {activeView === 'detail' && (
        <PlanetDetail
          planet={selectedPlanet}
          onClose={() => navigateView(null)}
          onNavigate={openDetail}
          onQuizPass={markQuizPass}
        />
      )}
      {activeView === 'quiz' && (
        <QuizChallenge
          onClose={() => navigateView(null)}
          onComplete={recordChallenge}
          onGoBadge={() => navigateView('badge')}
        />
      )}
      {activeView === 'life' && <LifeApplication onClose={() => navigateView(null)} />}
      {activeView === 'badge' && (
        <BadgeResult
          progress={progress}
          onClose={() => navigateView(null)}
          onReplay={() => navigateView(null)}
          onGoQuiz={() => navigateView('quiz')}
        />
      )}
    </section>
  )
}
