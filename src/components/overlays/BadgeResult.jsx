import { useMemo, useRef, useState } from 'react'
import { planets } from '../../data/cosmos'
import OverlayShell from './OverlayShell'
import RankCrest from './RankCrest'
import './BadgeResult.css'

const profileTiers = [
  {
    id: 'master',
    min: 90,
    emblem: '✦',
    rank: 'I',
    metal: 'Vàng sao',
    accent: '#ffd86a',
    deep: '#7a4f12',
    glow: 'rgba(255, 200, 90, 0.45)',
    title: 'Nhà du hành biện chứng',
    blurb:
      'Hoàn thành bản đồ khái niệm, thực nghiệm quy luật và kiểm chứng tri thức qua chế độ bắn phá.',
  },
  {
    id: 'praxis',
    min: 70,
    emblem: '✧',
    rank: 'II',
    metal: 'Bạch kim',
    accent: '#9fe6ff',
    deep: '#1b4d63',
    glow: 'rgba(126, 220, 255, 0.42)',
    title: 'Người kiểm nghiệm thực tiễn',
    blurb: 'Hiểu rằng tri thức cần được thử, sửa và chứng minh trong hoạt động thực tế.',
  },
  {
    id: 'dialectic',
    min: 45,
    emblem: '◈',
    rank: 'III',
    metal: 'Đồng đỏ',
    accent: '#ffa06a',
    deep: '#6b3413',
    glow: 'rgba(255, 138, 80, 0.4)',
    title: 'Người giải mã vận động',
    blurb: 'Bắt đầu nhìn thế giới như một quá trình có liên hệ, mâu thuẫn và biến đổi.',
  },
  {
    id: 'novice',
    min: 0,
    emblem: '◇',
    rank: 'IV',
    metal: 'Hợp kim',
    accent: '#b9c8ff',
    deep: '#2a3756',
    glow: 'rgba(150, 170, 230, 0.36)',
    title: 'Nhà du hành nhập môn',
    blurb: 'Hành trình mới mở ra. Tiếp tục khám phá hành tinh và tích điểm bằng quiz bắn phá.',
  },
]

function computeScore({ visited, passed, challengeScore }) {
  const total = planets.length
  const exploration = (visited.length / total) * 40
  const mastery = (passed.length / total) * 20
  const challenge = (challengeScore ?? 0) * 0.4
  return Math.round(exploration + mastery + challenge)
}

function resolveProfile(score) {
  return profileTiers.find((tier) => score >= tier.min) ?? profileTiers[profileTiers.length - 1]
}

export default function BadgeResult({ progress, onClose, onReplay }) {
  const [name, setName] = useState('')
  const [shareMsg, setShareMsg] = useState('')
  const [congratsDismissed, setCongratsDismissed] = useState(false)
  const canvasRef = useRef(null)

  const score = useMemo(() => computeScore(progress), [progress])
  const perfect = score === 100
  const badge = resolveProfile(score)
  const traveller = name.trim() || 'Nhà du hành'
  const challengeDone = progress.challengeScore !== null && progress.challengeScore !== undefined
  const shotAnswered = progress.shotAnswered ?? 0
  const shotCorrect = progress.shotCorrect ?? 0
  // Ladder hiển thị từ hạng cao xuống thấp; nextTier là mốc kế tiếp phải vượt.
  const ladderTiers = profileTiers
  const nextTier = [...profileTiers].reverse().find((tier) => tier.min > score) ?? null
  const toNext = nextTier ? nextTier.min - score : 0

  const drawCertificate = () => {
    const canvas = canvasRef.current ?? document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 800
    const ctx = canvas.getContext('2d')

    const bg = ctx.createLinearGradient(0, 0, 1200, 800)
    bg.addColorStop(0, '#05060f')
    bg.addColorStop(0.56, '#0a1326')
    bg.addColorStop(1, '#1b0c18')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 1200, 800)

    ctx.strokeStyle = badge.accent
    ctx.globalAlpha = 0.62
    ctx.lineWidth = 3
    ctx.strokeRect(48, 48, 1104, 704)
    ctx.strokeStyle = 'rgba(126, 220, 255, 0.34)'
    ctx.globalAlpha = 1
    ctx.lineWidth = 1.5
    ctx.strokeRect(78, 78, 1044, 644)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#7edcff'
    ctx.font = '700 24px "Be Vietnam Pro", Arial, sans-serif'
    ctx.fillText('V Ũ   T R Ụ   T R I Ế T   H Ọ C   ·   H Ồ   S Ơ   H À N H   T R Ì N H', 600, 140)

    // Vầng huy hiệu
    const medal = ctx.createRadialGradient(600, 285, 8, 600, 285, 96)
    medal.addColorStop(0, badge.accent)
    medal.addColorStop(0.55, badge.deep)
    medal.addColorStop(1, 'rgba(7, 8, 18, 0.9)')
    ctx.beginPath()
    ctx.arc(600, 285, 92, 0, Math.PI * 2)
    ctx.fillStyle = medal
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = badge.accent
    ctx.stroke()
    ctx.font = '700 78px "Noto Serif", Georgia, serif'
    ctx.fillStyle = '#fff6df'
    ctx.fillText(badge.emblem, 600, 312)

    ctx.fillStyle = badge.accent
    ctx.font = '600 20px "Be Vietnam Pro", Arial, sans-serif'
    ctx.fillText(`HẠNG ${badge.rank} · ${badge.metal.toUpperCase()}`, 600, 415)

    ctx.fillStyle = '#ffffff'
    ctx.font = '800 56px "Noto Serif", Georgia, serif'
    ctx.fillText(badge.title, 600, 470)

    ctx.fillStyle = 'rgba(220,229,255,0.78)'
    ctx.font = '24px "Be Vietnam Pro", Arial, sans-serif'
    ctx.fillText('Trao tặng', 600, 528)
    ctx.fillStyle = badge.accent
    ctx.font = '700 48px "Noto Serif", Georgia, serif'
    ctx.fillText(traveller, 600, 585)

    ctx.fillStyle = 'rgba(220,229,255,0.86)'
    ctx.font = '26px "Be Vietnam Pro", Arial, sans-serif'
    ctx.fillText(
      `Đã khám phá ${progress.visited.length}/${planets.length} điểm triết học - Điểm hành trình ${score}/100`,
      600,
      620,
    )
    ctx.fillText('Khám phá khái niệm - Thực nghiệm quy luật - Quiz qua bắn phá', 600, 665)

    return canvas
  }

  const downloadCertificate = () => {
    const canvas = drawCertificate()
    const link = document.createElement('a')
    link.download = `ho-so-hanh-trinh-${badge.id}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const share = async () => {
    const text = `Mình vừa hoàn thành hành trình "Vũ Trụ Triết Học" và đạt danh hiệu ${badge.title} (${score}/100).`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Vũ Trụ Triết Học', text })
        return
      }
      await navigator.clipboard.writeText(text)
      setShareMsg('Đã sao chép lời chia sẻ vào clipboard.')
    } catch {
      setShareMsg('Không thể chia sẻ tự động. Bạn có thể tải hồ sơ hoặc chụp màn hình.')
    }
  }

  const tierStyle = {
    '--tier-accent': badge.accent,
    '--tier-deep': badge.deep,
    '--tier-glow': badge.glow,
  }

  return (
    <OverlayShell variant={`overlay-panel--badge tier-${badge.id}`} onClose={onClose} style={tierStyle}>
      {perfect && !congratsDismissed && (
        <div className="badge-congrats" role="status">
          <span className="badge-congrats-glow" aria-hidden="true" />
          <span className="badge-congrats-icon" aria-hidden="true">
            🏆
          </span>
          <div className="badge-congrats-text">
            <strong>Chúc mừng!</strong>
            <span>Bạn đã đạt 100/100 điểm hành trình tuyệt đối.</span>
          </div>
          <button
            type="button"
            className="badge-congrats-close"
            onClick={() => setCongratsDismissed(true)}
            aria-label="Đóng lời chúc mừng"
          >
            ×
          </button>
        </div>
      )}

      <header className="overlay-head badge-head">
        <div>
          <p className="overlay-eyebrow">Hồ sơ hành trình</p>
          <h2>Tiến độ vận dụng</h2>
        </div>
        <button type="button" className="overlay-close" onClick={onClose} aria-label="Đóng">
          ×
        </button>
      </header>

      <div className="badge-main">
        <aside className="badge-rail">
          <div className="badge-ladder" role="list" aria-label="Các hạng hồ sơ">
            {ladderTiers.map((tier) => {
              const reached = score >= tier.min
              const current = tier.id === badge.id
              return (
                <div
                  key={tier.id}
                  role="listitem"
                  className={`badge-ladder-item ${current ? 'is-current' : ''} ${reached ? 'is-reached' : ''}`}
                  style={{ '--row-accent': tier.accent }}
                >
                  <span className="badge-ladder-rank">{tier.rank}</span>
                  <span className="badge-ladder-text">
                    <strong>{tier.title}</strong>
                    <small>
                      {tier.metal} · từ {tier.min}đ
                    </small>
                  </span>
                </div>
              )
            })}
          </div>

          <div className="badge-progress" aria-label="Thanh tiến trình">
            <div className="badge-progress-head">
              <span>Tiến trình</span>
              <strong>{score}/100</strong>
            </div>
            <div className="badge-progress-track">
              <span className="badge-progress-fill" style={{ width: `${score}%` }} />
            </div>
            <p className="badge-progress-note">
              {nextTier ? (
                <>
                  Còn <strong>{toNext}</strong> điểm để lên {nextTier.title}.
                </>
              ) : (
                'Đã đạt hạng cao nhất.'
              )}
            </p>
          </div>

          <p className="badge-hint">
            {challengeDone ? (
              <>
                Quiz bắn phá: đúng <strong>{shotCorrect}</strong>/<strong>{shotAnswered}</strong> câu đã mở.
              </>
            ) : (
              'Gợi ý: bật chế độ bắn phá ở bản đồ vũ trụ để mở quiz nhanh và nâng điểm hành trình.'
            )}
          </p>
        </aside>

        <div className="badge-hero" data-tier={badge.id}>
          <span className="badge-corner badge-corner--tl" aria-hidden="true" />
          <span className="badge-corner badge-corner--tr" aria-hidden="true" />
          <span className="badge-corner badge-corner--bl" aria-hidden="true" />
          <span className="badge-corner badge-corner--br" aria-hidden="true" />

          <div className="badge-crest" data-tier={badge.id}>
            <span className="badge-crest-halo" aria-hidden="true" />
            <RankCrest glyph={badge.emblem} accent={badge.accent} deep={badge.deep} uid={badge.id} />
            <span className="badge-crest-rank">{badge.rank}</span>
          </div>

          <div className="badge-banner">
            <span className="badge-banner-metal">{badge.metal}</span>
            <h3 className="badge-title">{badge.title}</h3>
          </div>

          <p className="badge-blurb">{badge.blurb}</p>

          <div className="badge-score">
            <span className="badge-score-num">{score}</span>
            <span className="badge-score-unit">/100 điểm hành trình</span>
          </div>
        </div>
      </div>

      <div className="badge-stats">
        <div className="badge-stat">
          <strong>
            {progress.visited.length}/{planets.length}
          </strong>
          <span>Điểm triết học đã khám phá</span>
        </div>
        <div className="badge-stat">
          <strong>
            {progress.passed.length}/{planets.length}
          </strong>
          <span>Mini quiz trả lời đúng</span>
        </div>
        <div className="badge-stat">
          <strong>{challengeDone ? `${progress.challengeScore}%` : '-'}</strong>
          <span>Điểm quiz bắn phá</span>
        </div>
      </div>

      <label className="badge-name">
        <span>Tên trên hồ sơ</span>
        <input
          type="text"
          value={name}
          maxLength={40}
          placeholder="Nhập tên của bạn..."
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <div className="badge-actions">
        <button type="button" className="primary-action" onClick={downloadCertificate}>
          Tải hồ sơ
        </button>
        <button type="button" className="ghost-action" onClick={onReplay}>
          Xem lại bản đồ
        </button>
        <button type="button" className="ghost-action" onClick={share}>
          Chia sẻ hành trình
        </button>
      </div>
      {shareMsg && <p className="badge-share-msg">{shareMsg}</p>}

      <canvas ref={canvasRef} className="badge-canvas" aria-hidden="true" />
    </OverlayShell>
  )
}
