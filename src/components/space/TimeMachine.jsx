import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { publicAsset } from '../../utils/publicAsset'

// "Cỗ máy thời gian" — phương tiện 3D thật, thay cho hình Doraemon 2D.
// Mặc định dùng model CC0 (miễn phí hoàn toàn, không cần ghi credit):
//   "Spaceship" by Quaternius — https://poly.pizza/m/Jqfed124pQ  (CC0)
// Đổi sang đĩa bay UFO (giống cỗ máy thời gian hơn) chỉ cần đổi 1 dòng dưới đây
// sang 'models/ufo-time.glb' — LƯU Ý: model đó là CC-BY 3.0
//   ("UFO TIME" by Martin Calviello, https://poly.pizza/m/89hlsI17Ulw) nên
//   PHẢI ghi credit tác giả khi dùng.
const MODEL_URL = publicAsset('models/spaceship-quaternius.glb')

// Đường kính mong muốn của cỗ máy trong không gian scene (đơn vị world).
const TARGET_SIZE = 3.2
// Bán kính + độ cao quỹ đạo bay lượn quanh hành tinh trung tâm.
const ORBIT_RADIUS = 11
const ORBIT_HEIGHT = 5

export default function TimeMachine({ appearRef }) {
  const groupRef = useRef()
  const spinRef = useRef()
  const { scene } = useGLTF(MODEL_URL)

  // Clone + chuẩn hoá: căn model về gốc toạ độ và quy về kích thước TARGET_SIZE,
  // bất kể model gốc to/nhỏ hay lệch tâm thế nào. Chỉ chạy một lần.
  const { object, fitScale } = useMemo(() => {
    const clone = scene.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    clone.position.sub(center) // dời về tâm hình học
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    return { object: clone, fitScale: TARGET_SIZE / maxDim }
  }, [scene])

  useFrame((state) => {
    const g = groupRef.current
    if (!g) return
    const t = state.clock.elapsedTime

    // Bay vòng quanh khu vực trung tâm, dập dềnh nhẹ lên xuống.
    const a = t * 0.16
    g.position.set(
      Math.cos(a) * ORBIT_RADIUS,
      ORBIT_HEIGHT + Math.sin(t * 0.5) * 0.7,
      Math.sin(a) * ORBIT_RADIUS,
    )
    // Nghiêng nhẹ theo hướng bay cho có "đà".
    g.rotation.z = Math.sin(a) * 0.12

    // Đĩa tự xoay tròn như UFO.
    if (spinRef.current) spinRef.current.rotation.y = t * 0.6

    // Hiện dần cùng tiến trình hình thành sau Big Bang (0 -> 1).
    const p = appearRef?.current?.p ?? 1
    g.scale.setScalar(fitScale * p)
    g.visible = p > 0.01
  })

  return (
    <group ref={groupRef}>
      <group ref={spinRef}>
        <primitive object={object} />
      </group>
    </group>
  )
}

useGLTF.preload(MODEL_URL)
