import { lazy, startTransition, Suspense, useCallback, useEffect, useState } from 'react'
import GenshinCursor from './components/GenshinCursor'
import HandPointer from './components/HandPointer'
import HandTrackingPanel from './components/HandTrackingPanel'
import LandingPage from './components/LandingPage'
import { createHandControlStore } from './hand/handControlStore'
import './App.css'

const SpaceExperience = lazy(() => import('./components/SpaceExperience'))
const EXPLORE_HASH = '#kham-pha'

function getPageFromLocation() {
  if (typeof window === 'undefined') return 'landing'
  return window.location.hash.startsWith(EXPLORE_HASH) ? 'explore' : 'landing'
}

function isContentSubPage() {
  if (typeof window === 'undefined') return false
  return Boolean(window.location.hash.split('/')[1])
}

function App() {
  const [currentPage, setCurrentPage] = useState(() => getPageFromLocation())
  const [handControlStore] = useState(createHandControlStore)
  // Separate channel: the 3D scene publishes the locked planet's on-screen
  // position here, so the reticle can latch onto an orbiting planet without the
  // hand-tracking loop (which owns handControlStore) fighting over the value.
  const [latchStore] = useState(createHandControlStore)
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
        <Suspense fallback={<div className="route-loading">Đang mở vũ trụ...</div>}>
          <SpaceExperience onBack={openLandingPage} handControlStore={handControlStore} latchStore={latchStore} />
        </Suspense>
      ) : (
        <LandingPage onExplore={openExplorePage} handControlStore={handControlStore} />
      )}

      {!onContentPage && <HandPointer store={handControlStore} latchStore={latchStore} />}
      {/* Kept mounted across content sub-pages so the camera/permission persists
          when a planet's experiment opens — only its on-screen UI is hidden. */}
      <HandTrackingPanel store={handControlStore} hideUI={onContentPage} />
      <GenshinCursor />
    </main>
  )
}

export default App
