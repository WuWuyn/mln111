import { AdaptiveDpr, OrbitControls, Stars } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { planets } from '../../data/cosmos'
import AsteroidField from './AsteroidField'
import CentralPlanet from './CentralPlanet'
import CosmicDust from './CosmicDust'
import CuteStars from './CuteStars'
import GalaxyParticles from './GalaxyParticles'
import PlanetMesh from './PlanetMesh'
import GameShooter from './game/GameShooter'

const planetPosition = new THREE.Vector3()
const latchPosition = new THREE.Vector3()
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

// How close (in NDC, -1..1 across the screen) the cursor must get to a planet to
// grab it. Once grabbed the lock is sticky until a fist, so no release radius.
const SELECT_RADIUS = 0.22

// Hand selection + sticky lock + gesture actions.
//   point ☝️   → lock onto the nearest planet under the cursor. Once locked the
//               cursor stays glued to it — even as the planet orbits — so there's
//               nothing to chase; it holds until you make a fist.
//   confirm ✌️ → opens the locked planet's experiment (rising-edge, fires once).
//   fist ✊    → releases the lock so you can point at a different planet.
//   While locked, the planet's live screen position is published to `latchStore`
//   so the reticle rides along with it.
function HandPointerSelector({ store, latchStore, selectedPlanet, onSelect, onOpenExperience }) {
  const { camera } = useThree()
  const lastSelectedId = useRef(selectedPlanet.id)
  const lockedPlanetRef = useRef(null)
  const prevGestureRef = useRef('idle')
  const confirmFiredRef = useRef(false)
  const latchActiveRef = useRef(false)

  const clearLatch = () => {
    if (latchActiveRef.current) {
      latchActiveRef.current = false
      latchStore.set({ active: false })
    }
  }

  useFrame((state) => {
    const control = store.get()

    if (!control.active) {
      lockedPlanetRef.current = null
      prevGestureRef.current = 'idle'
      confirmFiredRef.current = false
      lastSelectedId.current = selectedPlanet.id
      clearLatch()
      return
    }

    const gesture = control.mode
    const pointerX = control.x * 2 - 1
    const pointerY = -(control.y * 2 - 1)

    if (gesture === 'idle') {
      // Fist lets go of the held planet.
      lockedPlanetRef.current = null
      lastSelectedId.current = selectedPlanet.id
    } else if (gesture === 'point' && !lockedPlanetRef.current) {
      // Acquire the nearest planet under the cursor; once locked it stays put
      // (no re-evaluation) until a fist releases it.
      let closestPlanet = null
      let closestDistance = SELECT_RADIUS

      planets.forEach((planet) => {
        setPlanetPosition(planetPosition, planet, state.clock.elapsedTime).project(camera)

        if (!isPointVisible(planetPosition)) return

        const distance = Math.hypot(planetPosition.x - pointerX, planetPosition.y - pointerY)

        if (distance < closestDistance) {
          closestPlanet = planet
          closestDistance = distance
        }
      })

      if (closestPlanet) {
        lockedPlanetRef.current = closestPlanet
        if (closestPlanet.id !== lastSelectedId.current) {
          lastSelectedId.current = closestPlanet.id
          onSelect(closestPlanet)
        }
      }
    } else if (gesture !== 'point') {
      // navigate / confirm keep the lock; just keep the selection ref in sync.
      lastSelectedId.current = selectedPlanet.id
    }

    const locked = lockedPlanetRef.current

    if (gesture === 'confirm') {
      if (locked && !confirmFiredRef.current && prevGestureRef.current !== 'confirm') {
        confirmFiredRef.current = true
        onOpenExperience?.(locked)
      }
    } else {
      confirmFiredRef.current = false
    }
    prevGestureRef.current = gesture

    if (locked) {
      setPlanetPosition(latchPosition, locked, state.clock.elapsedTime).project(camera)
      latchActiveRef.current = true
      latchStore.set({
        active: true,
        x: (latchPosition.x + 1) / 2,
        y: (1 - latchPosition.y) / 2,
        armed: gesture === 'confirm',
      })
    } else {
      clearLatch()
    }
  })

  return null
}

function HandCameraRig({ store, controlsRef }) {
  const { camera } = useThree()

  useFrame(() => {
    const control = store.get()

    if (!control.active || !controlsRef.current) return

    // All three come from the open-palm gesture: horizontal hand motion orbits,
    // vertical motion tilts, and twisting the wrist (control.zoom) dollies — like
    // turning a volume knob — with no cross-talk between them.
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

// Lái tiến trình "hình thành" (0->1) sau Big Bang. Giữ trong một ref và cập
// nhật mỗi frame để các hành tinh đọc imperatively (không re-render mỗi frame).
function AppearDriver({ appearRef, formState }) {
  useFrame((_, delta) => {
    const cur = appearRef.current
    if (formState === 'shown') cur.p = 1
    else if (formState === 'forming') cur.p = Math.min(1, cur.p + delta / 1.6)
    else cur.p = 0
  })
  return null
}

export default function Scene({
  selectedPlanet,
  setSelectedPlanet,
  onOpenExperience,
  handControlStore,
  latchStore,
  overlayOpen,
  gameMode = false,
  destroyed = [],
  onDestroyPlanet,
  onDestroyAsteroid,
  resetKey = 0,
  formState = 'shown',
  lockHand = false,
}) {
  const controlsRef = useRef()
  const appearRef = useRef({ p: formState === 'shown' ? 1 : 0 })
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
      <CuteStars />
      <AsteroidField store={asteroidStore} resetKey={resetKey} active={gameMode} />
      <AppearDriver appearRef={appearRef} formState={formState} />
      {!destroyed.includes('central') && (
        <CentralPlanet
          onClick={() => setSelectedPlanet(planets[0])}
          showLabel={!overlayOpen && !gameMode}
          interactive={interactive}
          appearRef={appearRef}
        />
      )}
      {planets.map((planet, index) =>
        destroyed.includes(planet.id) ? null : (
          <PlanetMesh
            key={planet.id}
            planet={planet}
            selected={selectedPlanet.id === planet.id}
            onSelect={setSelectedPlanet}
            onOpenExperience={onOpenExperience}
            showLabel={!overlayOpen && !gameMode}
            interactive={interactive}
            appearRef={appearRef}
            appearIndex={index}
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
      {/* Khi mở trang chi tiết, tay điều khiển widget — không cho điều khiển
          camera/chọn hành tinh của scene 3D bên dưới nữa. */}
      {!lockHand && <HandCameraRig store={handControlStore} controlsRef={controlsRef} />}
      {!lockHand && (
        <HandPointerSelector
          store={handControlStore}
          latchStore={latchStore}
          selectedPlanet={selectedPlanet}
          onSelect={setSelectedPlanet}
          onOpenExperience={onOpenExperience}
        />
      )}
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
