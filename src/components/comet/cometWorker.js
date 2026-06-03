import { createComet } from './cometCore.js'

// Renders the comet on a worker thread via an OffscreenCanvas, so its animation
// is not blocked by the main thread's heavy 3D/bloom rendering.
let comet = null

self.onmessage = (event) => {
  const data = event.data

  switch (data.type) {
    case 'init':
      comet = createComet(data.canvas)
      comet.resize(data.width, data.height, data.dpr)
      comet.start()
      break
    case 'mouse':
      comet?.setMouse(data.x, data.y)
      break
    case 'resize':
      comet?.resize(data.width, data.height, data.dpr)
      break
    case 'visibility':
      comet?.setHidden(data.hidden)
      break
    default:
      break
  }
}
