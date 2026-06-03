import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useState } from 'react'
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

// Adds an id to an array only once — used to track which planets were explored
// and which mini-quizzes were passed, without duplicates.
function addUnique(list, id) {
  return list.includes(id) ? list : [...list, id]
}

export default function SpaceExperience({ onBack, handControlStore }) {
  const [selectedPlanet, setSelectedPlanet] = useState(planets[0])
  const [panelVisible, setPanelVisible] = useState(true)
  // null = just the 3D map; otherwise a 2D content overlay is open over it.
  const [activeView, setActiveView] = useState(null)
  const [progress, setProgress] = useState({ visited: [], passed: [], challengeScore: null })

  const selectPlanet = useCallback((planet) => {
    setSelectedPlanet(planet)
    setPanelVisible(true)
  }, [])

  const openDetail = useCallback((planet) => {
    if (planet) setSelectedPlanet(planet)
    const target = planet ?? selectedPlanet
    setProgress((prev) => ({ ...prev, visited: addUnique(prev.visited, target.id) }))
    setActiveView('detail')
  }, [selectedPlanet])

  const handleNav = useCallback(
    (id) => {
      if (id === 'map') {
        setActiveView(null)
        return
      }
      if (id === 'detail') {
        openDetail(selectedPlanet)
        return
      }
      setActiveView(id)
    },
    [openDetail, selectedPlanet],
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

      <div className="space-experience">
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
            <Scene selectedPlanet={selectedPlanet} setSelectedPlanet={selectPlanet} handControlStore={handControlStore} />
          </Suspense>
        </Canvas>

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

        {panelVisible && (
          <InfoPanel
            planet={selectedPlanet}
            onClose={() => setPanelVisible(false)}
            onOpenDetail={openDetail}
            visited={progress.visited.includes(selectedPlanet.id)}
          />
        )}
        {!panelVisible && (
          <button className="reopen-panel" type="button" onClick={() => setPanelVisible(true)}>
            Mở bảng tri thức
          </button>
        )}
      </div>

      {activeView === 'detail' && (
        <PlanetDetail
          planet={selectedPlanet}
          onClose={() => setActiveView(null)}
          onNavigate={openDetail}
          onQuizPass={markQuizPass}
        />
      )}
      {activeView === 'quiz' && (
        <QuizChallenge
          onClose={() => setActiveView(null)}
          onComplete={recordChallenge}
          onGoBadge={() => setActiveView('badge')}
        />
      )}
      {activeView === 'life' && <LifeApplication onClose={() => setActiveView(null)} />}
      {activeView === 'badge' && (
        <BadgeResult
          progress={progress}
          onClose={() => setActiveView(null)}
          onReplay={() => setActiveView(null)}
          onGoQuiz={() => setActiveView('quiz')}
        />
      )}
    </section>
  )
}
