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
 *   ⚠️ 该型号**没有 SPI1**（见 REQUIREMENTS.md §4.1），所以两路只能落在 SPI2/SPI3。
 *
 * ── U6 引脚（EasyEDA 官方符号核实，不是猜的）─────────────────────────────
 *   MCP23S17T-E/SS (SSOP-28, C128577) —— SPI 转 16 位 GPIO
 *     1–8   = GPB0–GPB7      21–28 = GPA0–GPA7
 *     9     = VDD            10    = VSS
 *     11    = CS#            12    = SCK      13 = SI      14 = SO
 *     15–17 = A0 A1 A2       18    = RESET#   19 = INTB    20 = INTA
 *
 *   处理方式：
 *     A0/A1/A2 → 全接地（SPI 模式下决定操作码里的器件地址位 = 0）
 *     RESET#   → R26 10k 上拉到 3.3V（不能悬空，否则芯片一直复位）
 *     CS#      → R27 10k 上拉到 3.3V（MCU 复位期间保持"未选中"，防止误写寄存器）
 *     INTA/INTB→ 本板不接（需要中断时由 MCU 轮询即可）
 *     GPA0–7 / GPB0–7 → 全部引到 J12
 *
 * ── J12 的 16 路怎么编号 ────────────────────────────────────────────────
 *   2×8 排针：pin1–8 = GPA0–GPA7（第一排），pin9–16 = GPB0–GPB7（第二排）。
 *   按芯片的端口结构分排，比交错编号好查线。
 *
 * ── J6 的 6 路怎么编号 ──────────────────────────────────────────────────
 *   3V3 / GND / SCK / MISO / MOSI / CS —— 电源在地在前的常用风格，信号按 SPI 惯例序。
 *
 * ── 本页器件（7 个）─────────────────────────────────────────────────────
 *   U6 J12 J6  R26 R27  C32 C33
 *
 * ── 状态：器件放置完成，未接线 ──────────────────────────────────────────
 */
import { PAGES } from "../pages"

const SHEET: (typeof PAGES)[number]["name"] = "spi"

/** J12：2×8 排针，第一排 GPA0–7、第二排 GPB0–7 */
const GPIO_HEADER_PINS = {
  pin1: "GPA0",
  pin2: "GPA1",
  pin3: "GPA2",
  pin4: "GPA3",
  pin5: "GPA4",
  pin6: "GPA5",
  pin7: "GPA6",
  pin8: "GPA7",
  pin9: "GPB0",
  pin10: "GPB1",
  pin11: "GPB2",
  pin12: "GPB3",
  pin13: "GPB4",
  pin14: "GPB5",
  pin15: "GPB6",
  pin16: "GPB7",
} as const

/** J6：PH2.0 1×6 对外 SPI 口 */
const SPI_PORT_PINS = {
  pin1: "3V3",
  pin2: "GND",
  pin3: "SCK",
  pin4: "MISO",
  pin5: "MOSI",
  pin6: "CS",
} as const

export const SpiSection = () => (
  <subcircuit name="SPI" schSheetName={SHEET}>
    {/* ══ SPI2 → MCP23S17 ═══════════════════════════════════════════════ */}
    <chip
      name="U6"
      footprint="jlcpcb:C128577"
      manufacturerPartNumber="MCP23S17T-E/SS"
      supplierPartNumbers={{ jlcpcb: ["C128577"] }}
      pinLabels={{
        pin1: "GPB0",
        pin2: "GPB1",
        pin3: "GPB2",
        pin4: "GPB3",
        pin5: "GPB4",
        pin6: "GPB5",
        pin7: "GPB6",
        pin8: "GPB7",
        pin9: "VDD",
        pin10: "VSS",
        pin11: "CS",
        pin12: "SCK",
        pin13: "SI",
        pin14: "SO",
        pin15: "A0",
        pin16: "A1",
        pin17: "A2",
        pin18: "RESET",
        pin19: "INTB",
        pin20: "INTA",
        pin21: "GPA0",
        pin22: "GPA1",
        pin23: "GPA2",
        pin24: "GPA3",
        pin25: "GPA4",
        pin26: "GPA5",
        pin27: "GPA6",
        pin28: "GPA7",
      }}
      pinAttributes={{
        VDD: { requiresPower: true },
        VSS: { requiresGround: true },
        RESET: { mustBeConnected: true },
        CS: { mustBeConnected: true },
      }}
      pcbX={0}
      pcbY={0}
      schX={2}
      schY={2}
    />

    {/* 16 路 GPIO 引出 */}
    <connector
      name="J12"
      footprint="jlcpcb:C68234"
      manufacturerPartNumber="2.54-2*8P"
      supplierPartNumbers={{ jlcpcb: ["C68234"] }}
      pinLabels={GPIO_HEADER_PINS}
      pcbX={0}
      pcbY={-11}
      schX={2}
      schY={-7}
    />

    {/* MCP23S17 去耦 */}
    <capacitor name="C32" capacitance="100nF" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      pcbX={9} pcbY={6} schX={-11} schY={-1} />
    <capacitor name="C33" capacitance="100nF" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      pcbX={9} pcbY={2} schX={-8} schY={-1} />

    {/* RESET# 与 CS# 上拉 */}
    <resistor name="R26" resistance="10k" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C25804"] }}
      pcbX={-9} pcbY={6} schX={-11} schY={5} />
    <resistor name="R27" resistance="10k" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C25804"] }}
      pcbX={-9} pcbY={2} schX={-8} schY={5} />

    {/* ══ SPI3 → PH2.0 引出 ═════════════════════════════════════════════ */}
    <connector
      name="J6"
      footprint="jlcpcb:C5359603"
      manufacturerPartNumber="WAFER-PH2.0-6PZZ"
      supplierPartNumbers={{ jlcpcb: ["C5359603"] }}
      pinLabels={SPI_PORT_PINS}
      pinAttributes={{
        "3V3": { providesPower: true },
        GND: { requiresGround: true },
      }}
      pcbX={-18}
      pcbY={8}
      schX={-11}
      schY={8}
    />
  </subcircuit>
)
