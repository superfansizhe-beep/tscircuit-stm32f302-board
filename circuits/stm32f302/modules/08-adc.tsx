/**
 * ADC 采样页 —— 要求 8
 *
 * 三路 ADC 电压采样：12V / 5V / 3.3V 电源电压
 *
 * ── 为什么三路都要分压（包括 3.3V）──────────────────────────────────────
 *   ADC 的参考就是 VDDA = 3.3V（VREF+ 接 VDDA）。被测电压等于参考时读数
 *   贴在满量程边缘，没有余量、噪声也压着上限。所以三路一律分压到 **约 2.5V**，
 *   留出 0.8V 余量，同时顺带保护 ADC 输入。
 *
 * ── 分压比怎么算的（不是随手填）────────────────────────────────────────
 *   分压比 = R下 / (R上 + R下)
 *
 *     采样点   R上     R下     分压比    满量程时读数
 *     12V     100k    27k     0.2126    2.551V   ✅
 *     5V      100k    100k    0.5000    2.500V   ✅
 *     3.3V    10k     33k     0.7674    2.533V   ✅
 *
 *   三路的满量程读数都落在 2.5V 附近，量程一致，换算系数好记。
 *
 * ── 引脚分配（见 PINMAP.md）─────────────────────────────────────────────
 *   12V  → PA0（脚14，ADC1_IN1）
 *   5V   → PA1（脚15，ADC1_IN2）
 *   3.3V → PB0（脚26，ADC1_IN11）
 *   该型号只有 ADC1（见 REQUIREMENTS.md §4.1），三路都用它的不同通道。
 *
 * ── 滤波电容 ────────────────────────────────────────────────────────────
 *   每个分压点对地一颗 100nF（C35/C36/C37），与分压电阻构成 RC 低通，
 *   抑制开关电源纹波与走线耦合。
 *
 * ── 本页器件（9 个）─────────────────────────────────────────────────────
 *   R30–R35（三组分压）+ C35 C36 C37（滤波）
 *
 * ── 状态：器件放置完成，未接线 ──────────────────────────────────────────
 */
import { PAGES } from "../pages"

const SHEET: (typeof PAGES)[number]["name"] = "adc"

/** 分压电阻编号（嘉立创基础库，实测库存） */
const R0603 = {
  "100k": "C25803",
  "27k": "C22967",
  "33k": "C4216",
  "10k": "C25804",
} as const

const Divider = (props: {
  top: keyof typeof R0603
  bottom: keyof typeof R0603
  refTop: string
  refBottom: string
  refCap: string
  pcbX: number
  schX: number
}) => (
  <>
    <resistor
      name={props.refTop}
      resistance={props.top}
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: [R0603[props.top]] }}
      pcbX={props.pcbX}
      pcbY={4}
      schX={props.schX}
      schY={6}
    />
    <resistor
      name={props.refBottom}
      resistance={props.bottom}
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: [R0603[props.bottom]] }}
      pcbX={props.pcbX}
      pcbY={0}
      schX={props.schX}
      schY={2}
    />
    <capacitor
      name={props.refCap}
      capacitance="100nF"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      pcbX={props.pcbX}
      pcbY={-4}
      schX={props.schX}
      schY={-2}
    />
  </>
)

export const AdcSection = () => (
  <subcircuit name="ADC" schSheetName={SHEET}>
    {/* ══ 12V 采样：100k / 27k → 2.551V ════════════════════════════════ */}
    <Divider top="100k" bottom="27k" refTop="R30" refBottom="R31" refCap="C35" pcbX={-10} schX={-8} />

    {/* ══ 5V 采样：100k / 100k → 2.500V ═════════════════════════════════ */}
    <Divider top="100k" bottom="100k" refTop="R32" refBottom="R33" refCap="C36" pcbX={0} schX={0} />

    {/* ══ 3.3V 采样：10k / 33k → 2.533V ═════════════════════════════════ */}
    <Divider top="10k" bottom="33k" refTop="R34" refBottom="R35" refCap="C37" pcbX={10} schX={8} />
  </subcircuit>
)
