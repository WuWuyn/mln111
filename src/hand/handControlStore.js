const INACTIVE = { active: false }

/**
 * A tiny dependency-free store for the live hand-tracking control signal.
 *
 * The hand tracker produces a new control object on every animation frame
 * (~60fps). Pushing that through React state would re-render the whole tree
 * 60 times per second. Instead, consumers that run their own loop (the R3F
 * `useFrame` rig, the DOM reticle) read the latest value imperatively via
 * `get()` or `subscribe()`, so React only re-renders on meaningful changes
 * (e.g. hand entering/leaving the frame), not on every frame.
 *
 * @typedef {Object} HandControl
 * @property {boolean} active
 * @property {number} [x] Normalised cursor X (0..1, left to right).
 * @property {number} [y] Normalised cursor Y (0..1, top to bottom).
 * @property {boolean} [pinched]
 * @property {number} [rotationX]
 * @property {number} [rotationY]
 * @property {number} [roll]
 * @property {number} [zoom]
 */

/**
 * @returns {{
 *   get: () => HandControl,
 *   set: (control: HandControl) => void,
 *   subscribe: (listener: (control: HandControl) => void) => () => void,
 * }}
 */
export function createHandControlStore() {
  let current = INACTIVE
  const listeners = new Set()

  return {
    get() {
      return current
    },
    set(control) {
      current = control || INACTIVE
      for (const listener of listeners) {
        listener(current)
      }
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
