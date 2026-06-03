import { startTransition, useCallback, useEffect, useState } from 'react'
import HandTrackingPanel from './components/HandTrackingPanel'
import LandingPage from './components/LandingPage'
import SpaceExperience from './components/SpaceExperience'
import './App.css'

const EXPLORE_HASH = '#kham-pha'

function getPageFromLocation() {
  if (typeof window === 'undefined') {
    return 'landing'
  }

  return window.location.hash === EXPLORE_HASH ? 'explore' : 'landing'
}

function App() {
  const [currentPage, setCurrentPage] = useState(() => getPageFromLocation())
  const [handControl, setHandControl] = useState({ active: false })

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

  const updateHandControl = useCallback((control) => {
    setHandControl(control)
  }, [])

  return (
    <main className={`cosmos ${currentPage === 'explore' ? 'cosmos--explore' : 'cosmos--landing'}`}>
      {currentPage === 'explore' ? (
        <SpaceExperience onBack={openLandingPage} handControl={handControl} />
      ) : (
        <LandingPage onExplore={openExplorePage} handControl={handControl} />
      )}

      {handControl.active && (
        <div
          className={`hand-pointer-reticle ${handControl.pinched ? 'is-pinched' : ''}`}
          style={{
            left: `${handControl.x * 100}%`,
            top: `${handControl.y * 100}%`,
          }}
          aria-hidden="true"
        />
      )}

      <HandTrackingPanel onHandControl={updateHandControl} />
    </main>
  )
}

export default App
