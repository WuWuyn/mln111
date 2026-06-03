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
    mesh.current.rotation.x += delta * 5
    mesh.current.rotation.y += delta * 6

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
    <mesh ref={mesh}>
      <dodecahedronGeometry args={[0.24, 0]} />
      <meshStandardMaterial color="#cbb89c" emissive="#ff8a3c" emissiveIntensity={0.9} roughness={0.8} flatShading />
    </mesh>
  )
}

const SHARDS = 22
const BURST_DURATION = 1.4
const shardDummy = new THREE.Object3D()

function Explosion({ data, onDone }) {
  const inst = useRef()
  const flash = useRef()
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
    </group>
  )
}

export default function GameShooter({ enabled, planets, destroyed, onDestroy, asteroidStore }) {
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
      const id = nextId.current++
      // Smaller, dusty burst for the little rocks.
      setExplosions((prev) => [
        ...prev,
        { id, position: hitPos.toArray(), color: '#b8a890', scale: 0.5 },
      ])
    },
    [asteroidStore],
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
