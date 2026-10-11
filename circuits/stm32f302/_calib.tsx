const Mod = (p: { sheet: string; x: number }) => (
  <group name="MOD" schSheetName={p.sheet} pcbX={p.x} pcbY={0}>
    <resistor name="RM" resistance="1k" footprint="0603" pcbX={0} pcbY={0} />
    <capacitor name="CM" capacitance="100nF" footprint="0603" pcbX={4} pcbY={0} />
    <trace name="M_GND" from="RM.pin1" to="net.GND" />
  </group>
)
export default () => (<board width="80mm" height="60mm">
  <schematicsheet name="sa" displayName="页A" sheetIndex={1} />
  <schematicsheet name="sb" displayName="页B" sheetIndex={2} />
  <Mod sheet="sa" x={-14} />
  <Mod sheet="sb" x={14} />
</board>)
