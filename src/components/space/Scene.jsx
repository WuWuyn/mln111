import { OrbitControls, Stars } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { planets } from '../../data/cosmos'
import CentralPlanet from './CentralPlanet'
import GalaxyParticles from './GalaxyParticles'
import PlanetMesh from './PlanetMesh'

const projectedPosition = new THREE.Vector3()
const worldPosition = new THREE.Vector3()
const cameraTarget = new THREE.Vector3(0, 0, 0)
const desiredCameraPosition = new THREE.Vector3()

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function getPlanetPosition(planet, elapsedTime) {
  const angle = elapsedTime * planet.orbitSpeed + planet.phase

  worldPosition.set(Math.cos(angle) * planet.distance, 0, -Math.sin(angle) * planet.distance)
  return worldPosition
}

function isPointVisible(point) {
  return point.z > -1 && point.z < 1 && Math.abs(point.x) <= 1.15 && Math.abs(point.y) <= 1.15
}

function HandPointerSelector({ control, selectedPlanet, onSelect }) {
  const { camera } = useThree()
  const lastSelectedId = useRef(selectedPlanet.id)

  useFrame((state) => {
    if (!control?.active) {
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
      getPlanetPosition(planet, state.clock.elapsedTime).project(camera)

      if (!isPointVisible(worldPosition)) return

      const distance = Math.hypot(worldPosition.x - pointerX, worldPosition.y - pointerY)

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

function HandCameraRig({ control, controlsRef }) {
  const { camera } = useThree()

  useFrame(() => {
    if (!control?.active || !controlsRef.current) return

    const roll = control.roll ?? 0
    const azimuth = control.rotationX * 1.35 + roll * 0.55
    const radius = 30 - control.zoom * 14
    const height = 13 - control.rotationY * 5.5
    const targetX = control.rotationX * 3.2
    const targetZ = control.rotationY * 2.4

    cameraTarget.set(targetX, 0, targetZ)
    desiredCameraPosition.set(Math.sin(azimuth) * radius, clamp(height, 8.5, 18), Math.cos(azimuth) * radius)

    controlsRef.current.target.lerp(cameraTarget, 0.1)
    camera.position.lerp(desiredCameraPosition, 0.085)
    camera.lookAt(controlsRef.current.target)
    controlsRef.current.update()
  })

  return null
}

export default function Scene({ selectedPlanet, setSelectedPlanet, handControl }) {
  const controlsRef = useRef()

  return (
    <>
      <color attach="background" args={['#02040b']} />
      <fog attach="fog" args={['#030612', 12, 58]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[7, 9, 6]} intensity={1.6} color="#d9edff" />
      <Stars radius={80} depth={42} count={2500} factor={4} saturation={0.25} fade speed={0.6} />
      <GalaxyParticles />
      <CentralPlanet onClick={() => setSelectedPlanet(planets[0])} />
      {planets.map((planet) => (
        <PlanetMesh
          key={planet.id}
          planet={planet}
          selected={selectedPlanet.id === planet.id}
          onSelect={setSelectedPlanet}
        />
      ))}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={8}
        maxDistance={35}
        maxPolarAngle={Math.PI * 0.72}
        minPolarAngle={Math.PI * 0.2}
      />
      <HandCameraRig control={handControl} controlsRef={controlsRef} />
      <HandPointerSelector control={handControl} selectedPlanet={selectedPlanet} onSelect={setSelectedPlanet} />
    </>
  )
}
