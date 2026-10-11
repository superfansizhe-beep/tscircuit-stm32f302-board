/**
 * 指示灯页 —— 要求 9
 *
 * 三路 GPIO 驱动的 LED 指示灯
 *
 * ── 本页只用 LedIndicator 零件 ──────────────────────────────────────────
 *   三个指示灯完全同构，直接复用 `parts/led.tsx` 的 LedIndicator。
 *   连 LED 极性这个最容易写错的点也不在本页出现 —— 极性查表在 parts/codes.ts。
 *
 * ── 接线方向（LedIndicator 固定）────────────────────────────────────────
 *   net.LEDx → 限流电阻 → LED 阳极 ; LED 阴极 → GND
 *   即**高电平点亮**（GPIO 拉电流）。"高=亮"符合直觉，调试时不会因忘记取反而误判。
 *
 *   ⚠️ 跨界连接：本页用的是 net.LED1/2/3，这三个网络在**最小系统页**那侧接到
 *      PC6 / PC7 / PC8。两页都写同一个网络名即自动连通 —— 这就是
 *      「电源/信号走命名网络」的跨页连接方式。
 *
 * ── 限流电阻怎么算的 ────────────────────────────────────────────────────
 *   R = (V3_3 − Vf) / I = (3.3 − 2.1) / 0.0012 ≈ 1kΩ
 *   取 1kΩ → 约 1.2mA。现代 0603 绿光 LED 在 1~2mA 下已经很亮，
 *   比常见的 10~20mA 省一个数量级，也减轻 GPIO 负担。
 *
 * ── 本页器件（6 个）─────────────────────────────────────────────────────
 *   LED1–LED3（0603 绿 NCD0603G1）+ R36 R37 R38（1k）
 *
 * ── 状态：器件放置 + 接线 完成 ──────────────────────────────────────────
 */
import { PAGES } from "../pages"
import { LedIndicator } from "../parts/led"
import { NET } from "../nets"

const SHEET: (typeof PAGES)[number]["name"] = "led"

/** 三路：位号、接的 GPIO 网络、PCB 与原理图坐标 */
const CHANNELS = [
  { led: "LED1", res: "R36", gpio: NET.GPIO_LED1, pcbY: 0, schY: 4 },
  { led: "LED2", res: "R37", gpio: NET.GPIO_LED2, pcbY: -5, schY: 0 },
  { led: "LED3", res: "R38", gpio: NET.GPIO_LED3, pcbY: -10, schY: -4 },
] as const

export const LedSection = () => (
  <group name="LED" schSheetName={SHEET}>
    {CHANNELS.map((ch) => (
      <LedIndicator
        key={ch.led}
        res={ch.res}
        led={ch.led}
        color="green"
        resistance="1k"
        supply={ch.gpio}
        pcbX={-8}
        pcbY={ch.pcbY}
        schX={-5}
        schY={ch.schY}
      />
    ))}
  </group>
)
