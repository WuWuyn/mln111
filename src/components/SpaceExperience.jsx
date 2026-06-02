import { Canvas } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import { planets } from '../data/cosmos'
import InfoPanel from './space/InfoPanel'
import LandingOverlay from './space/LandingOverlay'
import Scene from './space/Scene'

export default function SpaceExperience() {
  const [started, setStarted] = useState(false)
  const [selectedPlanet, setSelectedPlanet] = useState(planets[0])
  const [panelVisible, setPanelVisible] = useState(true)

  const selectPlanet = (planet) => {
    setSelectedPlanet(planet)
    setPanelVisible(true)
    setStarted(true)
  }

  return (
    <div className="space-experience">
      <Canvas camera={{ position: [0, 14, 23], fov: 48, near: 0.1, far: 120 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Scene selectedPlanet={selectedPlanet} setSelectedPlanet={selectPlanet} />
        </Suspense>
      </Canvas>

      <LandingOverlay started={started} onStart={() => setStarted(true)} />

      <div className="hud-bar">
        <div>
          <span>Drag</span> xoay camera
        </div>
        <div>
          <span>Scroll</span> zoom
        </div>
        <div>
          <span>Click</span> mở hành tinh
        </div>
      </div>

      {started && panelVisible && <InfoPanel planet={selectedPlanet} onClose={() => setPanelVisible(false)} />}
      {started && !panelVisible && (
        <button className="reopen-panel" type="button" onClick={() => setPanelVisible(true)}>
          Mở bảng tri thức
        </button>
      )}
    </div>
  )
}
