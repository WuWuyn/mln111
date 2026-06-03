import { useEffect, useRef } from 'react'

/**
 * The on-screen reticle that follows the hand cursor. It subscribes to the
 * hand-control store and mutates its own element imperatively, so it can track
 * the hand at 60fps without triggering any React re-render.
 */
export default function HandPointer({ store }) {
  const elementRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return undefined

    const apply = (control) => {
      if (!control.active) {
        element.style.opacity = '0'
        element.classList.remove('is-pinched')
        return
      }

      element.style.opacity = '1'
      element.style.left = `${control.x * 100}%`
      element.style.top = `${control.y * 100}%`
      element.classList.toggle('is-pinched', Boolean(control.pinched))
    }

    apply(store.get())
    return store.subscribe(apply)
  }, [store])

  return (
    <div
      ref={elementRef}
      className="hand-pointer-reticle"
      style={{ opacity: 0 }}
      aria-hidden="true"
    />
  )
}
