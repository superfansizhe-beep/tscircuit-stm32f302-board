/**
 * 基准电路 —— 环境自检用例
 *
 * 用途：跑通 export 就说明 5 条契约都落地了
 *   1. Bun 运行时      ：跑得起来就说明没落到 Node
 *   2. 版本钉死        ：用本地 node_modules 的 CLI，overrides 生效
 *   3. 官方 registry   ：封装（soic8 / 0402）能解析出来
 *   4. 网络 + 代理     ：footprint 几何能抓到
 *   5. fd              ：export 不吃 fd；dev 才需要 ulimit -n 65536
 *
 * 已知噪音：@tscircuit/core@0.0.2119 的 autorouting 在「某个 pin 参与 ≥2 条 trace」
 * （分支/三通节点）时必崩。本例的 R1.pin2 就是这样一个三通节点，所以会看到
 *   "Could not save autorouting paths ... must end at another connection endpoint"
 * 导出仍然成功（fallback 成直线走线）。报错建议的 autorouter="fanout" 实测无效。
 * 改成串联通路就不会触发。详见 README「autorouting 分支节点崩」。
 */
export default () => (
  <board width="30mm" height="20mm">
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{
        pin1: "VCC",
        pin2: "GND",
        pin3: "OUT",
        pin4: "IN",
      }}
    />
    <resistor name="R1" resistance="330" footprint="0402" pcbX={-5} pcbY={0} />
    <led name="LED1" footprint="0402" pcbX={5} pcbY={0} />

    <trace from=".U1 > .VCC" to=".R1 > .pin1" />
    <trace from=".U1 > .OUT" to=".R1 > .pin2" />
    <trace from=".R1 > .pin2" to=".LED1 > .pin1" autorouter="fanout" />
    <trace from=".LED1 > .pin2" to=".U1 > .GND" autorouter="fanout" />
  </board>
)