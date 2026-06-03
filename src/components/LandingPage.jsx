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

export default function LandingPage({ onExplore, handControl }) {
  const buttonRef = useRef(null)
  const clickedByHandRef = useRef(false)
  const [pointer, setPointer] = useState({ x: 50, y: 50 })
  const [pressed, setPressed] = useState(false)
  const [handHovering, setHandHovering] = useState(false)
  const [burstKey, setBurstKey] = useState(0)

  const handleExplore = useCallback(() => {
    setBurstKey((key) => key + 1)
    window.setTimeout(onExplore, 420)
  }, [onExplore])

  const handlePointerMove = (event) => {
    if (handControl?.active) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    setPointer({ x, y })
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (!handControl?.active) {
        setHandHovering(false)
        clickedByHandRef.current = false
        return
      }

      setPointer({
        x: handControl.x * 100,
        y: handControl.y * 100,
      })

      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const cursorX = handControl.x * window.innerWidth
      const cursorY = handControl.y * window.innerHeight
      const isInside =
        cursorX >= rect.left && cursorX <= rect.right && cursorY >= rect.top && cursorY <= rect.bottom

      setHandHovering(isInside)

      if (!handControl.pinched) {
        clickedByHandRef.current = false
        setPressed(false)
        return
      }

      setPressed(isInside)

      if (isInside && !clickedByHandRef.current) {
        clickedByHandRef.current = true
        handleExplore()
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [handleExplore, handControl])

  return (
    <section
      className={`landing-page landing-page--minimal ${pressed ? 'is-pressed' : ''} ${
        handControl?.active ? 'is-hand-active' : ''
      }`}
      style={{
        '--pointer-x': `${pointer.x}%`,
        '--pointer-y': `${pointer.y}%`,
      }}
      aria-labelledby="landing-title"
      onPointerMove={handlePointerMove}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => {
        if (!handControl?.active) setPressed(false)
      }}
    >
      <div className="landing-wallpaper" aria-hidden="true" />
      <div className="landing-cursor-light" aria-hidden="true" />
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
