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

  // The explore page may carry a sub-view, e.g. #kham-pha/chi-tiet, so match the
  // base rather than the exact hash.
  return window.location.hash.startsWith(EXPLORE_HASH) ? 'explore' : 'landing'
}

// True when a standalone content page (chi-tiet/thu-thach/...) is open — those
// pages have no 3D scene, so the hand-tracking (computer vision) UI is hidden.
function isContentSubPage() {
  if (typeof window === 'undefined') return false
  return Boolean(window.location.hash.split('/')[1])
}

function App() {
  const [currentPage, setCurrentPage] = useState(() => getPageFromLocation())
  // The hand-control signal updates ~60fps; keep it out of React state so it
  // never re-renders the tree. The store itself is created once and is stable;
  // consumers read it imperatively via get()/subscribe().
  const [handControlStore] = useState(createHandControlStore)
  const [onContentPage, setOnContentPage] = useState(isContentSubPage)

  useEffect(() => {
    const syncPage = () => {
      startTransition(() => {
        setCurrentPage(getPageFromLocation())
        setOnContentPage(isContentSubPage())
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
      setOnContentPage(false)
    })
  }, [])

  const openLandingPage = useCallback(() => {
    const nextUrl = `${window.location.pathname}${window.location.search}`

    window.history.pushState(null, '', nextUrl)

    startTransition(() => {
      setCurrentPage('landing')
      setOnContentPage(false)
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

      {/* Hand-tracking (computer vision) UI is only useful where there's a 3D
          scene to steer — hide it on the standalone content pages. */}
      {!onContentPage && <HandPointer store={handControlStore} />}
      {!onContentPage && <HandTrackingPanel store={handControlStore} />}
      {/* Comet cursor on every page. It renders on a Web Worker (OffscreenCanvas)
          so the heavy 3D scene on the explore page can't stall its animation. */}
      <GenshinCursor />
    </main>
  )
}

export default App
