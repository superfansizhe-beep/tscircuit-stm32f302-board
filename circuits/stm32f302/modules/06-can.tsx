/**
 * CAN页 —— 要求 6
 *
 * 一路 CAN：TCAN332 收发器 + PH2.0 引出
 *
 * ── 本页拓扑 ────────────────────────────────────────────────────────────
 *   MCU(最小系统页) net.CAN_TX → U7.TXD      U7.RXD → net.CAN_RX
 *   U7.CANH / U7.CANL → J7 (PH2.0 1x3: CANH / CANL / GND)
 *   R28 120Ω 跨 CANH–CANL = 总线终端电阻
 *   R29 10k 把 TXD 上拉到 3.3V
 *
 * ── ⚠️ TCAN332 是 3.3V 器件 ─────────────────────────────────────────────
 *   供电必须接 3.3V，**不能接 5V**。与常见 5V CAN 收发器（TJA1050 等）不同，
 *   接错会烧。
 *
 * ── U7 引脚（EasyEDA 官方符号核实）──────────────────────────────────────
 *   1=TXD 2=GND 3=VCC 4=RXD 5=NC 6=CANL 7=CANH 8=NC
 *   pin5 / pin8 是 NC，本板悬空不接。
 *
 * ── 为什么要 R29（TXD 上拉）──────────────────────────────────────────────
 *   MCU 复位期间 CAN_TX 是高阻，TXD 悬空会让总线状态不确定。
 *   10k 上拉让 TXD 保持高电平 = 总线保持**隐性**（recessive），
 *   不会在 MCU 未启动时把总线拉死。这是 CAN 节点的常规做法。
 *
 * ── 终端电阻说明 ────────────────────────────────────────────────────────
 *   题目没提终端电阻。CAN 总线**两端各需 120Ω**，本板固定焊一颗（当作节点端）。
 *   若本板要接在总线中间而非末端，把这颗去掉即可。
 *
 * ── 本页器件（5 个）─────────────────────────────────────────────────────
 *   U7 J7 R28 R29 C34
 *
 * ── 状态：器件放置 + 接线 完成 ──────────────────────────────────────────
 */
import { PAGES } from "../pages"
import { NET } from "../nets"
import { R0603, C0603, partProps } from "../parts/codes"
import { Ph20Port } from "../parts/connectors"

const SHEET: (typeof PAGES)[number]["name"] = "can"

export const CanSection = (props: { pcbX?: number; pcbY?: number }) => (
  <group name="CAN" schSheetName={SHEET} pcbPack={false} pcbX={props.pcbX} pcbY={props.pcbY}>
    <chip
      name="U7"
      footprint="jlcpcb:C73651"
      manufacturerPartNumber="TCAN332DR"
      supplierPartNumbers={{ jlcpcb: ["C73651"] }}
      pinLabels={{
        pin1: "TXD", pin2: "GND", pin3: "VCC", pin4: "RXD",
        pin5: "NC1", pin6: "CANL", pin7: "CANH", pin8: "NC2",
      }}
      pinAttributes={{
        VCC: { requiresPower: true },
        GND: { requiresGround: true },
        TXD: { mustBeConnected: true },
      }}
      pcbX={0} pcbY={0} schX={0} schY={2}
    />

    <resistor name="R28" resistance="120" footprint="0603"
      {...partProps(R0603["120"])}
      pcbX={6} pcbY={4} schX={8} schY={6} />
    <resistor name="R29" resistance="10k" footprint="0603"
      {...partProps(R0603["10k"])}
      pcbX={6} pcbY={0} schX={8} schY={2} />
    <capacitor name="C34" capacitance="100nF" footprint="0603"
      {...partProps(C0603["100nF"])}
      pcbX={6} pcbY={-4} schX={8} schY={-2} />

    <Ph20Port ref="J7" pinCount={3} pinLabels={{ pin1: "CANH", pin2: "CANL", pin3: "GND" }}
      groundPins={["GND"]} pcbX={-12} pcbY={0} schX={-10} schY={2} />

    {/* 收发器供电与地 */}
    <trace name="U7_VCC" from="U7.VCC" to={NET.V3_3} />
    <trace name="U7_GND" from="U7.GND" to={NET.GND} />
    <trace name="C34_VCC" from="C34.pin1" to={NET.V3_3} />
    <trace name="C34_GND" from="C34.pin2" to={NET.GND} />

    {/* MCU 侧收发信号 */}
    <trace name="CAN_TX_TO_U7" from="U7.TXD" to={NET.CAN_TX} />
    <trace name="CAN_RX_FROM_U7" from="U7.RXD" to={NET.CAN_RX} />

    {/* TXD 上拉：MCU 复位期间保持总线隐性 */}
    <trace name="R29_RAIL" from="R29.pin1" to={NET.V3_3} />
    <trace name="R29_TXD" from="R29.pin2" to={NET.CAN_TX} />

    {/* 总线侧：CANH / CANL / 终端电阻 */}
    <trace name="U7_CANH" from="U7.CANH" to={NET.CANH} />
    <trace name="U7_CANL" from="U7.CANL" to={NET.CANL} />
    <trace name="R28_CANH" from="R28.pin1" to={NET.CANH} />
    <trace name="R28_CANL" from="R28.pin2" to={NET.CANL} />
    <trace name="J7_CANH" from="J7.CANH" to={NET.CANH} />
    <trace name="J7_CANL" from="J7.CANL" to={NET.CANL} />
    <trace name="J7_GND" from="J7.GND" to={NET.GND} />
  </group>
)
