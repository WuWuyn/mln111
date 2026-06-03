import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useState } from 'react'
import { planets } from '../data/cosmos'
import InfoPanel from './space/InfoPanel'
import Scene from './space/Scene'

export default function SpaceExperience({ onBack, handControlStore }) {
  const [selectedPlanet, setSelectedPlanet] = useState(planets[0])
  const [panelVisible, setPanelVisible] = useState(true)

  const selectPlanet = useCallback((planet) => {
    setSelectedPlanet(planet)
    setPanelVisible(true)
  }, [])

  return (
    <section className="experience-page">
      <div className="experience-topbar">
        <button className="secondary-action" type="button" onClick={onBack}>
          Trang landing
        </button>
        <div className="experience-copy">
          <p className="eyebrow">Trang khám phá</p>
          <h1>Bản đồ tri thức 3D</h1>
        </div>
      </div>

      <div className="space-experience">
        <Canvas
          camera={{ position: [0, 14, 23], fov: 48, near: 0.1, far: 120 }}
          dpr={[1, 1.5]}
          gl={{ powerPreference: 'high-performance' }}
          performance={{ min: 0.5 }}
        >
          <Suspense fallback={null}>
            <Scene selectedPlanet={selectedPlanet} setSelectedPlanet={selectPlanet} handControlStore={handControlStore} />
          </Suspense>
        </Canvas>

        <div className="hud-bar">
          <div>
            <span>Drag</span> xoay camera
          </div>
          <div>
            <span>Scroll</span> zoom
          </div>
          <div>
            <span>Ngón trỏ</span> chọn như chuột
          </div>
          <div>
            <span>Bàn tay</span> nghiêng/xoay để đổi góc nhìn
          </div>
          <div>
            <span>Đưa tay gần/xa</span> zoom in/out
          </div>
        </div>

        {panelVisible && <InfoPanel planet={selectedPlanet} onClose={() => setPanelVisible(false)} />}
        {!panelVisible && (
          <button className="reopen-panel" type="button" onClick={() => setPanelVisible(true)}>
            Mở bảng tri thức
          </button>
        )}
      </div>
    </section>
  )
}
