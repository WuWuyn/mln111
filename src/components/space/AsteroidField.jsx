import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { seededRandom } from './random'

/**
 * A field of many small rocky asteroids spread through the whole 3D space.
 *
 * Uses a single InstancedMesh so hundreds of rocks cost one draw call. Each
 * asteroid gets a deterministic orbit (angle + radius + height), a random
 * scale and a slow individual tumble, so the belt feels alive without ever
 * crowding the planets at the centre.
 *
 * In game mode the asteroids are shootable: every frame we publish each rock's
 * live world position into `store.current.live` so GameShooter can test
 * collisions, and we hide (scale → 0) any index in `store.current.destroyed`.
 */
const COUNT = 120
const INNER_RADIUS = 14
const OUTER_RADIUS = 52
const TWO_PI = Math.PI * 2

const dummy = new THREE.Object3D()

export default function AsteroidField({ store, resetKey = 0, active = false }) {
  const mesh = useRef()
  const asteroidStore = store?.current

  // Per-asteroid orbital parameters, computed once.
  const rocks = useMemo(() => {
    const items = new Array(COUNT)

    for (let i = 0; i < COUNT; i += 1) {
      const r = i * 7
      const t = Math.sqrt(seededRandom(r + 1)) // bias outward, keep core clear
      const radius = INNER_RADIUS + t * (OUTER_RADIUS - INNER_RADIUS)

      items[i] = {
        radius,
        angle: seededRandom(r + 2) * TWO_PI,
        // thin-ish belt: most rocks near the orbital plane, a few high/low
        height: (seededRandom(r + 3) - 0.5) * radius * 0.45,
        orbitSpeed: (0.04 + seededRandom(r + 4) * 0.08) * (seededRandom(r + 5) > 0.5 ? 1 : -1),
        scale: 0.12 + seededRandom(r + 6) ** 2 * 0.55,
        spin: new THREE.Vector3(
          (seededRandom(r + 7) - 0.5) * 0.8,
          (seededRandom(r + 8) - 0.5) * 0.8,
          (seededRandom(r + 9) - 0.5) * 0.8,
        ),
        tilt: seededRandom(r + 10) * TWO_PI,
      }
    }

    return items
  }, [])

  // Live-position records shared with the shooter. A generous radius makes the
  // small, fast rocks reasonably easy to hit.
  const live = useMemo(
    () => rocks.map((rock, index) => ({ index, pos: new THREE.Vector3(), radius: rock.scale + 0.45 })),
    [rocks],
  )

  useLayoutEffect(() => {
    // External collision store for GameShooter, intentionally outside React state.
    // eslint-disable-next-line react-hooks/immutability
    if (asteroidStore) asteroidStore.live = live
  }, [asteroidStore, live])

  // Restore every asteroid when the game resets or game mode turns off.
  useEffect(() => {
    if (asteroidStore) asteroidStore.destroyed.clear()
  }, [asteroidStore, resetKey, active])

  // Slightly varied per-instance colour so the belt isn't a flat grey mass.
  useLayoutEffect(() => {
    const color = new THREE.Color()
    for (let i = 0; i < COUNT; i += 1) {
      const shade = 0.45 + seededRandom(i * 7 + 11) * 0.4
      color.setRGB(shade, shade * 0.95, shade * 0.88)
      mesh.current.setColorAt(i, color)
    }
    mesh.current.instanceColor.needsUpdate = true
  }, [])

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime
    const destroyed = asteroidStore?.destroyed

    for (let i = 0; i < COUNT; i += 1) {
      const rock = rocks[i]
      const angle = rock.angle + elapsed * rock.orbitSpeed

      const x = Math.cos(angle) * rock.radius
      const y = rock.height + Math.sin(angle * 1.3 + rock.tilt) * 0.6
      const z = Math.sin(angle) * rock.radius

      // Publish the live position for collision tests.
      if (asteroidStore) live[i].pos.set(x, y, z)

      // A shot-down rock is hidden by collapsing its instance to zero scale.
      if (destroyed && destroyed.has(i)) {
        dummy.scale.setScalar(0.0001)
        dummy.position.set(x, y, z)
        dummy.rotation.set(0, 0, 0)
      } else {
        dummy.position.set(x, y, z)
        dummy.rotation.set(
          elapsed * rock.spin.x + rock.tilt,
          elapsed * rock.spin.y + rock.tilt,
          elapsed * rock.spin.z,
        )
        dummy.scale.setScalar(rock.scale)
      }

      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }

    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} castShadow={false}>
      {/* dodecahedron with detail 0 reads as a chunky, faceted space rock */}
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.92} metalness={0.08} flatShading vertexColors={false} />
    </instancedMesh>
  )
}
