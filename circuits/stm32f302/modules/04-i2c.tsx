/**
 * I2C页 —— 要求 4
 *
 * 三路 I2C：EEPROM / 温度传感器 / 对外引出
 *
 * ── 三路怎么分的（全部走命名网络，MCU 侧在最小系统页）───────────────────
 *   第 1 路  I2C1  PB6(SCL,脚58) / PB7(SDA,脚59)   → U4 AT24C64D EEPROM
 *   第 2 路  I2C2  PA9(SCL,脚42) / PA10(SDA,脚43)  → U5 TMP1075 温度传感器
 *   第 3 路  I2C3  PA8(SCL,脚41) / PC9(SDA,脚40)   → J5 PH2.0 引出
 *
 *   ⚠️ 为什么 I2C2 非要用 PA9/PA10：该型号的 I2C2 只有两组可选引脚
 *      （PF1/PF0 与 PA9/PA10），而 PF0/PF1 被 8MHz HSE 晶振占用。
 *      连带后果是 USART1 让位到 PC4/PC5。详见 PINMAP.md §3。
 *
 * ── U4 引脚（EasyEDA 官方符号核实）──────────────────────────────────────
 *   1=A0 2=A1 3=A2 4=GND 5=SDA 6=SCL 7=WP 8=VCC
 *   A0/A1/A2 全接地 → 器件地址 0x50（7 位）；WP 接地 → 允许写入
 *
 * ── U5 引脚（EasyEDA 官方符号核实）──────────────────────────────────────
 *   1=SDA 2=SCL 3=ALERT 4=GND 5=A2 6=A1 7=A0 8=VDD
 *   A0/A1/A2 全接地 → 器件地址 0x48（7 位）
 *   ALERT 是开漏输出，本板**不接**（需要时由 MCU 轮询温度即可）
 *   ⚠️ 该脚在原符号里叫 "V+"，带特殊字符会让电源属性不生效，
 *      本项目改标为 VDD（只影响标号，不影响封装）。
 *
 * ── 上拉与去耦 ──────────────────────────────────────────────────────────
 *   三条总线各一对 4.7kΩ 上拉到 3.3V（I2cPullupPair 子电路）
 *   两颗 100nF 就近去耦（C30/C31）
 *
 * ── 本页器件（11 个）────────────────────────────────────────────────────
 *   U4 U5 J5  R20–R25  C30 C31
 *
 * ── 状态：器件放置 + 接线 完成 ──────────────────────────────────────────
 */
import { PAGES } from "../pages"
import { NET } from "../nets"
import { C0603, partProps } from "../parts/codes"
import { Ph20Port } from "../parts/connectors"
import { I2cPullupPair } from "../parts/passives"

const SHEET: (typeof PAGES)[number]["name"] = "i2c"

export const I2cSection = (props: { pcbX?: number; pcbY?: number }) => (
  <group name="I2C" schSheetName={SHEET} pcbPack={false} pcbX={props.pcbX} pcbY={props.pcbY}>
    {/* ══ 第 1 路：AT24C64D EEPROM（地址 0x50）══════════════════════════ */}
    <chip name="U4" footprint="jlcpcb:C6487"
      manufacturerPartNumber="AT24C64D-SSHM-T"
      supplierPartNumbers={{ jlcpcb: ["C6487"] }}
      pinLabels={{ pin1: "A0", pin2: "A1", pin3: "A2", pin4: "GND",
                   pin5: "SDA", pin6: "SCL", pin7: "WP", pin8: "VCC" }}
      pinAttributes={{
        VCC: { requiresPower: true }, GND: { requiresGround: true },
        SDA: { mustBeConnected: true }, SCL: { mustBeConnected: true },
      }}
      pcbX={0} pcbY={10} schX={0} schY={4} />
    <capacitor name="C30" capacitance="100nF" footprint="0603"
      {...partProps(C0603["100nF"])}
      pcbX={-5} pcbY={10} schX={-5} schY={4} />

    {/* ══ 第 2 路：TMP1075 温度传感器（地址 0x48）════════════════════════ */}
    <chip name="U5" footprint="jlcpcb:C2864807"
      manufacturerPartNumber="TMP1075DGKR"
      supplierPartNumbers={{ jlcpcb: ["C2864807"] }}
      pinLabels={{ pin1: "SDA", pin2: "SCL", pin3: "ALERT", pin4: "GND",
                   pin5: "A2", pin6: "A1", pin7: "A0", pin8: "VDD" }}
      pinAttributes={{
        VDD: { requiresPower: true }, GND: { requiresGround: true },
        SDA: { mustBeConnected: true }, SCL: { mustBeConnected: true },
      }}
      pcbX={0} pcbY={1} schX={0} schY={-4} />
    <capacitor name="C31" capacitance="100nF" footprint="0603"
      {...partProps(C0603["100nF"])}
      pcbX={-5} pcbY={1} schX={-5} schY={-4} />

    {/* ══ 第 3 路：PH2.0 对外引出 ════════════════════════════════════════ */}
    <Ph20Port ref="J5" pinCount={4}
      pinLabels={{ pin1: "3V3", pin2: "GND", pin3: "SCL", pin4: "SDA" }}
      powerPins={["3V3"]} groundPins={["GND"]}
      pcbX={-5} pcbY={-8} schX={-10} schY={3}
        insertionDirection="from_above" />

    {/* ══ 三组上拉 ══════════════════════════════════════════════════════ */}
    <I2cPullupPair scl="R20" sda="R21" resistance="4.7k" supply={NET.V3_3}
      sclNet={NET.I2C1_SCL} sdaNet={NET.I2C1_SDA}
      pcbX={4} pcbY={10} schX={4} schY={4} />
    <I2cPullupPair scl="R22" sda="R23" resistance="4.7k" supply={NET.V3_3}
      sclNet={NET.I2C2_SCL} sdaNet={NET.I2C2_SDA}
      pcbX={4} pcbY={1} schX={4} schY={-4} />
    <I2cPullupPair scl="R24" sda="R25" resistance="4.7k" supply={NET.V3_3}
      sclNet={NET.I2C3_SCL} sdaNet={NET.I2C3_SDA}
      pcbX={0} pcbY={-13.5} schX={-10} schY={-1} />

    {/* ══ 接线：U4 EEPROM ═══════════════════════════════════════════════ */}
    <trace name="U4_VCC" from="U4.VCC" to={NET.V3_3}   width="0.6mm" />
    <trace name="U4_GND" from="U4.GND" to={NET.GND}   width="0.6mm" />
    {/* 三个地址脚全接地 → 0x50 */}
    <trace name="U4_A0" from="U4.A0" to={NET.GND}   width="0.6mm" />
    <trace name="U4_A1" from="U4.A1" to={NET.GND}   width="0.6mm" />
    <trace name="U4_A2" from="U4.A2" to={NET.GND}   width="0.6mm" />
    {/* WP 接地 = 允许写入 */}
    <trace name="U4_WP" from="U4.WP" to={NET.GND}   width="0.6mm" />
    <trace name="U4_SCL" from="U4.SCL" to={NET.I2C1_SCL} />
    <trace name="U4_SDA" from="U4.SDA" to={NET.I2C1_SDA} />
    <trace name="C30_VCC" from="C30.pin1" to={NET.V3_3}   width="0.6mm" />
    <trace name="C30_GND" from="C30.pin2" to={NET.GND}   width="0.6mm" />

    {/* ══ 接线：U5 温度传感器 ═══════════════════════════════════════════ */}
    <trace name="U5_VDD" from="U5.VDD" to={NET.V3_3}   width="0.6mm" />
    <trace name="U5_GND" from="U5.GND" to={NET.GND}   width="0.6mm" />
    <trace name="U5_A0" from="U5.A0" to={NET.GND}   width="0.6mm" />
    <trace name="U5_A1" from="U5.A1" to={NET.GND}   width="0.6mm" />
    <trace name="U5_A2" from="U5.A2" to={NET.GND}   width="0.6mm" />
    <trace name="U5_SCL" from="U5.SCL" to={NET.I2C2_SCL} />
    <trace name="U5_SDA" from="U5.SDA" to={NET.I2C2_SDA} />
    <trace name="C31_VDD" from="C31.pin1" to={NET.V3_3}   width="0.6mm" />
    <trace name="C31_GND" from="C31.pin2" to={NET.GND}   width="0.6mm" />

    {/* ══ 接线：J5 对外引出 ═════════════════════════════════════════════ */}
    <trace name="J5_VCC" from="J5.3V3" to={NET.V3_3}   width="0.6mm" />
    <trace name="J5_GND" from="J5.GND" to={NET.GND}   width="0.6mm" />
    <trace name="J5_SCL" from="J5.SCL" to={NET.I2C3_SCL} />
    <trace name="J5_SDA" from="J5.SDA" to={NET.I2C3_SDA} />
  </group>
)
