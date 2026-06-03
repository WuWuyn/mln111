import { useEffect, useRef } from 'react'

/**
 * The on-screen reticle that follows the hand cursor, plus a screen-edge glow
 * that warns when the hand is drifting out of the camera's view. Both subscribe
 * to the hand-control store and mutate their elements imperatively, so they
 * track the hand at 60fps without triggering any React re-render.
 *
 * There is no camera preview anywhere on screen — the edge glow is what replaces
 * it: instead of watching a little video box, the user gets a peripheral cue
 * only when they actually need to recentre their hand.
 */
export default function HandPointer({ store }) {
  const reticleRef = useRef(null)
  const edgeRef = useRef(null)

  useEffect(() => {
    const reticle = reticleRef.current
    const edge = edgeRef.current
    if (!reticle || !edge) return undefined

    const apply = (control) => {
      if (!control.active) {
        reticle.style.opacity = '0'
        reticle.classList.remove('is-pinched')
        edge.style.opacity = '0'
        return
      }

      const fade = control.fade ?? 1
      // Bright while pointing (you're aiming at a planet), dimmed while the open
      // hand is steering the camera so it reads as "not selecting right now".
      const modeDim = control.mode === 'point' ? 1 : 0.28
      reticle.style.opacity = String(fade * modeDim)
      reticle.style.left = `${control.x * 100}%`
      reticle.style.top = `${control.y * 100}%`
      reticle.classList.toggle('is-pinched', Boolean(control.pinched))

      // Glow harder the closer the hand gets to the frame edge; fade it with
      // the grace period so it doesn't linger after the hand is gone.
      edge.style.opacity = String((control.edge ?? 0) * fade)
    }

    apply(store.get())
    return store.subscribe(apply)
  }, [store])

  return (
    <>
      <div ref={edgeRef} className="hand-edge-warning" style={{ opacity: 0 }} aria-hidden="true" />
      <div ref={reticleRef} className="hand-pointer-reticle" style={{ opacity: 0 }} aria-hidden="true" />
    </>
  )
}
