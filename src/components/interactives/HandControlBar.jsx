// Thanh điều khiển bằng tay dùng chung (không con trỏ): đổi mục bằng cử chỉ,
// kéo nhẹ để chỉnh. Nhận state từ hook useHandTargets.
export default function HandControlBar({ targets, handActive, activeIndex, rateDir, selectTarget, action }) {
  const activeTarget = targets[activeIndex] ?? null
  const isSlider = activeTarget?.kind === 'slider'
  // Gợi ý cho cử chỉ ☝ theo loại mục đang chọn.
  const pointHint =
    activeTarget?.kind === 'slider' ? '☝ kéo chỉnh' : activeTarget?.kind === 'pad' ? '☝ kéo di chuyển' : '☝ bấm'

  return (
    <div className={`hand-ctl ${handActive ? 'is-live' : ''}`}>
      <span className="hand-ctl-dot" aria-hidden="true" />

      {!handActive ? (
        <div className="hand-ctl-text">
          <strong>Điều khiển bằng tay</strong>
          <span>Bật “Điều khiển tay” ở góc dưới để dùng cử chỉ.</span>
        </div>
      ) : (
        <div className="hand-ctl-text">
          <strong>{activeTarget?.label ?? '—'}</strong>
          <span>✌ đổi mục · {pointHint} · ✊ nghỉ</span>
        </div>
      )}

      <div className="hand-ctl-rail" role="group" aria-label="Các mục điều khiển bằng tay">
        {targets.map((item, idx) => (
          <button
            key={item.key}
            type="button"
            className={`hand-ctl-seg ${idx === activeIndex ? 'is-active' : ''} ${item.disabled ? 'is-disabled' : ''}`}
            onClick={() => selectTarget(item.key)}
            disabled={item.disabled}
            aria-pressed={idx === activeIndex}
          >
            {item.label}
          </button>
        ))}
      </div>

      {action ? <div className="hand-ctl-action">{action}</div> : null}

      {handActive && isSlider && (
        <div className={`hand-ctl-rate dir-${rateDir}`} aria-hidden="true">
          <span className="hand-ctl-rate-minus">−</span>
          <span className="hand-ctl-rate-track">
            <i className="hand-ctl-rate-fill" />
          </span>
          <span className="hand-ctl-rate-plus">+</span>
        </div>
      )}
    </div>
  )
}
