/**
 * PWM页 —— 要求 7
 *
 * 六路 PWM 输出，三排平行紧贴的「舵机轨」
 *
 * ── 题面这句话怎么解的（原文：「六路 PWM 输出，使用 3个1×6 排针，三排分别为 PWM、5V、GND
 *    （建议搜搜看pwm排针是怎么摆放的）」）─────────────────────────────────
 *   做法：3 个 1×6 排针**平行、紧贴、行距 2.54mm** 摆放
 *
 *           列1    列2    列3    列4    列5    列6
 *   第1排  PWM1   PWM2   PWM3   PWM4   PWM5   PWM6    ← J8，整排都是 PWM 信号
 *   第2排  +5V    +5V    +5V    +5V    +5V    +5V     ← J9，整排都是 5V
 *   第3排  GND    GND    GND    GND    GND    GND     ← J10，整排都是 GND
 *
 *   为什么这个解法同时满足字面与惯例：
 *     · 横着看 → 三排分别是 PWM / 5V / GND，**完全符合题面字面**
 *     · 竖着看 → 每一列跨三排 = 一个标准 3 脚舵机接口，脚序 **信号→电源→地**，
 *                与题面给出的顺序一字不差，正是题面提示的行业惯例
 *   所以不需要在「按信号分排」和「按通道分组」之间二选一。
 *
 * ── 引脚分配（见 PINMAP.md）─────────────────────────────────────────────
 *   PWM1 PC0(脚8) TIM1_CH1   PWM2 PC1(脚9)  TIM1_CH2
 *   PWM3 PC2(脚10) TIM1_CH3  PWM4 PC3(脚11) TIM1_CH4
 *   PWM5 PA6(脚22) TIM16_CH1 PWM6 PA7(脚23) TIM17_CH1
 *   前四路在 TIM1 上物理相邻，后两路在 PA6/PA7 相邻，走线天然成排。
 *
 * ── 一个故意的 DRC 例外（必须知情）──────────────────────────────────────
 *   排针本体是 2.54mm，而它的**庭院是 3.04mm**（本体外各留 ~0.25mm 通用余量）。
 *   三排按 2.54mm 紧贴必然让相邻庭院**重叠 0.50mm**，tscircuit 会报
 *   `pcb_courtyard_overlap_error`。
 *   **这是舵机轨的必然结果，且物理上无害**（两块独立塑料本体各留余量而已，
 *   真实板子上这种摆法随处可见），所以本页保留 2.54mm 摆法，
 *   并在 `scripts/check-modules.py` 的 `COURTYARD_EXCEPTIONS` 里**具名豁免**这两对。
 *   若改成 4mm 行距能消掉报错，但舵机头就跨不过三排了 —— 那等于放弃了本页的设计意图。
 *
 * ── 本页器件（3 个）─────────────────────────────────────────────────────
 *   J8 J9 J10（各 1×6 2.54mm 排针）
 *
 * ── 状态：器件放置完成，未接线 ──────────────────────────────────────────
 */
import { PAGES } from "../pages"

const SHEET: (typeof PAGES)[number]["name"] = "pwm"

/** 行距 = 2.54mm，正好让一个 3 脚舵机头横跨三排 */
const ROW_PITCH = 2.54

export const PwmSection = () => (
  <subcircuit name="PWM" schSheetName={SHEET}>
    {/* ══ 第 1 排：PWM 信号 ═════════════════════════════════════════════ */}
    <connector
      name="J8"
      footprint="jlcpcb:C37208"
      manufacturerPartNumber="2.54-1x6P"
      supplierPartNumbers={{ jlcpcb: ["C37208"] }}
      pinLabels={{
        pin1: "PWM1",
        pin2: "PWM2",
        pin3: "PWM3",
        pin4: "PWM4",
        pin5: "PWM5",
        pin6: "PWM6",
      }}
      pcbX={0}
      pcbY={ROW_PITCH}
      schX={0}
      schY={7}
    />

    {/* ══ 第 2 排：+5V ══════════════════════════════════════════════════ */}
    <connector
      name="J9"
      footprint="jlcpcb:C37208"
      manufacturerPartNumber="2.54-1x6P"
      supplierPartNumbers={{ jlcpcb: ["C37208"] }}
      pinLabels={{
        pin1: "P5V_1",
        pin2: "P5V_2",
        pin3: "P5V_3",
        pin4: "P5V_4",
        pin5: "P5V_5",
        pin6: "P5V_6",
      }}
      pinAttributes={{ P5V_1: { providesPower: true } }}
      pcbX={0}
      pcbY={0}
      schX={0}
      schY={0}
    />

    {/* ══ 第 3 排：GND ══════════════════════════════════════════════════ */}
    <connector
      name="J10"
      footprint="jlcpcb:C37208"
      manufacturerPartNumber="2.54-1x6P"
      supplierPartNumbers={{ jlcpcb: ["C37208"] }}
      pinLabels={{
        pin1: "GND1",
        pin2: "GND2",
        pin3: "GND3",
        pin4: "GND4",
        pin5: "GND5",
        pin6: "GND6",
      }}
      pinAttributes={{ GND1: { requiresGround: true } }}
      pcbX={0}
      pcbY={-ROW_PITCH}
      schX={0}
      schY={-7}
    />
  </subcircuit>
)
