import { useMemo, useRef, useState } from 'react'
import { planets } from '../../data/cosmos'
import { resolveBadge } from '../../data/learning'
import OverlayShell from './OverlayShell'
import './BadgeResult.css'

// Closing "Huy hiệu Nhà du hành" page. Turns the session's progress into a score,
// resolves a badge tier, and offers a downloadable certificate + share.
function computeScore({ visited, passed, challengeScore }) {
  const total = planets.length
  const exploration = (visited.length / total) * 40
  const mastery = (passed.length / total) * 20
  const challenge = (challengeScore ?? 0) * 0.4
  return Math.round(exploration + mastery + challenge)
}

export default function BadgeResult({ progress, onClose, onReplay, onGoQuiz }) {
  const [name, setName] = useState('')
  const [shareMsg, setShareMsg] = useState('')
  const canvasRef = useRef(null)

  const score = useMemo(() => computeScore(progress), [progress])
  const badge = resolveBadge(score)
  const traveller = name.trim() || 'Nhà du hành'

  const drawCertificate = () => {
    const canvas = canvasRef.current ?? document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 800
    const ctx = canvas.getContext('2d')

    const bg = ctx.createLinearGradient(0, 0, 1200, 800)
    bg.addColorStop(0, '#05060f')
    bg.addColorStop(0.55, '#0a1326')
    bg.addColorStop(1, '#190a1c')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 1200, 800)

    // starfield (deterministic so it looks intentional, not noisy)
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    for (let i = 0; i < 140; i += 1) {
      const x = (i * 97.13) % 1200
      const y = (i * 53.77) % 800
      const r = (i % 3) * 0.6 + 0.3
      ctx.globalAlpha = 0.25 + ((i * 37) % 60) / 100
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    ctx.strokeStyle = 'rgba(255, 209, 122, 0.6)'
    ctx.lineWidth = 3
    ctx.strokeRect(40, 40, 1120, 720)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#7edcff'
    ctx.font = '700 26px Georgia, serif'
    ctx.fillText('VŨ TRỤ TRIẾT HỌC · CHỨNG NHẬN DU HÀNH', 600, 150)

    ctx.font = '120px Georgia, serif'
    ctx.fillText(badge.emblem, 600, 320)

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 60px Georgia, serif'
    ctx.fillText(badge.title, 600, 410)

    ctx.fillStyle = 'rgba(220,229,255,0.85)'
    ctx.font = '28px Georgia, serif'
    ctx.fillText('Trao tặng', 600, 480)
    ctx.fillStyle = '#ffd17a'
    ctx.font = 'italic 700 52px Georgia, serif'
    ctx.fillText(traveller, 600, 545)

    ctx.fillStyle = 'rgba(220,229,255,0.85)'
    ctx.font = '26px Georgia, serif'
    ctx.fillText(
      `Đã khám phá ${progress.visited.length}/${planets.length} hành tinh · Điểm hành trình ${score}/100`,
      600,
      620,
    )
    ctx.fillText('Chủ nghĩa duy vật biện chứng — Triết học Mác – Lênin', 600, 665)

    return canvas
  }

  const downloadCertificate = () => {
    const canvas = drawCertificate()
    const link = document.createElement('a')
    link.download = `chung-nhan-${badge.id}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const share = async () => {
    const text = `Mình vừa hoàn thành hành trình "Vũ Trụ Triết Học" và đạt danh hiệu ${badge.emblem} ${badge.title} (${score}/100)!`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Vũ Trụ Triết Học', text })
        return
      }
      await navigator.clipboard.writeText(text)
      setShareMsg('Đã sao chép lời chia sẻ vào clipboard ✓')
    } catch {
      setShareMsg('Không thể chia sẻ tự động — bạn có thể chụp màn hình nhé!')
    }
  }

  const challengeDone = progress.challengeScore !== null && progress.challengeScore !== undefined

  return (
    <OverlayShell variant="overlay-panel--badge" onClose={onClose}>
      <header className="overlay-head">
        <div>
          <p className="overlay-eyebrow">Huy hiệu Nhà du hành</p>
          <h2>Kết thúc hành trình</h2>
        </div>
        <button type="button" className="overlay-close" onClick={onClose} aria-label="Đóng">
          ×
        </button>
      </header>

      <div className="badge-hero">
        <div className="badge-emblem" aria-hidden="true">
          {badge.emblem}
        </div>
        <h3 className="badge-title">{badge.title}</h3>
        <p className="badge-blurb">{badge.blurb}</p>
        <div className="badge-score">
          <span className="badge-score-num">{score}</span>
          <span className="badge-score-unit">/100 điểm hành trình</span>
        </div>
      </div>

      <div className="badge-stats">
        <div className="badge-stat">
          <strong>
            {progress.visited.length}/{planets.length}
          </strong>
          <span>Hành tinh đã khám phá</span>
        </div>
        <div className="badge-stat">
          <strong>
            {progress.passed.length}/{planets.length}
          </strong>
          <span>Mini quiz trả lời đúng</span>
        </div>
        <div className="badge-stat">
          <strong>{challengeDone ? `${progress.challengeScore}%` : '—'}</strong>
          <span>Điểm thử thách</span>
        </div>
      </div>

      {!challengeDone && (
        <p className="badge-hint">
          Mẹo: hoàn thành <button type="button" className="link-action" onClick={onGoQuiz}>Thử thách Nhà du hành</button> để
          nâng điểm và mở khóa danh hiệu cao hơn.
        </p>
      )}

      <label className="badge-name">
        <span>Tên trên chứng nhận</span>
        <input
          type="text"
          value={name}
          maxLength={40}
          placeholder="Nhập tên của bạn…"
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <div className="badge-actions">
        <button type="button" className="primary-action" onClick={downloadCertificate}>
          Tải chứng nhận
        </button>
        <button type="button" className="ghost-action" onClick={onReplay}>
          Xem lại bản đồ vũ trụ
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
