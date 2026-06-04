import { useEffect, useRef } from 'react'

const INACTIVE = { active: false }

/**
 * The on-screen reticle that follows the hand cursor, plus a screen-edge glow
 * that warns when the hand is drifting out of the camera's view. Both subscribe
 * to the hand-control store and mutate their elements imperatively, so they
 * track the hand at 60fps without triggering any React re-render.
 *
 * The reticle reads two channels:
 *  - `store`      — the raw hand cursor (free movement + edge warning).
 *  - `latchStore` — the 3D scene's "locked planet" screen position. When a
 *    planet is magnet-locked (you pointed at it), the reticle snaps onto it and
 *    rides along as it orbits, so it can't drift off while you make a fist to
 *    open its experiment.
 *
 * There is no camera preview anywhere on screen — the edge glow is what replaces
 * it: instead of watching a little video box, the user gets a peripheral cue
 * only when they actually need to recentre their hand.
 */
export default function HandPointer({ store, latchStore }) {
  const reticleRef = useRef(null)
  const edgeRef = useRef(null)

  useEffect(() => {
    const reticle = reticleRef.current
    const edge = edgeRef.current
    if (!reticle || !edge) return undefined

    let control = store.get()
    let latch = latchStore ? latchStore.get() : INACTIVE

    const render = () => {
      const handActive = control.active
      const fade = control.fade ?? 1

      // Glow harder the closer the hand gets to the frame edge; fade it with the
      // grace period so it doesn't linger after the hand is gone.
      edge.style.opacity = handActive ? String((control.edge ?? 0) * fade) : '0'

      // Latched onto a planet: pin the reticle to it, full brightness.
      if (latch.active) {
        reticle.style.opacity = '1'
        reticle.style.left = `${latch.x * 100}%`
        reticle.style.top = `${latch.y * 100}%`
        reticle.classList.add('is-locked')
        reticle.classList.toggle('is-armed', Boolean(latch.armed))
        return
      }

      reticle.classList.remove('is-locked', 'is-armed')

      if (!handActive) {
        reticle.style.opacity = '0'
        return
      }

      // Bright while pointing (you're aiming at a planet), dimmed while the open
      // hand is steering the camera so it reads as "not selecting right now".
      const modeDim = control.mode === 'point' ? 1 : 0.28
      reticle.style.opacity = String(fade * modeDim)
      reticle.style.left = `${control.x * 100}%`
      reticle.style.top = `${control.y * 100}%`
    }

    const onControl = (next) => {
      control = next
      render()
    }
    const onLatch = (next) => {
      latch = next
      render()
    }

    render()
    const unsubControl = store.subscribe(onControl)
    const unsubLatch = latchStore ? latchStore.subscribe(onLatch) : () => {}
    return () => {
      unsubControl()
      unsubLatch()
    }
  }, [store, latchStore])

  return (
    <>
      <div ref={edgeRef} className="hand-edge-warning" style={{ opacity: 0 }} aria-hidden="true" />
      <div ref={reticleRef} className="hand-pointer-reticle" style={{ opacity: 0 }} aria-hidden="true" />
    </>
  )
}
