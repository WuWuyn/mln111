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
const FLOW = ['Giả thuyết', 'Đốt thử', 'Quan sát', 'Điều chỉnh', 'Chân lý']
const clampVal = (v) => Math.min(94, Math.max(6, v))

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
      { icon: '👥', who: 'Số đông', v: guess(round * 13 + 1, round * 7 + 2) },
      { icon: '🎓', who: 'Uy tín', v: guess(round * 17 + 3, round * 11 + 4) },
      { icon: '🧠', who: 'Suy luận', v: guess(round * 23 + 5, round * 19 + 6) },
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

  const litUpTo = built || landed ? 4 : result ? 3 : run ? 2 : 0

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

        <div className="lab-readout">
          <span>Trọng lực</span>
          <strong>{landed || built ? gravityText : '?'}</strong>
          <span>Lần thử · {attempts}</span>
        </div>

        {result && !landed && (
          <div key={`fb-${run}`} className={`flight-feedback ${result}`} role="status">
            {result === 'over' ? '↓ Giảm lực' : '↑ Tăng lực'}
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
                <i>{advisor.icon}</i>
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

        <div key={`res-${run}-${resultLabel}`} className={`shot-result r-${result ?? 'none'}`} role="status">
          <strong>{resultLabel}</strong>
          <p>{message}</p>
        </div>

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

      {handStore && <HandControlBar targets={handTargets} {...hand} />}

      <div className="praxis-flow" aria-label="Vòng nhận thức và thực tiễn">
        {FLOW.map((item, index) => (
          <span key={item} className={index <= litUpTo ? 'is-lit' : ''}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
