import { useState } from 'react'

// Mâu thuẫn — mini-game: two opposing forces ("thoải mái hiện tại" vs "mục tiêu
// tương lai") live inside one planet. The player tunes both. Real development
// needs BOTH the unity (both forces strong enough) AND a resolved struggle
// (neither side crushing the other). Balance it → the planet evolves.
export default function ContradictionBalance() {
  const [rest, setRest] = useState(75)
  const [goal, setGoal] = useState(25)

  const gap = Math.abs(rest - goal)
  const strength = Math.min(rest, goal)
  // Evolves when the struggle is resolved (small gap) and both sides are alive
  // (neither suppressed to nothing) — unity AND struggle of opposites.
  const evolved = gap <= 18 && strength >= 38
  const tilt = (goal - rest) * 0.18

  let state = 'Mất cân bằng'
  let note =
    'Một mặt đang lấn át mặt kia. Khi mâu thuẫn bị triệt tiêu một chiều, sự vật trì trệ chứ không phát triển.'
  if (evolved) {
    state = 'Tiến hóa! ✦'
    note =
      'Hai mặt đối lập vừa thống nhất vừa đấu tranh trong thế cân bằng động — mâu thuẫn được giải quyết hợp lý đã đẩy hành tinh lên cấp mới.'
  } else if (gap <= 18) {
    state = 'Gần cân bằng'
    note = 'Hai lực đã cân nhau nhưng còn quá yếu. Hãy nâng cả hai mặt lên để có đủ "thống nhất" mà tiến hóa.'
  }

  return (
    <div className="widget widget-contradiction">
      <div className={`contra-planet ${evolved ? 'is-evolved' : ''}`} style={{ '--tilt': `${tilt}deg` }}>
        <div className="contra-core" aria-hidden="true">
          <span className="contra-stream contra-stream--a" style={{ '--power': rest / 100 }} />
          <span className="contra-stream contra-stream--b" style={{ '--power': goal / 100 }} />
        </div>
        <span className="contra-state">{state}</span>
      </div>

      <div className="contra-controls">
        <label className="widget-control widget-control--rest">
          <span className="widget-control-label">
            Thoải mái hiện tại
            <strong>{rest}</strong>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={rest}
            onChange={(event) => setRest(Number(event.target.value))}
            aria-label="Lực: thoải mái hiện tại"
          />
        </label>
        <label className="widget-control widget-control--goal">
          <span className="widget-control-label">
            Mục tiêu tương lai
            <strong>{goal}</strong>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={goal}
            onChange={(event) => setGoal(Number(event.target.value))}
            aria-label="Lực: mục tiêu tương lai"
          />
        </label>
      </div>

      <div className="widget-readout">
        <span className="widget-tag">{state}</span>
        <p>{note}</p>
      </div>
    </div>
  )
}
