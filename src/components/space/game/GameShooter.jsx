import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { planetPalette } from '../../../data/cosmos'
import { seededRandom } from '../random'

/**
 * "Phá vỡ hành tinh" game mode.
 *
 * When enabled, a click/tap fires a rock from the camera. Rocks gently home
 * toward the planet under the cursor (so free-aim clicks still land), and on
 * impact the planet shatters into a debris burst + flash. Destroyed planets are
 * reported up via onDestroy so the scene stops rendering them; the parent's
 * reset clears that set and everything returns.
 *
 * Planet world positions are recomputed here every frame from the same orbital
 * formula the scene uses, so collisions track the planets as they orbit — no
 * dependency on the planet meshes themselves (which may be unmounted on hit).
 */
const SPEED = 30
const PROJECTILE_LIFETIME = 4
const HOMING = 0.07
const CENTRAL_RADIUS = 2.1

const raycaster = new THREE.Raycaster()
const ndc = new THREE.Vector2()
const steer = new THREE.Vector3()
// Missiles model +Y as the nose; reused temporaries for per-frame aiming.
const MISSILE_UP = new THREE.Vector3(0, 1, 0)
const velDir = new THREE.Vector3()

// Same formula as Scene.setPlanetPosition: a point at (distance,0,0) rotated by
// the orbit angle around Y.
function planetWorldPosition(target, planet, elapsedTime) {
  const angle = elapsedTime * planet.orbitSpeed + planet.phase
  target.set(Math.cos(angle) * planet.distance, 0, -Math.sin(angle) * planet.distance)
  return target
}

function colorFor(id, planets) {
  if (id === 'central') return '#ffd08a'
  const planet = planets.find((p) => p.id === id)
  return planet ? planetPalette[planet.color][1] : '#ffffff'
}

// Resolve the world position of a locked target (planet id, or "ast:<index>").
function findTargetPos(targetId, livePositions, asteroidStore) {
  if (!targetId) return null
  if (targetId.startsWith('ast:')) {
    const index = Number(targetId.slice(4))
    if (asteroidStore.current.destroyed.has(index)) return null
    const rock = asteroidStore.current.live.find((a) => a.index === index)
    return rock ? rock.pos : null
  }
  const planet = livePositions.current.find((p) => p.id === targetId)
  return planet ? planet.pos : null
}

function Projectile({ data, livePositions, asteroidStore, onHitPlanet, onHitAsteroid, onExpire }) {
  const mesh = useRef()
  const flame = useRef()
  const pos = useRef(new THREE.Vector3().fromArray(data.origin))
  const vel = useRef(new THREE.Vector3().fromArray(data.dir).multiplyScalar(SPEED))
  const age = useRef(0)

  useFrame((_, delta) => {
    age.current += delta

    // Home toward the locked target if it's still alive.
    const targetPos = findTargetPos(data.targetId, livePositions, asteroidStore)
    if (targetPos) {
      steer.copy(targetPos).sub(pos.current).normalize().multiplyScalar(SPEED)
      vel.current.lerp(steer, HOMING)
    }

    pos.current.addScaledVector(vel.current, delta)
    mesh.current.position.copy(pos.current)

    // Point the missile nose (+Y) along its current velocity.
    const speed = vel.current.length()
    if (speed > 1e-4) {
      velDir.copy(vel.current).divideScalar(speed)
      mesh.current.quaternion.setFromUnitVectors(MISSILE_UP, velDir)
    }
    // Flicker the exhaust flame.
    if (flame.current) {
      const f = 0.7 + Math.sin(age.current * 45) * 0.3
      flame.current.scale.set(1, f, 1)
    }

    // Planets first (bigger, fewer), then the asteroid belt.
    for (const planet of livePositions.current) {
      if (pos.current.distanceTo(planet.pos) < planet.radius) {
        onHitPlanet(planet.id, pos.current.clone())
        onExpire(data.id)
        return
      }
    }

    const rocks = asteroidStore.current.live
    const dead = asteroidStore.current.destroyed
    for (let i = 0; i < rocks.length; i += 1) {
      const rock = rocks[i]
      if (dead.has(rock.index)) continue
      if (pos.current.distanceTo(rock.pos) < rock.radius) {
        onHitAsteroid(rock.index, pos.current.clone())
        onExpire(data.id)
        return
      }
    }

    if (age.current > PROJECTILE_LIFETIME || pos.current.length() > 150) {
      onExpire(data.id)
    }
  })

  return (
    <group ref={mesh}>
      {/* fuselage */}
      <mesh>
        <cylinderGeometry args={[0.085, 0.1, 0.46, 14]} />
        <meshStandardMaterial color="#dfe3ee" metalness={0.65} roughness={0.32} />
      </mesh>
      {/* warhead nose */}
      <mesh position={[0, 0.34, 0]}>
        <coneGeometry args={[0.1, 0.26, 14]} />
        <meshStandardMaterial color="#ff5a45" emissive="#ff5a45" emissiveIntensity={0.55} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* three tail fins */}
      {[0, 1, 2].map((i) => (
        <group key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
          <mesh position={[0.11, -0.18, 0]}>
            <boxGeometry args={[0.13, 0.15, 0.02]} />
            <meshStandardMaterial color="#9aa3b4" metalness={0.5} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* additive exhaust flame pointing back (-Y) */}
      <mesh ref={flame} position={[0, -0.36, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.085, 0.38, 12]} />
        <meshBasicMaterial color="#ffd27a" transparent opacity={0.92} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight position={[0, -0.3, 0]} color="#ff9a3c" intensity={6} distance={4} decay={2} />
    </group>
  )
}

const SHARDS = 22
const BURST_DURATION = 1.4
const shardDummy = new THREE.Object3D()

function Explosion({ data, onDone }) {
  const { camera } = useThree()
  const inst = useRef()
  const flash = useRef()
  const ring = useRef()
  const light = useRef()
  const life = useRef(0)
  const burst = data.scale ?? 1

  const shards = useMemo(
    () =>
      Array.from({ length: SHARDS }, (_, index) => {
        const seed = data.id * 101 + index * 17
        const dir = new THREE.Vector3(
          seededRandom(seed + 1) - 0.5,
          seededRandom(seed + 2) - 0.5,
          seededRandom(seed + 3) - 0.5,
        ).normalize()
        return {
          vel: dir.multiplyScalar((3 + seededRandom(seed + 4) * 6) * burst),
          scale: (0.12 + seededRandom(seed + 5) * 0.28) * burst,
          spin: 2 + seededRandom(seed + 6) * 5,
        }
      }),
    [burst, data.id],
  )

  useFrame((_, delta) => {
    life.current += delta
    const t = life.current / BURST_DURATION
    if (t >= 1) {
      onDone(data.id)
      return
    }

    const ease = 1 - (1 - t) * (1 - t)
    for (let i = 0; i < SHARDS; i += 1) {
      const shard = shards[i]
      shardDummy.position.set(
        data.position[0] + shard.vel.x * ease,
        data.position[1] + shard.vel.y * ease,
        data.position[2] + shard.vel.z * ease,
      )
      const s = shard.scale * (1 - t)
      shardDummy.scale.setScalar(Math.max(s, 0.001))
      shardDummy.rotation.set(life.current * shard.spin, life.current * shard.spin * 0.7, 0)
      shardDummy.updateMatrix()
      inst.current.setMatrixAt(i, shardDummy.matrix)
    }
    inst.current.instanceMatrix.needsUpdate = true

    // White-hot flash sphere expands and fades fast.
    const flashScale = (1 + t * 5) * burst
    flash.current.scale.setScalar(flashScale)
    flash.current.material.opacity = Math.max(0, 0.9 - t * 1.6)

    // Shockwave ring billboarded to face the camera, expanding outward.
    if (ring.current) {
      ring.current.scale.setScalar((0.5 + t * 7) * burst)
      ring.current.material.opacity = Math.max(0, 0.7 - t * 1.3)
      ring.current.lookAt(camera.position)
    }

    // A brief burst of light punches the surrounding scene.
    if (light.current) {
      light.current.intensity = Math.max(0, 1 - t * 2.4) * 26 * burst
    }
  })

  return (
    <group>
      <instancedMesh ref={inst} args={[undefined, undefined, SHARDS]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={0.6} roughness={0.85} flatShading />
      </instancedMesh>
      <mesh ref={flash} position={data.position}>
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshBasicMaterial color="#fff2cc" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={ring} position={data.position}>
        <ringGeometry args={[0.46, 0.6, 48]} />
        <meshBasicMaterial color="#ffe6a6" transparent opacity={0.7} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight ref={light} position={data.position} color={data.color} intensity={20} distance={14 * burst} decay={2} />
    </group>
  )
}

export default function GameShooter({ enabled, planets, destroyed, onDestroy, onAsteroidDestroy, asteroidStore }) {
  const { camera, gl } = useThree()
  const livePositions = useRef([])
  const nextId = useRef(0)
  const [projectiles, setProjectiles] = useState([])
  const [explosions, setExplosions] = useState([])

  // Recompute alive-planet positions every frame so collisions follow orbits.
  useFrame((state) => {
    const elapsed = state.clock.elapsedTime
    const arr = []
    if (!destroyed.includes('central')) {
      arr.push({ id: 'central', pos: new THREE.Vector3(0, 0, 0), radius: CENTRAL_RADIUS })
    }
    for (const planet of planets) {
      if (destroyed.includes(planet.id)) continue
      arr.push({
        id: planet.id,
        pos: planetWorldPosition(new THREE.Vector3(), planet, elapsed),
        radius: planet.size + 0.4,
      })
    }
    livePositions.current = arr
  })

  const removeProjectile = useCallback((id) => {
    setProjectiles((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const removeExplosion = useCallback((id) => {
    setExplosions((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const handleHitPlanet = useCallback(
    (planetId, hitPos) => {
      onDestroy(planetId)
      const id = nextId.current++
      setExplosions((prev) => [
        ...prev,
        { id, position: hitPos.toArray(), color: colorFor(planetId, planets) },
      ])
    },
    [onDestroy, planets],
  )

  const handleHitAsteroid = useCallback(
    (index, hitPos) => {
      asteroidStore.current.destroyed.add(index)
      onAsteroidDestroy?.(index)
      const id = nextId.current++
      // Smaller, dusty burst for the little rocks.
      setExplosions((prev) => [
        ...prev,
        { id, position: hitPos.toArray(), color: '#b8a890', scale: 0.5 },
      ])
    },
    [asteroidStore, onAsteroidDestroy],
  )

  // Fire on a deliberate tap (not a camera-orbit drag): small movement, quick.
  useEffect(() => {
    if (!enabled) {
      const frame = window.requestAnimationFrame(() => {
        setProjectiles([])
        setExplosions([])
      })
      return () => window.cancelAnimationFrame(frame)
    }

    const dom = gl.domElement
    let downX = 0
    let downY = 0
    let downTime = 0

    const onDown = (e) => {
      downX = e.clientX
      downY = e.clientY
      downTime = e.timeStamp
    }

    const onUp = (e) => {
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY)
      if (moved > 7 || e.timeStamp - downTime > 450) return

      const rect = dom.getBoundingClientRect()
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(ndc, camera)

      const origin = raycaster.ray.origin.clone()
      const dir = raycaster.ray.direction.clone().normalize()

      // Lock onto the alive target closest to the aim ray (in front of camera).
      // Planets get a generous lock window; asteroids a tighter one (they're
      // small and there are hundreds, so only a near-direct aim grabs one).
      let targetId = null
      let bestScore = Infinity
      const toTarget = new THREE.Vector3()
      const consider = (id, targetPos, lockRadius) => {
        toTarget.copy(targetPos).sub(origin)
        const along = toTarget.dot(dir)
        if (along <= 0) return
        const perpendicular = Math.sqrt(Math.max(0, toTarget.lengthSq() - along * along))
        if (perpendicular < lockRadius && along < bestScore) {
          bestScore = along
          targetId = id
        }
      }

      for (const planet of livePositions.current) {
        consider(planet.id, planet.pos, planet.radius + 1.8)
      }
      const rocks = asteroidStore.current.live
      const dead = asteroidStore.current.destroyed
      for (let i = 0; i < rocks.length; i += 1) {
        if (dead.has(rocks[i].index)) continue
        consider(`ast:${rocks[i].index}`, rocks[i].pos, rocks[i].radius + 0.7)
      }

      const id = nextId.current++
      origin.addScaledVector(dir, 1.6) // start just ahead of the camera
      setProjectiles((prev) => [
        ...prev,
        { id, origin: origin.toArray(), dir: dir.toArray(), targetId },
      ])
    }

    dom.addEventListener('pointerdown', onDown)
    dom.addEventListener('pointerup', onUp)
    return () => {
      dom.removeEventListener('pointerdown', onDown)
      dom.removeEventListener('pointerup', onUp)
    }
  }, [enabled, gl, camera, asteroidStore])

  if (!enabled) return null

  return (
    <>
      {projectiles.map((data) => (
        <Projectile
          key={data.id}
          data={data}
          livePositions={livePositions}
          asteroidStore={asteroidStore}
          onHitPlanet={handleHitPlanet}
          onHitAsteroid={handleHitAsteroid}
          onExpire={removeProjectile}
        />
      ))}
      {explosions.map((data) => (
        <Explosion key={data.id} data={data} onDone={removeExplosion} />
      ))}
    </>
  )
}
