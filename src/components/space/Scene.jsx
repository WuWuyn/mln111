import { OrbitControls, Stars } from '@react-three/drei'
import { planets } from '../../data/cosmos'
import CentralPlanet from './CentralPlanet'
import GalaxyParticles from './GalaxyParticles'
import PlanetMesh from './PlanetMesh'

export default function Scene({ selectedPlanet, setSelectedPlanet }) {
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
        enableDamping
        dampingFactor={0.065}
        minDistance={8}
        maxDistance={35}
        maxPolarAngle={Math.PI * 0.72}
        minPolarAngle={Math.PI * 0.2}
      />
    </>
  )
}
