/**
 * 指示灯页 —— 要求 9
 *
 * 三路 GPIO 驱动的 LED 指示灯
 *
 * ── 本页拓扑（灌/拉电流方向在这里定死）─────────────────────────────────
 *   PC6 → R36 → LED1.阳极 ; LED1.阴极 → GND
 *   PC7 → R37 → LED2.阳极 ; LED2.阴极 → GND
 *   PC8 → R38 → LED3.阳极 ; LED3.阴极 → GND
 *
 *   采用**高电平点亮**（GPIO 拉电流）。选它而不是低电平点亮的原因：
 *   STM32 的推挽输出拉电流能力与灌电流接近，而"高=亮"符合直觉，
 *   调试时不会因为忘记取反而误判。接线阶段按这个方向接。
 *
 * ── 限流电阻怎么算的 ────────────────────────────────────────────────────
 *   R = (V3_3 − Vf) / I = (3.3 − 2.1) / 0.0012 ≈ 1kΩ
 *   取 1kΩ → 约 1.2mA。现代 0603 绿光 LED 在 1~2mA 下已经很亮，
 *   比常见的 10~20mA 省一个数量级，也减轻 GPIO 负担。
 *
 * ── ⚠️ LED 极性：绿色 C84267 是 pin1=阴极 ───────────────────────────────
 *   实测（tscircuit 的供应商数据比对）发现同一批 0603 LED 的极性约定**不统一**：
 *     红色 C2286  → pin1 = 阳极
 *     绿色 C84267 → pin1 = **阴极**
 *     蓝色 C84266 → pin1 = **阴极**
 *   所以三颗的 pinLabels 必须分别写对，套用同一个约定会让 LED 焊反不亮。
 *   电源页的 D1/D2/D3 已按同样规则处理。
 *
 * ── 本页器件（6 个）─────────────────────────────────────────────────────
 *   LED1–LED3（0603 绿）+ R36 R37 R38
 *
 * ── 状态：器件放置完成，未接线 ──────────────────────────────────────────
 */
import { PAGES } from "../pages"

const SHEET: (typeof PAGES)[number]["name"] = "led"

/** 三路 LED 流水：位号、PCB 坐标、原理图坐标 */
const CHANNELS = [
  { led: "LED1", res: "R36", pcbY: 0, schY: 4 },
  { led: "LED2", res: "R37", pcbY: -5, schY: 0 },
  { led: "LED3", res: "R38", pcbY: -10, schY: -4 },
] as const

export const LedSection = () => (
  <subcircuit name="LED" schSheetName={SHEET}>
    {CHANNELS.map((ch) => (
      <group key={ch.led}>
        {/* 限流电阻 */}
        <resistor
          name={ch.res}
          resistance="1k"
          footprint="0603"
          supplierPartNumbers={{ jlcpcb: ["C21190"] }}
          pcbX={-8}
          pcbY={ch.pcbY}
          schX={-8}
          schY={ch.schY}
        />
        {/* 指示灯（绿色 NCD0603G1；pin1 = 阴极，实测确认） */}
        <led
          name={ch.led}
          color="green"
          footprint="jlcpcb:C84267"
          supplierPartNumbers={{ jlcpcb: ["C84267"] }}
          pinLabels={{ pin1: "cathode", pin2: "anode" }}
          pcbX={-4}
          pcbY={ch.pcbY}
          schX={-4}
          schY={ch.schY}
        />
      </group>
    ))}
  </subcircuit>
)
