import { AdaptiveDpr, OrbitControls, Stars } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { planets } from '../../data/cosmos'
import AsteroidField from './AsteroidField'
import CentralPlanet from './CentralPlanet'
import CosmicDust from './CosmicDust'
import GalaxyParticles from './GalaxyParticles'
import PlanetMesh from './PlanetMesh'
import GameShooter from './game/GameShooter'

const projectedPosition = new THREE.Vector3()
const planetPosition = new THREE.Vector3()
const cameraTarget = new THREE.Vector3(0, 0, 0)
const desiredCameraPosition = new THREE.Vector3()

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

// Writes the orbital world position of `planet` into `target` and returns it.
function setPlanetPosition(target, planet, elapsedTime) {
  const angle = elapsedTime * planet.orbitSpeed + planet.phase

  target.set(Math.cos(angle) * planet.distance, 0, -Math.sin(angle) * planet.distance)
  return target
}

function isPointVisible(point) {
  return point.z > -1 && point.z < 1 && Math.abs(point.x) <= 1.15 && Math.abs(point.y) <= 1.15
}

function HandPointerSelector({ store, selectedPlanet, onSelect }) {
  const { camera } = useThree()
  const lastSelectedId = useRef(selectedPlanet.id)

  useFrame((state) => {
    const control = store.get()

    // Only the pointing gesture selects; an open (steering) or closed hand
    // must not snap the selection around while the camera moves.
    if (!control.active || control.mode !== 'point') {
      lastSelectedId.current = selectedPlanet.id
      return
    }

    const pointerX = control.x * 2 - 1
    const pointerY = -(control.y * 2 - 1)
    let closestPlanet = null
    let closestDistance = 0.22

    projectedPosition.set(0, 0, 0).project(camera)

    if (isPointVisible(projectedPosition)) {
      const centralDistance = Math.hypot(projectedPosition.x - pointerX, projectedPosition.y - pointerY)

      if (centralDistance < closestDistance) {
        closestPlanet = planets[0]
        closestDistance = centralDistance
      }
    }

    planets.forEach((planet) => {
      setPlanetPosition(planetPosition, planet, state.clock.elapsedTime).project(camera)

      if (!isPointVisible(planetPosition)) return

      const distance = Math.hypot(planetPosition.x - pointerX, planetPosition.y - pointerY)

      if (distance < closestDistance) {
        closestPlanet = planet
        closestDistance = distance
      }
    })

    if (closestPlanet && closestPlanet.id !== lastSelectedId.current) {
      lastSelectedId.current = closestPlanet.id
      onSelect(closestPlanet)
    }
  })

  return null
}

function HandCameraRig({ store, controlsRef }) {
  const { camera } = useThree()

  useFrame(() => {
    const control = store.get()

    if (!control.active || !controlsRef.current) return

    // rotationX/rotationY come only from the open-palm gesture, zoom only from
    // the pinch gesture — so horizontal hand motion orbits, vertical motion
    // tilts, and pinch-scrub dollies, with no cross-talk between them.
    const azimuth = control.rotationX * 1.7
    const radius = clamp(31 - control.zoom * 21, 9, 32)
    const height = clamp(13 - control.rotationY * 6, 8.5, 18)
    const targetX = control.rotationX * 2.6
    const targetZ = control.rotationY * 2

    cameraTarget.set(targetX, 0, targetZ)
    desiredCameraPosition.set(Math.sin(azimuth) * radius, height, Math.cos(azimuth) * radius)

    controlsRef.current.target.lerp(cameraTarget, 0.1)
    camera.position.lerp(desiredCameraPosition, 0.085)
    camera.lookAt(controlsRef.current.target)
    controlsRef.current.update()
  })

  return null
}

export default function Scene({
  selectedPlanet,
  setSelectedPlanet,
  onOpenExperience,
  handControlStore,
  overlayOpen,
  gameMode = false,
  destroyed = [],
  onDestroyPlanet,
  onDestroyAsteroid,
  resetKey = 0,
}) {
  const controlsRef = useRef()
  // Shared between the asteroid belt (which publishes live positions + hides
  // shot rocks) and the shooter (which tests collisions + marks rocks dead).
  const asteroidStore = useRef({ live: [], destroyed: new Set() })
  // While shooting, planet clicks/hovers should fire rocks — not change the
  // knowledge-panel selection — so suppress the planets' own pointer handlers.
  const interactive = !gameMode

  return (
    <>
      <color attach="background" args={['#02040b']} />
      <fog attach="fog" args={['#030612', 12, 58]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[7, 9, 6]} intensity={1.6} color="#d9edff" />
      {/* Two nested star shells so the whole 3D space stays filled: a near, */}
      {/* brighter layer plus a vast faint halo wrapping the far background. */}
      <Stars radius={100} depth={60} count={9000} factor={4} saturation={0.25} fade speed={0.6} />
      <Stars radius={260} depth={140} count={11000} factor={6} saturation={0} fade speed={0.25} />
      <GalaxyParticles />
      <CosmicDust />
      <AsteroidField store={asteroidStore} resetKey={resetKey} active={gameMode} />
      {!destroyed.includes('central') && (
        <CentralPlanet
          onClick={() => setSelectedPlanet(planets[0])}
          showLabel={!overlayOpen && !gameMode}
          interactive={interactive}
        />
      )}
      {planets.map((planet) =>
        destroyed.includes(planet.id) ? null : (
          <PlanetMesh
            key={planet.id}
            planet={planet}
            selected={selectedPlanet.id === planet.id}
            onSelect={setSelectedPlanet}
            onOpenExperience={onOpenExperience}
            showLabel={!overlayOpen && !gameMode}
            interactive={interactive}
          />
        ),
      )}
      <GameShooter
        enabled={gameMode}
        planets={planets}
        destroyed={destroyed}
        onDestroy={onDestroyPlanet}
        onAsteroidDestroy={onDestroyAsteroid}
        asteroidStore={asteroidStore}
      />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={8}
        maxDistance={35}
        maxPolarAngle={Math.PI * 0.72}
        minPolarAngle={Math.PI * 0.2}
      />
      <AdaptiveDpr pixelated />
      <HandCameraRig store={handControlStore} controlsRef={controlsRef} />
      <HandPointerSelector store={handControlStore} selectedPlanet={selectedPlanet} onSelect={setSelectedPlanet} />
      <EffectComposer>
        <Bloom
          mipmapBlur
          intensity={0.85}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.5}
          radius={0.7}
        />
      </EffectComposer>
    </>
  )
}
