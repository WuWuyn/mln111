import { useMemo, useState } from 'react'
import { useHandTargets } from '../../hand/useHandTargets'
import { seededRandom } from '../space/random'
import HandControlBar from './HandControlBar'
import RocketStage from './RocketStage'
import './PraxisLoop.css'

// "Trạm Thực tiễn" — THỰC TIỄN LÀ TIÊU CHUẨN CỦA CHÂN LÝ.
// Trò chơi "hạ cánh bằng thử – sai": trọng lực hành tinh BỊ ẨN nên không thể
// tính ra lực đẩy đúng bằng suy nghĩ suông. Người chơi chỉnh lực rồi ĐỐT ĐỘNG CƠ
// (kiểm nghiệm); thực tiễn trả lời quá mạnh / quá yếu / hạ cánh êm. Cứ điều
// chỉnh theo phản hồi thật là hội tụ tới chân lý — rồi xây trạm (cải biến hiện
// thực). Gợi ý của số đông/uy tín/suy luận đều lệch → chỉ thực tiễn mới đúng.

const TOL = 4 // sai số cho phép quanh lực đúng để được tính "hạ cánh êm"
const clampVal = (v) => Math.min(94, Math.max(6, v))

// Giải thích các TRẠNG THÁI tên lửa (giống tấm "giải thích" ở Cosmic Mirror).
// `mark` trùng dấu hiện trên bảng console để người chơi đối chiếu được; mỗi
// trạng thái gắn với một ý của "thực tiễn là tiêu chuẩn của chân lý".
const ROCKET_STATES = [
  { id: 'over', mark: '↓', label: 'Quá mạnh', note: 'Lực vượt trọng lực → tàu vọt lên. Giảm lực: thực tiễn bác bỏ phán đoán sai.' },
  { id: 'under', mark: '↑', label: 'Quá yếu', note: 'Lực chưa đủ → tàu rơi vỡ. Tăng lực: thất bại là động lực điều chỉnh.' },
  { id: 'land', mark: '✓', label: 'Hạ cánh êm', note: 'Lực khớp trọng lực ẩn → thực tiễn xác nhận đây là chân lý.' },
  { id: 'built', mark: '★', label: 'Đã cải biến', note: 'Xây trạm — tri thức đúng quay lại cải biến hiện thực.' },
]

// Ba "cố vấn" lệch chuẩn (số đông / uy tín / suy luận). Icon vẽ bằng SVG bo khối,
// gradient kim loại theo tông riêng — thay cho emoji phẳng để hợp gu sci-fi.
const ADVISOR_TONE = {
  crowd: ['#eafaff', '#8fd4ef', '#356f8d'],
  authority: ['#fff3c6', '#f0cf6e', '#9a7320'],
  logic: ['#efe8ff', '#a99cff', '#574f9c'],
}

function AdvisorGlyph({ kind }) {
  const id = `adv-grad-${kind}`
  const [c0, c1, c2] = ADVISOR_TONE[kind]
  return (
    <svg className="advisor-ico" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c0} />
          <stop offset="0.5" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`} stroke="rgba(8,12,24,0.5)" strokeWidth="0.5" strokeLinejoin="round">
        {kind === 'crowd' && (
          <>
            <circle cx="8.4" cy="9" r="3" />
            <circle cx="16" cy="10" r="2.5" />
            <path d="M2.6 20c0-3.4 2.6-5.6 5.8-5.6S14.2 16.6 14.2 20z" />
            <path d="M14 20c.1-2.7 1.5-4.4 3.8-4.7 2.2.3 3.6 2 3.6 4.7z" opacity="0.9" />
          </>
        )}
        {kind === 'authority' && (
          <>
            <path d="M3.6 16.6 2 7.7l5.3 3.7L12 4.2l4.7 7.2L22 7.7l-1.6 8.9z" />
            <rect x="3.6" y="17" width="16.8" height="2.8" rx="0.9" />
          </>
        )}
        {kind === 'logic' && (
          <>
            <path d="M12 1.8l2 6.6 6.6 1.6-6.6 1.6L12 22.2l-2-10.6L3.4 10l6.6-1.6z" />
            <circle cx="4.4" cy="18.8" r="1.5" />
            <circle cx="19.8" cy="5.4" r="1.3" />
          </>
        )}
      </g>
      <g fill="rgba(255,255,255,0.55)">
        {kind === 'crowd' && <ellipse cx="7.4" cy="7.8" rx="1" ry="1.2" />}
        {kind === 'authority' && <circle cx="12" cy="8.4" r="1.1" />}
        {kind === 'logic' && <path d="M12 4.2l.9 3.2h-1.8z" />}
      </g>
    </svg>
  )
}

export default function PraxisLoop({ handStore }) {
  const [round, setRound] = useState(1) // mỗi lượt: trọng lực ẩn khác nhau
  const [thrust, setThrust] = useState(50) // lực đẩy hiện tại (0..100)
  const [run, setRun] = useState(0) // khoá animation mỗi lần đốt
  const [result, setResult] = useState(null) // 'over' | 'under' | 'land' | null
  const [attempts, setAttempts] = useState(0)
  const [built, setBuilt] = useState(false)

  // Lực đẩy đúng (ẩn) + ba gợi ý lệch của số đông/uy tín/suy luận.
  const scenario = useMemo(() => {
    const truth = Math.round(clampVal(28 + seededRandom(round * 91 + 17) * 44))
    const guess = (s1, s2) => {
      const mag = TOL + 7 + seededRandom(s1) * 15 // luôn lệch quá ngưỡng -> sai
      const sign = seededRandom(s2) > 0.5 ? 1 : -1
      return Math.round(clampVal(truth + sign * mag))
    }
    const advisors = [
      { kind: 'crowd', who: 'Số đông', v: guess(round * 13 + 1, round * 7 + 2) },
      { kind: 'authority', who: 'Uy tín', v: guess(round * 17 + 3, round * 11 + 4) },
      { kind: 'logic', who: 'Suy luận', v: guess(round * 23 + 5, round * 19 + 6) },
    ]
    return { truth, advisors }
  }, [round])

  const landed = result === 'land'

  const fire = () => {
    if (landed) return
    const diff = thrust - scenario.truth
    setResult(Math.abs(diff) <= TOL ? 'land' : diff > 0 ? 'over' : 'under')
    setRun((value) => value + 1)
    setAttempts((value) => value + 1)
  }

  // Chỉnh lực = quay lại trạng thái "đang ngắm" (xoá kết quả lần trước).
  const adjust = (value) => {
    if (landed) return
    setThrust(value)
    setResult(null)
  }

  const newRound = () => {
    setRound((value) => value + 1)
    setThrust(50)
    setRun(0)
    setResult(null)
    setAttempts(0)
    setBuilt(false)
  }

  const gravityText = `g≈${(scenario.truth / 8).toFixed(1)}`

  const message = built
    ? 'Trạm đã dựng — tri thức quay lại cải biến hiện thực.'
    : landed
      ? `Hạ cánh êm! Thực tiễn xác nhận lực đúng (${gravityText}).`
      : result === 'over'
        ? 'Quá mạnh — tàu vọt lên. Giảm lực rồi đốt lại.'
        : result === 'under'
          ? 'Quá yếu — tàu rơi vỡ. Tăng lực rồi đốt lại.'
          : 'Chỉnh lực rồi “Đốt động cơ” để thực tiễn trả lời.'

  const resultLabel = built
    ? 'Đã cải biến'
    : landed
      ? 'Hạ cánh êm'
      : result === 'over'
        ? 'Quá mạnh'
        : result === 'under'
          ? 'Quá yếu'
          : 'Chưa thử'

  // Một dấu trạng thái duy nhất cho bảng console (gộp readout + kết quả + phản hồi).
  const mark = built ? '★' : landed ? '✓' : result === 'over' ? '↓' : result === 'under' ? '↑' : '?'

  // Trạng thái đang diễn ra để tô sáng đúng ô trong bảng giải thích.
  const activeState = built ? 'built' : landed ? 'land' : result

  // Điều khiển bằng tay: ☝ kéo nhẹ chỉnh lực · ✌/🖐 đổi mục · ☝ bấm nút.
  const handTargets = [
    { key: 'thrust', kind: 'slider', label: `Lực đẩy ${thrust}`, get: () => thrust, set: adjust, min: 0, max: 100, step: 1, disabled: landed },
    { key: 'fire', kind: 'button', label: 'Đốt động cơ', onPress: fire, disabled: landed },
    { key: 'build', kind: 'button', label: 'Xây trạm', onPress: () => setBuilt(true), disabled: !landed || built },
    { key: 'next', kind: 'button', label: 'Lượt khác', onPress: newRound },
  ]
  const hand = useHandTargets(handStore, handTargets)

  const rootClass = [
    'widget praxis-lab',
    result ? 'firing' : '',
    result === 'over' ? 'is-over' : '',
    result === 'under' ? 'is-under' : '',
    landed ? 'is-land' : '',
    built ? 'is-built' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass} style={{ '--thrust': thrust / 100, '--gauge': `${thrust}%` }}>
      <div className="lab-stage">
        <RocketStage thrust={thrust} run={run} outcome={result} built={built} />

        {/* Bảng console duy nhất — gộp Trọng lực/Lần thử + kết quả + phản hồi
            ↑/↓ vào một chỗ (theo lối Cosmic Mirror) để sân khấu thoáng, dễ đọc. */}
        <div
          key={`console-${run}-${built ? 'b' : 'n'}`}
          className={`lab-console r-${result ?? 'none'} ${built ? 'is-built' : ''}`}
          role="status"
        >
          <span className="lab-console-mark" aria-hidden="true">{mark}</span>
          <strong>{resultLabel}</strong>
          <p>{message}</p>
          <div className="lab-console-meta">
            <span>
              Trọng lực
              <b>{landed || built ? gravityText : '?'}</b>
            </span>
            <span>
              Lần thử
              <b>{attempts}</b>
            </span>
          </div>
        </div>

        {/* Thanh điều khiển tay nổi đè MÉP TRÊN khung game — chỉ hiện khi đang
            dùng tay (không đụng khung xương tay ở góc dưới-trái; chuột thì ẩn để
            xem game trọn vẹn). */}
        {handStore && hand.handActive && (
          <div className="stage-hand-dock">
            <HandControlBar targets={handTargets} {...hand} />
          </div>
        )}
      </div>

      <div className="thrust-deck">
        <div className="thrust-gauge">
          <span className="gauge-label">Lực đẩy</span>
          <div className="gauge-track">
            <span className="gauge-fill" />
            <span className="gauge-needle" />
            {scenario.advisors.map((advisor) => (
              <button
                key={advisor.who}
                type="button"
                className="advisor-tick"
                style={{ '--at': `${advisor.v}%` }}
                onClick={() => adjust(advisor.v)}
                disabled={landed}
                title={`${advisor.who} đề xuất ${advisor.v}`}
              >
                <AdvisorGlyph kind={advisor.kind} />
              </button>
            ))}
            <input
              className="gauge-input"
              type="range"
              min="0"
              max="100"
              value={thrust}
              onChange={(event) => adjust(Number(event.target.value))}
              disabled={landed}
              aria-label="Lực đẩy"
            />
          </div>
          <span className="gauge-value">{thrust}</span>
        </div>

        <button type="button" className="fire-btn" onClick={fire} disabled={landed}>
          <span className="fire-ico" aria-hidden="true" />
          Đốt động cơ
        </button>

        <div className="deck-actions">
          {landed && !built && (
            <button type="button" className="build-btn" onClick={() => setBuilt(true)}>
              Xây trạm
            </button>
          )}
          {(landed || built) && (
            <button type="button" className="next-btn" onClick={newRound}>
              Lượt khác
            </button>
          )}
        </div>
      </div>

      {/* Giải thích các trạng thái tên lửa — đối chiếu với dấu ở bảng console;
          ô của trạng thái đang diễn ra được tô sáng. */}
      <div className="state-legend" aria-label="Các trạng thái tên lửa">
        <span className="legend-title">Trạng thái tên lửa</span>
        <ul className="legend-list">
          {ROCKET_STATES.map((item) => (
            <li
              key={item.id}
              className={`legend-item legend-item--${item.id} ${activeState === item.id ? 'is-active' : ''}`}
            >
              <span className="legend-mark" aria-hidden="true">{item.mark}</span>
              <span className="legend-copy">
                <strong>{item.label}</strong>
                <small>{item.note}</small>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
