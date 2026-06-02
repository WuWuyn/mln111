import { startTransition, useEffect, useState } from 'react'
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

  const openExplorePage = () => {
    if (window.location.hash !== EXPLORE_HASH) {
      window.location.hash = EXPLORE_HASH
    }

    startTransition(() => {
      setCurrentPage('explore')
    })
  }

  const openLandingPage = () => {
    const nextUrl = `${window.location.pathname}${window.location.search}`

    window.history.pushState(null, '', nextUrl)

    startTransition(() => {
      setCurrentPage('landing')
    })
  }

  return (
    <main className={`cosmos ${currentPage === 'explore' ? 'cosmos--explore' : 'cosmos--landing'}`}>
      {currentPage === 'explore' ? (
        <SpaceExperience onBack={openLandingPage} />
      ) : (
        <LandingPage onExplore={openExplorePage} />
      )}
    </main>
  )
}

export default App
