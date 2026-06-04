import { useMemo, useRef, useState } from 'react'
import { planets } from '../../data/cosmos'
import OverlayShell from './OverlayShell'
import './BadgeResult.css'

const profileTiers = [
  {
    id: 'master',
    min: 90,
    emblem: '*',
    title: 'Nhà du hành biện chứng',
    blurb:
      'Hoàn thành bản đồ khái niệm, thực nghiệm quy luật và kiểm chứng tri thức qua chế độ bắn phá.',
  },
  {
    id: 'praxis',
    min: 70,
    emblem: 'A',
    title: 'Người kiểm nghiệm thực tiễn',
    blurb: 'Hiểu rằng tri thức cần được thử, sửa và chứng minh trong hoạt động thực tế.',
  },
  {
    id: 'dialectic',
    min: 45,
    emblem: 'B',
    title: 'Người giải mã vận động',
    blurb: 'Bắt đầu nhìn thế giới như một quá trình có liên hệ, mâu thuẫn và biến đổi.',
  },
  {
    id: 'novice',
    min: 0,
    emblem: 'C',
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
  const canvasRef = useRef(null)

  const score = useMemo(() => computeScore(progress), [progress])
  const badge = resolveProfile(score)
  const traveller = name.trim() || 'Nhà du hành'
  const challengeDone = progress.challengeScore !== null && progress.challengeScore !== undefined
  const shotAnswered = progress.shotAnswered ?? 0
  const shotCorrect = progress.shotCorrect ?? 0

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

    ctx.strokeStyle = 'rgba(255, 209, 122, 0.62)'
    ctx.lineWidth = 3
    ctx.strokeRect(48, 48, 1104, 704)
    ctx.strokeStyle = 'rgba(126, 220, 255, 0.34)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(78, 78, 1044, 644)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#7edcff'
    ctx.font = '700 26px Arial, sans-serif'
    ctx.fillText('VŨ TRỤ TRIẾT HỌC - HỒ SƠ HÀNH TRÌNH', 600, 150)

    ctx.font = '700 90px Arial, sans-serif'
    ctx.fillStyle = '#ffd84d'
    ctx.fillText(badge.emblem, 600, 300)

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 58px Arial, sans-serif'
    ctx.fillText(badge.title, 600, 410)

    ctx.fillStyle = 'rgba(220,229,255,0.86)'
    ctx.font = '28px Arial, sans-serif'
    ctx.fillText('Trao tặng', 600, 480)
    ctx.fillStyle = '#ffd17a'
    ctx.font = '700 52px Arial, sans-serif'
    ctx.fillText(traveller, 600, 545)

    ctx.fillStyle = 'rgba(220,229,255,0.86)'
    ctx.font = '26px Arial, sans-serif'
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

  return (
    <OverlayShell variant="overlay-panel--badge" onClose={onClose}>
      <header className="overlay-head badge-head">
        <div>
          <p className="overlay-eyebrow">Hồ sơ hành trình</p>
          <h2>Tiến độ vận dụng</h2>
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

      <div className="badge-progress-row">
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

        <p className="badge-hint">
          {challengeDone ? (
            <>
              Quiz bắn phá: đúng <strong>{shotCorrect}</strong>/<strong>{shotAnswered}</strong> câu đã mở.
            </>
          ) : (
            'Gợi ý: bật chế độ bắn phá ở bản đồ vũ trụ để mở quiz nhanh và nâng điểm hành trình.'
          )}
        </p>
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
