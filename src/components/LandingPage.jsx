import { useCallback, useEffect, useRef, useState } from 'react'

const introItems = [
  {
    index: '01',
    title: 'Triết học là gì?',
  },
  {
    index: '02',
    title: 'Vì sao triết học giúp con người nhận thức thế giới?',
  },
  {
    index: '03',
    title: 'Web này giúp học triết bằng cách trực quan hóa.',
  },
]

export default function LandingPage({ onExplore, handControlStore }) {
  const sectionRef = useRef(null)
  const buttonRef = useRef(null)
  const clickedByHandRef = useRef(false)

  // Mirror low-frequency UI state in refs so the per-frame hand subscription can
  // compare against the latest value without re-subscribing or reading stale
  // closures, and only call setState when something actually changes.
  const handActiveRef = useRef(false)
  const hoverRef = useRef(false)
  const pressedRef = useRef(false)

  const [handActive, setHandActive] = useState(false)
  const [handHovering, setHandHovering] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [burstKey, setBurstKey] = useState(0)

  const setPressedSafe = useCallback((next) => {
    if (pressedRef.current === next) return
    pressedRef.current = next
    setPressed(next)
  }, [])

  const setPointer = useCallback((x, y) => {
    const section = sectionRef.current
    if (!section) return
    section.style.setProperty('--pointer-x', `${x}%`)
    section.style.setProperty('--pointer-y', `${y}%`)
  }, [])

  const handleExplore = useCallback(() => {
    setBurstKey((key) => key + 1)
    window.setTimeout(onExplore, 420)
  }, [onExplore])

  const handlePointerMove = (event) => {
    if (handActiveRef.current) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    setPointer(x, y)
  }

  useEffect(() => {
    setPointer(50, 50)

    const apply = (control) => {
      if (!control.active) {
        if (handActiveRef.current) {
          handActiveRef.current = false
          setHandActive(false)
        }
        if (hoverRef.current) {
          hoverRef.current = false
          setHandHovering(false)
        }
        clickedByHandRef.current = false
        setPressedSafe(false)
        return
      }

      if (!handActiveRef.current) {
        handActiveRef.current = true
        setHandActive(true)
      }

      setPointer(control.x * 100, control.y * 100)

      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const cursorX = control.x * window.innerWidth
      const cursorY = control.y * window.innerHeight
      const isInside =
        cursorX >= rect.left && cursorX <= rect.right && cursorY >= rect.top && cursorY <= rect.bottom

      if (hoverRef.current !== isInside) {
        hoverRef.current = isInside
        setHandHovering(isInside)
      }

      if (!control.pinched) {
        clickedByHandRef.current = false
        setPressedSafe(false)
        return
      }

      setPressedSafe(isInside)

      if (isInside && !clickedByHandRef.current) {
        clickedByHandRef.current = true
        handleExplore()
      }
    }

    apply(handControlStore.get())
    return handControlStore.subscribe(apply)
  }, [handControlStore, handleExplore, setPointer, setPressedSafe])

  return (
    <section
      ref={sectionRef}
      className={`landing-page landing-page--minimal ${pressed ? 'is-pressed' : ''} ${
        handActive ? 'is-hand-active' : ''
      }`}
      aria-labelledby="landing-title"
      onPointerMove={handlePointerMove}
      onPointerDown={() => setPressedSafe(true)}
      onPointerUp={() => setPressedSafe(false)}
      onPointerCancel={() => setPressedSafe(false)}
      onPointerLeave={() => {
        if (!handActiveRef.current) setPressedSafe(false)
      }}
    >
      <div className="landing-wallpaper" aria-hidden="true" />
      {burstKey > 0 && <div key={burstKey} className="landing-click-burst" aria-hidden="true" />}
      <div className="landing-ambient landing-ambient--one" aria-hidden="true" />
      <div className="landing-ambient landing-ambient--two" aria-hidden="true" />
      <div className="landing-stars" aria-hidden="true" />

      <div className="landing-explore-only">
        <div className="landing-type-lockup">
          <span className="landing-overline">Marxist Philosophy Atlas</span>
          <h1 className="landing-slogan" id="landing-title">
            Từ những khái niệm trừu tượng,
            <span> mở ra cách nhìn mới về thế giới.</span>
          </h1>
        </div>

        <div className="landing-side-panel">
          <div className="landing-short-content" aria-label="Nội dung ngắn">
            {introItems.map((item) => (
              <article key={item.index}>
                <span>{item.index}</span>
                <p>{item.title}</p>
              </article>
            ))}
          </div>

          <button
            ref={buttonRef}
            className={`primary-action ${handHovering ? 'is-hand-target' : ''}`}
            type="button"
            onClick={handleExplore}
          >
            Bắt đầu du hành
          </button>
        </div>
      </div>
    </section>
  )
}
