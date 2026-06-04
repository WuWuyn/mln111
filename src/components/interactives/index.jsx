import ContradictionBalance from './ContradictionBalance'
import ConsciousnessMirror from './ConsciousnessMirror'
import DevelopmentSpiral from './DevelopmentSpiral'
import MatterConsciousnessSlider from './MatterConsciousnessSlider'
import PraxisLoop from './PraxisLoop'
import QuantityQualityBar from './QuantityQualityBar'
import RelationNetwork from './RelationNetwork'
import './hud.css'

// Maps a planet's `widget` key to its interactive component. Kept in one place
// so PlanetDetail can resolve the right experiment without a switch statement.
const WIDGETS = {
  matter: MatterConsciousnessSlider,
  consciousness: ConsciousnessMirror,
  relation: RelationNetwork,
  contradiction: ContradictionBalance,
  quantity: QuantityQualityBar,
  praxis: PraxisLoop,
  spiral: DevelopmentSpiral,
}

// The 5 visual-first stations get the shared sci-fi HUD chrome (station topbar,
// corner brackets, scanlines). The two reading-layout widgets (quantity, spiral)
// render bare so the HUD frame never wraps a text-column experiment.
const HUD_META = {
  matter: { code: 'ST-01', tag: 'VAT-CHAT', feed: 'OBSERVER FEED' },
  consciousness: { code: 'ST-02', tag: 'Y-THUC', feed: 'MIRROR FEED' },
  relation: { code: 'ST-03', tag: 'LIEN-HE', feed: 'SYSTEM FEED' },
  contradiction: { code: 'ST-04', tag: 'LUONG-CHAT', feed: 'CORE FEED' },
  praxis: { code: 'ST-05', tag: 'THUC-TIEN', feed: 'PRAXIS FEED' },
  // Reading-layout widgets — not wired to any planet today, but kept on the same
  // HUD language so they match if ever surfaced.
  quantity: { code: 'ST-06', tag: 'LUONG-CHAT', feed: 'METER FEED' },
  spiral: { code: 'ST-07', tag: 'PHAT-TRIEN', feed: 'SPIRAL FEED' },
}

function HudShell({ widget, children }) {
  const meta = HUD_META[widget]
  return (
    <div className={`hud-shell hud-shell--${widget}`}>
      <div className="hud-topbar" aria-hidden="true">
        <span className="hud-id">
          <i className="hud-caret">▸</i>
          {meta.code}
          <i className="hud-slash">//</i>
          {meta.tag}
        </span>
        <span className="hud-feed">{meta.feed}</span>
        <span className="hud-rec">
          <i className="hud-rec-dot" />
          REC
        </span>
      </div>
      {children}
      <div className="hud-frame" aria-hidden="true" />
      <div className="hud-scanlines" aria-hidden="true" />
    </div>
  )
}

export default function PlanetWidget({ widget, handStore }) {
  const Widget = WIDGETS[widget]
  if (!Widget) return null
  if (!HUD_META[widget]) return <Widget handStore={handStore} />
  return (
    <HudShell widget={widget}>
      <Widget handStore={handStore} />
    </HudShell>
  )
}
