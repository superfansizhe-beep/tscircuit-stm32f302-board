/**
 * CAN页 —— 要求 6
 *
 * 一路 CAN：TCAN332 收发器 + PH2.0 引出
 *
 * ── 本页拓扑 ────────────────────────────────────────────────────────────
 *   MCU PA12(CAN_TX) → U7.TXD       U7.RXD → MCU PA11(CAN_RX)
 *   U7.CANH / U7.CANL → J7 (PH2.0 1x3: CANH / CANL / GND)
 *   R28 120Ω 跨接在 CANH–CANL 之间 = 总线终端电阻
 *
 * ── ⚠️ TCAN332 是 3.3V 器件 ─────────────────────────────────────────────
 *   供电必须接 3.3V，**不能接 5V**。这点和常见的 5V CAN 收发器（如 TJA1050）不同，
 *   接错会烧。所以本页 VCC 直接取自 net.V3_3。
 *
 * ── U7 引脚（EasyEDA 官方符号核实，不是猜的）─────────────────────────────
 *   TCAN332DR (SOIC-8, C73651)
 *     1=TXD   2=GND   3=VCC   4=RXD   5=NC   6=CANL   7=CANH   8=NC
 *     pin5 / pin8 是 NC，本板悬空不接。
 *
 * ── 为什么要 R29（TXD 上拉）──────────────────────────────────────────────
 *   MCU 复位期间 CAN_TX 引脚是高阻，TXD 悬空会让总线状态不确定。
 *   加 10k 上拉到 3.3V 让 TXD 保持高电平 = 总线保持**隐性**（recessive），
 *   不会在 MCU 未启动时把总线拉死。这是 CAN 节点的常规做法。
 *
 * ── 终端电阻说明 ────────────────────────────────────────────────────────
 *   题目没提终端电阻。CAN 总线**两端各需 120Ω**，本板固定焊一颗（当作节点端）。
 *   如果本板将来要接在总线中间而不是末端，把这颗电阻去掉即可。
 *
 * ── 本页器件（5 个）─────────────────────────────────────────────────────
 *   U7 J7  R28 R29  C34
 *
 * ── 状态：器件放置完成，未接线 ──────────────────────────────────────────
 */
import { PAGES } from "../pages"

const SHEET: (typeof PAGES)[number]["name"] = "can"

/** J7：CAN 接口。题目只要求引出 CANH/CANL，这里多带一根 GND 做参考地 */
const CAN_PORT_PINS = {
  pin1: "CANH",
  pin2: "CANL",
  pin3: "GND",
} as const

export const CanSection = () => (
  <group name="CAN" schSheetName={SHEET}>
    {/* ══ CAN 收发器 ════════════════════════════════════════════════════ */}
    <chip
      name="U7"
      footprint="jlcpcb:C73651"
      manufacturerPartNumber="TCAN332DR"
      supplierPartNumbers={{ jlcpcb: ["C73651"] }}
      pinLabels={{
        pin1: "TXD",
        pin2: "GND",
        pin3: "VCC",
        pin4: "RXD",
        pin5: "NC1",
        pin6: "CANL",
        pin7: "CANH",
        pin8: "NC2",
      }}
      pinAttributes={{
        VCC: { requiresPower: true },
        GND: { requiresGround: true },
        TXD: { mustBeConnected: true },
      }}
      pcbX={0}
      pcbY={0}
      schX={0}
      schY={2}
    />

    {/* ══ 总线终端电阻：120Ω 跨接 CANH–CANL ═════════════════════════════ */}
    <resistor
      name="R28"
      resistance="120"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C22787"] }}
      pcbX={6}
      pcbY={4}
      schX={8}
      schY={6}
    />

    {/* ══ TXD 上拉：MCU 复位期间保持总线隐性 ════════════════════════════ */}
    <resistor
      name="R29"
      resistance="10k"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C25804"] }}
      pcbX={6}
      pcbY={0}
      schX={8}
      schY={2}
    />

    {/* ══ 收发器去耦 ════════════════════════════════════════════════════ */}
    <capacitor
      name="C34"
      capacitance="100nF"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      pcbX={6}
      pcbY={-4}
      schX={8}
      schY={-2}
    />

    {/* ══ PH2.0 接口引出 ════════════════════════════════════════════════ */}
    <connector
      name="J7"
      footprint="jlcpcb:C5359600"
      manufacturerPartNumber="WAFER-PH2.0-3PZZ"
      supplierPartNumbers={{ jlcpcb: ["C5359600"] }}
      pinLabels={CAN_PORT_PINS}
      pinAttributes={{ GND: { requiresGround: true } }}
      pcbX={-12}
      pcbY={0}
      schX={-10}
      schY={2}
    />
  </group>
)
