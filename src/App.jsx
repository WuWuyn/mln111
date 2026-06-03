import { lazy, startTransition, Suspense, useCallback, useEffect, useState } from 'react'
import GenshinCursor from './components/GenshinCursor'
import HandPointer from './components/HandPointer'
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
          <SpaceExperience onBack={openLandingPage} handControlStore={handControlStore} />
        </Suspense>
      ) : (
        <LandingPage onExplore={openExplorePage} handControlStore={handControlStore} />
      )}

      {!onContentPage && <HandPointer store={handControlStore} />}
      <GenshinCursor />
    </main>
  )
}

export default App
