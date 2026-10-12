/**
 * PWM页 —— 要求 7
 *
 * 六路 PWM 输出，三排平行紧贴的「舵机轨」
 *
 * ── 题面这句话怎么解的 ──────────────────────────────────────────────────
 *   原文：「六路 PWM 输出，使用 3个1×6 排针，三排分别为 PWM、5V、GND
 *          （建议搜搜看pwm排针是怎么摆放的）」
 *
 *   做法：3 个 1×6 排针**平行、紧贴、行距 2.54mm** 摆放
 *
 *           列1    列2    列3    列4    列5    列6
 *   第1排  PWM1   PWM2   PWM3   PWM4   PWM5   PWM6    ← J8，整排 PWM 信号
 *   第2排  +5V    +5V    +5V    +5V    +5V    +5V     ← J9，整排 5V
 *   第3排  GND    GND    GND    GND    GND    GND     ← J10，整排地
 *
 *   为什么同时满足字面与惯例：
 *     · 横着看 → 三排分别是 PWM / 5V / GND，**完全符合题面字面**
 *     · 竖着看 → 每列跨三排 = 一个标准 3 脚舵机接口，脚序 信号→电源→地，
 *                与题面给出的顺序一字不差，正是题面提示的行业惯例
 *   所以不必在「按信号分排」和「按通道分组」之间二选一。
 *
 * ── 引脚分配（见 PINMAP.md）─────────────────────────────────────────────
 *   PWM1 PC0(脚8) TIM1_CH1   PWM2 PC1(脚9)  TIM1_CH2
 *   PWM3 PC2(脚10) TIM1_CH3  PWM4 PC3(脚11) TIM1_CH4
 *   PWM5 PA6(脚22) TIM16_CH1 PWM6 PA7(脚23) TIM17_CH1
 *   前四路在 TIM1 上物理相邻，后两路 PA6/PA7 相邻，走线天然成排。
 *
 * ── ⚠️ 一个故意的 DRC 例外（必须知情）──────────────────────────────────
 *   排针本体 2.54mm，但**庭院是 3.04mm**（本体外各 ~0.25mm 通用余量）。
 *   三排按 2.54mm 紧贴必然让相邻庭院**重叠 0.50mm**，tscircuit 报
 *   pcb_courtyard_overlap_error。
 *   这是舵机轨的必然结果、且物理无害（真实板子上极常见），故保留 2.54mm，
 *   并在 scripts/check-modules.py 的 COURTYARD_EXCEPTIONS 里**具名豁免**。
 *   改成 4mm 行距能消掉报错，但舵机头就跨不过三排了 —— 那等于放弃本页设计意图。
 *
 * ── 本页器件（3 个）─────────────────────────────────────────────────────
 *   J8 J9 J10（各 1×6 2.54mm 排针）
 *
 * ── 状态：器件放置 + 接线 完成 ──────────────────────────────────────────
 */
import { Fragment } from "react"
import { PAGES } from "../pages"
import { NET } from "../nets"

const SHEET: (typeof PAGES)[number]["name"] = "pwm"

/** 行距 = 2.54mm，正好让一个 3 脚舵机头横跨三排 */
const ROW_PITCH = 2.54

/** 1×6 2.54mm 排针（不是 PH2.0），单独写一个薄封装 */
const Header1x6 = (props: {
  ref: string
  pinLabels: Record<string, string>
  powerPins?: string[]
  groundPins?: string[]
  pcbY: number
  schY: number
}) => {
  const attrs: Record<string, { providesPower?: boolean; requiresGround?: boolean }> = {}
  for (const p of props.powerPins ?? []) attrs[p] = { providesPower: true }
  for (const p of props.groundPins ?? []) attrs[p] = { requiresGround: true }
  return (
    <connector
      name={props.ref}
      footprint="jlcpcb:C37208"
      manufacturerPartNumber="2.54-1x6P"
      supplierPartNumbers={{ jlcpcb: ["C37208"] }}
      pinLabels={props.pinLabels}
      pinAttributes={attrs}
      pcbX={0} pcbY={props.pcbY} schX={0} schY={props.schY}
    />
  )
}

const PWM_PINS = { pin1: "PWM1", pin2: "PWM2", pin3: "PWM3", pin4: "PWM4", pin5: "PWM5", pin6: "PWM6" } as const
const P5V_PINS = { pin1: "P5V_1", pin2: "P5V_2", pin3: "P5V_3", pin4: "P5V_4", pin5: "P5V_5", pin6: "P5V_6" } as const
const GND_PINS = { pin1: "GND1", pin2: "GND2", pin3: "GND3", pin4: "GND4", pin5: "GND5", pin6: "GND6" } as const

const PWM_NETS = [NET.PWM1, NET.PWM2, NET.PWM3, NET.PWM4, NET.PWM5, NET.PWM6] as const

export const PwmSection = (props: { pcbX?: number; pcbY?: number }) => (
  <group name="PWM" schSheetName={SHEET} pcbPack={false} pcbX={props.pcbX} pcbY={props.pcbY}>
    <Header1x6 ref="J8" pinLabels={PWM_PINS} pcbY={ROW_PITCH} schY={7} />
    <Header1x6 ref="J9" pinLabels={P5V_PINS} powerPins={["P5V_1"]} pcbY={0} schY={0} />
    <Header1x6 ref="J10" pinLabels={GND_PINS} groundPins={["GND1"]} pcbY={-ROW_PITCH} schY={-7} />

    {/* 第 1 排：六路 PWM 各自接到 MCU 定时器通道（最小系统页） */}
    {PWM_NETS.map((net, i) => (
      <Fragment key={net}>
        <trace name={`J8_PWM${i + 1}`} from={`J8.PWM${i + 1}`} to={net} />
      </Fragment>
    ))}

    {/* 第 2 排：六个脚全部接 +5V（竖看每列就是舵机头的电源脚） */}
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Fragment key={`p5v${i}`}>
        <trace name={`J9_5V_${i}`} from={`J9.P5V_${i}`} to={NET.V5} />
      </Fragment>
    ))}

    {/* 第 3 排：六个脚全部接地 */}
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Fragment key={`gnd${i}`}>
        <trace name={`J10_GND_${i}`} from={`J10.GND${i}`} to={NET.GND} />
      </Fragment>
    ))}
  </group>
)
