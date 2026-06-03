import ContradictionBalance from './ContradictionBalance'
import DevelopmentSpiral from './DevelopmentSpiral'
import MatterConsciousnessSlider from './MatterConsciousnessSlider'
import PraxisLoop from './PraxisLoop'
import QuantityQualityBar from './QuantityQualityBar'
import RelationNetwork from './RelationNetwork'

// Maps a planet's `widget` key to its interactive component. Kept in one place
// so PlanetDetail can resolve the right experiment without a switch statement.
const WIDGETS = {
  matter: MatterConsciousnessSlider,
  relation: RelationNetwork,
  contradiction: ContradictionBalance,
  quantity: QuantityQualityBar,
  praxis: PraxisLoop,
  spiral: DevelopmentSpiral,
}

export default function PlanetWidget({ widget }) {
  const Widget = WIDGETS[widget]
  if (!Widget) return null
  return <Widget />
}
