/**
 * SPI页 —— 要求 5
 *
 * 两路 SPI：MCP23S17 扩 16 路 GPIO + 一路 PH2.0 引出
 *
 * ── 两路怎么分的 ────────────────────────────────────────────────────────
 *   第 1 路  SPI2  PB12(NSS,脚33) / PB13(SCK,脚34) / PB14(MISO,脚35) / PB15(MOSI,脚36)
 *           → U6 MCP23S17，扩出 16 路 GPIO → J12 2×8 2.54mm 排针
 *   第 2 路  SPI3  PA4(NSS,脚20) / PC10(SCK,脚51) / PC11(MISO,脚52) / PC12(MOSI,脚53)
 *           → J6 PH2.0 1×6 引出
 *
 *   ⚠️ 该型号**没有 SPI1**（见 REQUIREMENTS.md §4.1），两路只能落在 SPI2/SPI3。
 *
 * ── U6 引脚（EasyEDA 官方符号核实）──────────────────────────────────────
 *   1–8   = GPB0–GPB7      21–28 = GPA0–GPA7
 *   9     = VDD            10    = VSS
 *   11    = CS             12    = SCK      13 = SI      14 = SO
 *   15–17 = A0 A1 A2       18    = RESET    19 = INTB    20 = INTA
 *
 *   处理方式：
 *     A0/A1/A2 → 全接地（SPI 模式下决定操作码里的器件地址位 = 0）
 *     RESET    → R26 10k 上拉到 3.3V（不能悬空，否则芯片一直复位）
 *     CS       → R27 10k 上拉到 3.3V（MCU 复位期间保持"未选中"，防止误写寄存器）
 *     INTA/INTB→ 本板不接（需要中断时由 MCU 轮询即可）
 *     GPA0–7 / GPB0–7 → 全部引到 J12，**一一对应直连**（不绕网络名，1:1 没什么可读性问题）
 *
 * ── J12 的 16 路怎么编号 ────────────────────────────────────────────────
 *   2×8 排针：pin1–8 = GPA0–GPA7（第一排），pin9–16 = GPB0–GPB7（第二排）。
 *   按芯片的端口结构分排，比交错编号好查线。
 *
 * ── 本页器件（7 个）─────────────────────────────────────────────────────
 *   U6 J12 J6 R26 R27 C32 C33
 *
 * ── 状态：器件放置 + 接线 完成 ──────────────────────────────────────────
 */
import { Fragment } from "react"
import { PAGES } from "../pages"
import { NET } from "../nets"
import { R0603, C0603 } from "../parts/codes"
import { Ph20Port } from "../parts/connectors"

const SHEET: (typeof PAGES)[number]["name"] = "spi"

/** J12：2×8 排针，第一排 GPA0–7、第二排 GPB0–7 */
const GPIO_HEADER_PINS = {
  pin1: "GPA0", pin2: "GPA1", pin3: "GPA2", pin4: "GPA3",
  pin5: "GPA4", pin6: "GPA5", pin7: "GPA6", pin8: "GPA7",
  pin9: "GPB0", pin10: "GPB1", pin11: "GPB2", pin12: "GPB3",
  pin13: "GPB4", pin14: "GPB5", pin15: "GPB6", pin16: "GPB7",
} as const

/** U6 的 16 个 GPIO 脚名，顺序与 J12 一一对应 */
const GPIO_SIGNALS = [
  "GPA0", "GPA1", "GPA2", "GPA3", "GPA4", "GPA5", "GPA6", "GPA7",
  "GPB0", "GPB1", "GPB2", "GPB3", "GPB4", "GPB5", "GPB6", "GPB7",
] as const

export const SpiSection = () => (
  <group name="SPI" schSheetName={SHEET}>
    {/* ══ SPI2 → MCP23S17 ═══════════════════════════════════════════════ */}
    <chip
      name="U6"
      footprint="jlcpcb:C128577"
      manufacturerPartNumber="MCP23S17T-E/SS"
      supplierPartNumbers={{ jlcpcb: ["C128577"] }}
      pinLabels={{
        pin1: "GPB0", pin2: "GPB1", pin3: "GPB2", pin4: "GPB3",
        pin5: "GPB4", pin6: "GPB5", pin7: "GPB6", pin8: "GPB7",
        pin9: "VDD", pin10: "VSS", pin11: "CS", pin12: "SCK",
        pin13: "SI", pin14: "SO", pin15: "A0", pin16: "A1", pin17: "A2",
        pin18: "RESET", pin19: "INTB", pin20: "INTA",
        pin21: "GPA0", pin22: "GPA1", pin23: "GPA2", pin24: "GPA3",
        pin25: "GPA4", pin26: "GPA5", pin27: "GPA6", pin28: "GPA7",
      }}
      pinAttributes={{
        VDD: { requiresPower: true },
        VSS: { requiresGround: true },
        RESET: { mustBeConnected: true },
        CS: { mustBeConnected: true },
      }}
      pcbX={0} pcbY={0} schX={2} schY={2}
    />

    <connector
      name="J12"
      footprint="jlcpcb:C68234"
      manufacturerPartNumber="2.54-2*8P"
      supplierPartNumbers={{ jlcpcb: ["C68234"] }}
      pinLabels={GPIO_HEADER_PINS}
      pcbX={0} pcbY={-11} schX={2} schY={-7}
    />

    <capacitor name="C32" capacitance="100nF" footprint="0603"
      supplierPartNumbers={{ jlcpcb: [C0603["100nF"]] }}
      pcbX={9} pcbY={6} schX={-11} schY={-1} />
    <capacitor name="C33" capacitance="100nF" footprint="0603"
      supplierPartNumbers={{ jlcpcb: [C0603["100nF"]] }}
      pcbX={9} pcbY={2} schX={-8} schY={-1} />

    <resistor name="R26" resistance="10k" footprint="0603"
      supplierPartNumbers={{ jlcpcb: [R0603["10k"]] }}
      pcbX={-9} pcbY={6} schX={-11} schY={5} />
    <resistor name="R27" resistance="10k" footprint="0603"
      supplierPartNumbers={{ jlcpcb: [R0603["10k"]] }}
      pcbX={-9} pcbY={2} schX={-8} schY={5} />

    {/* ══ SPI3 → PH2.0 引出 ═════════════════════════════════════════════ */}
    <Ph20Port ref="J6" pinCount={6}
      pinLabels={{ pin1: "3V3", pin2: "GND", pin3: "SCK", pin4: "MISO", pin5: "MOSI", pin6: "CS" }}
      powerPins={["3V3"]} groundPins={["GND"]}
      pcbX={-18} pcbY={8} schX={-11} schY={8} />

    {/* ══ 接线：U6 供电与去耦 ═══════════════════════════════════════════ */}
    <trace name="U6_VDD" from="U6.VDD" to={NET.V3_3} />
    <trace name="U6_VSS" from="U6.VSS" to={NET.GND} />
    <trace name="C32_VDD" from="C32.pin1" to={NET.V3_3} />
    <trace name="C32_GND" from="C32.pin2" to={NET.GND} />
    <trace name="C33_VDD" from="C33.pin1" to={NET.V3_3} />
    <trace name="C33_GND" from="C33.pin2" to={NET.GND} />

    {/* ══ 接线：U6 地址脚全接地（SPI 操作码器件地址位 = 0）══════════════ */}
    <trace name="U6_A0" from="U6.A0" to={NET.GND} />
    <trace name="U6_A1" from="U6.A1" to={NET.GND} />
    <trace name="U6_A2" from="U6.A2" to={NET.GND} />

    {/* ══ 接线：RESET / CS 上拉 ═════════════════════════════════════════ */}
    <trace name="R26_RAIL" from="R26.pin1" to={NET.V3_3} />
    <trace name="R26_RESET" from="R26.pin2" to={NET.MCP_RESET} />
    <trace name="U6_RESET" from="U6.RESET" to={NET.MCP_RESET} />
    <trace name="R27_RAIL" from="R27.pin1" to={NET.V3_3} />
    <trace name="R27_CS" from="R27.pin2" to={NET.SPI2_CS} />
    <trace name="U6_CS" from="U6.CS" to={NET.SPI2_CS} />

    {/* ══ 接线：SPI2 三根信号线（MCU 侧在最小系统页）═══════════════════ */}
    <trace name="U6_SCK" from="U6.SCK" to={NET.SPI2_SCK} />
    <trace name="U6_SI" from="U6.SI" to={NET.SPI2_MOSI} />
    <trace name="U6_SO" from="U6.SO" to={NET.SPI2_MISO} />

    {/* ══ 接线：16 路 GPIO → J12（一一对应直连）═════════════════════════ */}
    {GPIO_SIGNALS.map((sig, i) => (
      <Fragment key={sig}>
        <trace name={`GPIO_${sig}`} from={`U6.${sig}`} to={`J12.pin${i + 1}`} />
      </Fragment>
    ))}

    {/* ══ 接线：SPI3 对外接口 ═══════════════════════════════════════════ */}
    <trace name="J6_VCC" from="J6.3V3" to={NET.V3_3} />
    <trace name="J6_GND" from="J6.GND" to={NET.GND} />
    <trace name="J6_SCK" from="J6.SCK" to={NET.SPI3_SCK} />
    <trace name="J6_MISO" from="J6.MISO" to={NET.SPI3_MISO} />
    <trace name="J6_MOSI" from="J6.MOSI" to={NET.SPI3_MOSI} />
    <trace name="J6_CS" from="J6.CS" to={NET.SPI3_CS} />
  </group>
)
