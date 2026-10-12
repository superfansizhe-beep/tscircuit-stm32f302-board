/**
 * ADC 采样页 —— 要求 8
 *
 * 三路 ADC 电压采样：12V / 5V / 3.3V 电源电压
 *
 * ── 为什么三路都要分压（包括 3.3V）──────────────────────────────────────
 *   ADC 的参考就是 VDDA = 3.3V（VREF+ 接 VDDA）。被测电压等于参考时读数
 *   贴在满量程边缘，没有余量、噪声也压着上限。所以三路一律分压到**约 2.5V**，
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
 *   三路满量程读数都落在 2.5V 附近，量程一致、换算系数好记。
 *   每路再并一颗 100nF 对地，与分压电阻构成 RC 低通，抑制开关电源纹波。
 *
 * ── 引脚分配（见 PINMAP.md）─────────────────────────────────────────────
 *   12V  → PA0（脚14，ADC1_IN1）
 *   5V   → PA1（脚15，ADC1_IN2）
 *   3.3V → PB0（脚26，ADC1_IN11）
 *   该型号只有 ADC1（见 REQUIREMENTS.md §4.1），三路都用它的不同通道。
 *
 * ── 本页器件（9 个）─────────────────────────────────────────────────────
 *   R30–R35（三组分压）+ C35 C36 C37（滤波）
 *   三组完全同构，直接复用 parts/passives.tsx 的 VoltageDivider。
 *
 * ── 状态：器件放置 + 接线 完成 ──────────────────────────────────────────
 */
import { PAGES } from "../pages"
import { NET } from "../nets"
import { VoltageDivider } from "../parts/passives"

const SHEET: (typeof PAGES)[number]["name"] = "adc"

/** 三组采样：输入网络、去 ADC 的采样网络、位号、坐标 */
const CHANNELS = [
  {
    top: "R30", bottom: "R31", cap: "C35",
    topValue: "100k", bottomValue: "27k",
    inputNet: NET.V12, senseNet: NET.ADC_12V,
    pcbX: -10, schX: -8,
  },
  {
    top: "R32", bottom: "R33", cap: "C36",
    topValue: "100k", bottomValue: "100k",
    inputNet: NET.V5, senseNet: NET.ADC_5V,
    pcbX: 0, schX: 0,
  },
  {
    top: "R34", bottom: "R35", cap: "C37",
    topValue: "10k", bottomValue: "33k",
    inputNet: NET.V3_3, senseNet: NET.ADC_3V3,
    pcbX: 10, schX: 8,
  },
] as const

export const AdcSection = (props: { pcbX?: number; pcbY?: number }) => (
  <group name="ADC" schSheetName={SHEET} pcbPack={false} pcbX={props.pcbX} pcbY={props.pcbY}>
    {CHANNELS.map((ch) => (
      <VoltageDivider
        key={ch.top}
        top={ch.top}
        bottom={ch.bottom}
        cap={ch.cap}
        topValue={ch.topValue}
        bottomValue={ch.bottomValue}
        inputNet={ch.inputNet}
        senseNet={ch.senseNet}
        pcbX={ch.pcbX}
        pcbY={0}
        schX={ch.schX}
        schY={0}
      />
    ))}
  </group>
)
