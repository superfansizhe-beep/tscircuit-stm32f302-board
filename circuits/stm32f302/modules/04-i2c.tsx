/**
 * I2C页 —— 要求 4
 *
 * 三路 I2C：EEPROM / 温度传感器 / 对外引出
 *
 * ── 三路怎么分的 ────────────────────────────────────────────────────────
 *   第 1 路  I2C1  PB6(SCL,脚58) / PB7(SDA,脚59)  → U4 AT24C64D EEPROM
 *   第 2 路  I2C2  PA9(SCL,脚42) / PA10(SDA,脚43) → U5 TMP1075 温度传感器
 *   第 3 路  I2C3  PA8(SCL,脚41) / PC9(SDA,脚40)  → J5 PH2.0 引出
 *
 *   ⚠️ 为什么 I2C2 非要用 PA9/PA10：STM32F302R8T6 的 I2C2 只有两组可选引脚
 *      （PF1/PF0 与 PA9/PA10），而 PF0/PF1 被 8MHz HSE 晶振占用。
 *      连带后果是 USART1 让位到 PC4/PC5。详见 PINMAP.md §3。
 *
 * ── IC 引脚（EasyEDA 官方符号核实，不是猜的）─────────────────────────────
 *   U4 AT24C64D-SSHM-T (SOIC-8, C6487)  —— 64Kb I2C EEPROM
 *     1=A0  2=A1  3=A2  4=GND  5=SDA  6=SCL  7=WP  8=VCC
 *     A0/A1/A2 全接地 → 器件地址 0x50（7 位）
 *     WP 接地 → 允许写入（接高则写保护）
 *
 *   U5 TMP1075DGKR (VSSOP-8, C2864807)  —— I2C 温度传感器
 *     1=SDA  2=SCL  3=ALERT  4=GND  5=A2  6=A1  7=A0  8=V+
 *     A0/A1/A2 全接地 → 器件地址 0x48（7 位）
 *     ALERT 是开漏输出，本板**不接**（需要时由 MCU 轮询温度即可）
 *
 * ── 上拉电阻 ────────────────────────────────────────────────────────────
 *   三条总线各自一对 4.7kΩ 上拉到 3.3V（100kHz 标准速率下的常用值）：
 *     R20/R21 → I2C1(SCL/SDA)   R22/R23 → I2C2(SCL/SDA)   R24/R25 → I2C3(SCL/SDA)
 *
 * ── 本页器件（11 个）────────────────────────────────────────────────────
 *   U4 U5 J5  R20–R25  C30 C31
 *
 * ── 坐标（实测标定）─────────────────────────────────────────────────────
 *   PCB：SOIC-8 与 VSSOP-8 的庭院比 0603 大，行距取 7mm、行内 ≥4mm。
 *   原理图：可用区 x ∈ [−15.5, 15.5] / y ∈ [−10.8, 10.8]，不是 A4 的 297×210。
 *
 * ── 状态：器件放置完成，未接线 ──────────────────────────────────────────
 */
import { PAGES } from "../pages"

const SHEET: (typeof PAGES)[number]["name"] = "i2c"

/** J5 对外 I2C 口的引脚定义（与串口页保持同样的「电源在前」风格） */
const I2C_PORT_PINS = {
  pin1: "3V3",
  pin2: "GND",
  pin3: "SCL",
  pin4: "SDA",
} as const

export const I2cSection = () => (
  <group name="I2C" schSheetName={SHEET}>
    {/* ══ 第 1 路：AT24C64D EEPROM ══════════════════════════════════════ */}
    <chip
      name="U4"
      footprint="jlcpcb:C6487"
      manufacturerPartNumber="AT24C64D-SSHM-T"
      supplierPartNumbers={{ jlcpcb: ["C6487"] }}
      pinLabels={{
        pin1: "A0",
        pin2: "A1",
        pin3: "A2",
        pin4: "GND",
        pin5: "SDA",
        pin6: "SCL",
        pin7: "WP",
        pin8: "VCC",
      }}
      pinAttributes={{
        VCC: { requiresPower: true },
        GND: { requiresGround: true },
        SDA: { mustBeConnected: true },
        SCL: { mustBeConnected: true },
      }}
      pcbX={0}
      pcbY={7}
      schX={0}
      schY={6}
    />
    <capacitor
      name="C30"
      capacitance="100nF"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      pcbX={-6}
      pcbY={7}
      schX={-7}
      schY={8}
    />

    {/* ══ 第 2 路：TMP1075 温度传感器 ═══════════════════════════════════ */}
    <chip
      name="U5"
      footprint="jlcpcb:C2864807"
      manufacturerPartNumber="TMP1075DGKR"
      supplierPartNumbers={{ jlcpcb: ["C2864807"] }}
      pinLabels={{
        pin1: "SDA",
        pin2: "SCL",
        pin3: "ALERT",
        pin4: "GND",
        pin5: "A2",
        pin6: "A1",
        pin7: "A0",
        pin8: "VDD",
      }}
      pinAttributes={{
        VDD: { requiresPower: true },
        GND: { requiresGround: true },
        SDA: { mustBeConnected: true },
        SCL: { mustBeConnected: true },
      }}
      pcbX={0}
      pcbY={-3}
      schX={0}
      schY={-4}
    />
    <capacitor
      name="C31"
      capacitance="100nF"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      pcbX={-6}
      pcbY={-3}
      schX={-7}
      schY={-6}
    />

    {/* ══ 第 3 路：PH2.0 对外引出 ════════════════════════════════════════ */}
    <connector
      name="J5"
      footprint="jlcpcb:C5359601"
      manufacturerPartNumber="WAFER-PH2.0-4PZZ"
      supplierPartNumbers={{ jlcpcb: ["C5359601"] }}
      pinLabels={I2C_PORT_PINS}
      pinAttributes={{
        "3V3": { providesPower: true },
        GND: { requiresGround: true },
      }}
      pcbX={-13}
      pcbY={0}
      schX={-11}
      schY={0}
    />

    {/* ══ I2C1 上拉（4.7k 到 3.3V）═══════════════════════════════════════ */}
    <resistor name="R20" resistance="4.7k" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C23162"] }}
      pcbX={8} pcbY={10} schX={7} schY={8} />
    <resistor name="R21" resistance="4.7k" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C23162"] }}
      pcbX={12} pcbY={10} schX={11} schY={8} />

    {/* ══ I2C2 上拉 ══════════════════════════════════════════════════════ */}
    <resistor name="R22" resistance="4.7k" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C23162"] }}
      pcbX={8} pcbY={3} schX={7} schY={0} />
    <resistor name="R23" resistance="4.7k" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C23162"] }}
      pcbX={12} pcbY={3} schX={11} schY={0} />

    {/* ══ I2C3 上拉 ══════════════════════════════════════════════════════ */}
    <resistor name="R24" resistance="4.7k" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C23162"] }}
      pcbX={8} pcbY={-7} schX={7} schY={-8} />
    <resistor name="R25" resistance="4.7k" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C23162"] }}
      pcbX={12} pcbY={-7} schX={11} schY={-8} />
  </group>
)
