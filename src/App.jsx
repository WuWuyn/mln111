import { lazy, startTransition, Suspense, useCallback, useEffect, useState } from 'react'
import GenshinCursor from './components/GenshinCursor'
import HandPointer from './components/HandPointer'
import HandTrackingPanel from './components/HandTrackingPanel'
import LandingPage from './components/LandingPage'
import { createHandControlStore } from './hand/handControlStore'
import './App.css'

// The 3D experience pulls in Three.js + fiber + drei. Load it lazily so the
// landing page ships without that weight; it only arrives when the user travels.
const SpaceExperience = lazy(() => import('./components/SpaceExperience'))

const EXPLORE_HASH = '#kham-pha'

function getPageFromLocation() {
  if (typeof window === 'undefined') {
    return 'landing'
  }

  return window.location.hash === EXPLORE_HASH ? 'explore' : 'landing'
}

function App() {
  const [currentPage, setCurrentPage] = useState(() => getPageFromLocation())
  // The hand-control signal updates ~60fps; keep it out of React state so it
  // never re-renders the tree. The store itself is created once and is stable;
  // consumers read it imperatively via get()/subscribe().
  const [handControlStore] = useState(createHandControlStore)

  useEffect(() => {
    const syncPage = () => {
      startTransition(() => {
        setCurrentPage(getPageFromLocation())
      })
    }

    window.addEventListener('hashchange', syncPage)
    window.addEventListener('popstate', syncPage)

    return () => {
      window.removeEventListener('hashchange', syncPage)
      window.removeEventListener('popstate', syncPage)
    }
  }, [])

  const openExplorePage = useCallback(() => {
    if (window.location.hash !== EXPLORE_HASH) {
      window.location.hash = EXPLORE_HASH
    }

    startTransition(() => {
      setCurrentPage('explore')
    })
  }, [])

  const openLandingPage = useCallback(() => {
    const nextUrl = `${window.location.pathname}${window.location.search}`

    window.history.pushState(null, '', nextUrl)

    startTransition(() => {
      setCurrentPage('landing')
    })
  }, [])

  return (
    <main className={`cosmos ${currentPage === 'explore' ? 'cosmos--explore' : 'cosmos--landing'}`}>
      {currentPage === 'explore' ? (
        <Suspense fallback={<div className="route-loading">Đang mở vũ trụ…</div>}>
          <SpaceExperience onBack={openLandingPage} handControlStore={handControlStore} />
        </Suspense>
      ) : (
        <LandingPage onExplore={openExplorePage} handControlStore={handControlStore} />
      )}

      <HandPointer store={handControlStore} />
      <HandTrackingPanel store={handControlStore} />
      {/* Comet cursor only on the landing page: over the heavy 3D scene it would
          fight for the GPU and stutter, and the native cursor (compositor-driven,
          with grab/grabbing on the canvas) is perfectly smooth there. */}
      {currentPage !== 'explore' && <GenshinCursor />}
    </main>
  )
}

export default App
