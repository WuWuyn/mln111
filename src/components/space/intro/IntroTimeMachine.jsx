import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { publicAsset } from '../../../utils/publicAsset'

// Model 3D "cỗ máy thời gian" cho màn intro — thay cho hình vẽ 2D trước đây.
// Mặc định dùng model CC0 (miễn phí, không cần credit):
//   "Spaceship" by Quaternius (https://poly.pizza/m/Jqfed124pQ).
// Muốn đổi sang đĩa bay UFO (giống cỗ máy thời gian hơn) thì đổi sang
//   'models/ufo-time.glb' — LƯU Ý model đó là CC-BY 3.0 nên PHẢI ghi credit
//   ("UFO TIME" by Martin Calviello, https://poly.pizza/m/89hlsI17Ulw).
const MODEL_URL = publicAsset('models/spaceship-quaternius.glb')

// Mốc thời gian (ms) phải khớp với PHASE trong WarpIntro.
const CRUISE_END = 1500
const WARP_END = 3600
// Kích thước cỗ máy lúc vi hành (đơn vị world ở mặt phẳng z = 0).
const TARGET_SIZE = 2.6

const smoothstep = (t) => t * t * (3 - 2 * t)
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

export default function IntroTimeMachine({ tRef }) {
  const groupRef = useRef()
  const spinRef = useRef()
  const { scene } = useGLTF(MODEL_URL)

  // Clone + chuẩn hoá: căn model về gốc toạ độ và quy về TARGET_SIZE, bất kể
  // model gốc to/nhỏ hay lệch tâm. Chỉ chạy một lần.
  const { object, fitScale } = useMemo(() => {
    const clone = scene.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    clone.position.sub(center)
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    return { object: clone, fitScale: TARGET_SIZE / maxDim }
  }, [scene])

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return
    const t = tRef.current

    let y = -1.5 // dưới-giữa khung hình
    let z = 0
    let visible = true

    if (t <= CRUISE_END) {
      // Vi hành: bồng bềnh nhẹ.
      y = -1.5 + Math.sin(t * 0.005) * 0.12
    } else if (t < WARP_END) {
      // Warp: vọt lên tâm + lùi xa (perspective tự thu nhỏ) như lao vào điểm kỳ dị.
      const e = smoothstep(clamp01((t - CRUISE_END) / (WARP_END - CRUISE_END)))
      y = -1.5 * (1 - e)
      z = -e * 30
    } else {
      // Từ pha điểm kỳ dị trở đi: ẩn, nhường cho Big Bang 2D.
      visible = false
    }

    g.visible = visible
    g.position.set(0, y, z)
    g.scale.setScalar(fitScale)

    // Đĩa tự xoay tròn cho sống động.
    if (spinRef.current) spinRef.current.rotation.y += delta * 0.8
  })

  return (
    <group ref={groupRef} rotation={[0.5, 0, 0]}>
      <group ref={spinRef}>
        <primitive object={object} />
      </group>
    </group>
  )
}

useGLTF.preload(MODEL_URL)
