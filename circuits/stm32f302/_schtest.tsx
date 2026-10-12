import { PAGES } from "./pages"
import { PowerSection } from "./modules/01-power"
export default () => (
  <board width="80mm" height="80mm" layers={4}>
    <schematicsheet name="power" displayName="电源" sheetIndex={1} />
    <PowerSection pcbX={0} pcbY={0} />
  </board>
)
