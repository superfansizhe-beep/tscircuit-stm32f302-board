/**
 * STM32F302R8T6 考核板 —— 顶层拼装
 *
 * 干什么：把 9 个功能模块拼成一块板，并声明 9 张原理图页。
 * 为什么这么写：
 *   - 模块各自一个文件、各自一个 <subcircuit>；顶层只做"摆放"和"声明页"，
 *     不掺任何具体电路 —— 这样每个模块能单独导出验证，最后又能整体拼装。
 *   - 页定义集中在 pages.ts，这里只遍历，避免页名写串（写串了元件会悄悄落到默认页）。
 *   - 模块的 schSheetName 写在各自模块里（继承给子元件），顶层不管分页。
 *
 * 实测确认（core 0.0.2119）：
 *   - <schematicsheet> 声明分页，schematic-svg 导出会垂直堆叠成一张总图
 *   - <subcircuit pcbX pcbY> 能把整块模块在 PCB 上整体平移
 *
 * 板子约束（要求 11）：80mm × 80mm，2 层。
 *
 * 状态：骨架 —— 9 个模块均为空壳，PCB 摆放待定（模块内元件坐标以各自原点为准）。
 */
import { PAGES } from "./pages"

import { PowerSection } from "./modules/01-power"
import { McuSection } from "./modules/02-mcu"
import { UartSection } from "./modules/03-uart"
import { I2cSection } from "./modules/04-i2c"
import { SpiSection } from "./modules/05-spi"
import { CanSection } from "./modules/06-can"
import { PwmSection } from "./modules/07-pwm"
import { AdcSection } from "./modules/08-adc"
import { LedSection } from "./modules/09-led"

export default () => (
  <board width="80mm" height="80mm" layers={2}>
    {/* ── 原理图分页：一条要求一页 ─────────────────────────────────── */}
    {PAGES.map((p) => (
      <schematicsheet key={p.name} name={p.name} displayName={p.displayName} sheetIndex={p.index} />
    ))}

    {/* ── 功能模块：顺序与页序一致 ─────────────────────────────────── */}
    <PowerSection />
    <McuSection />
    <UartSection />
    <I2cSection />
    <SpiSection />
    <CanSection />
    <PwmSection />
    <AdcSection />
    <LedSection />
  </board>
)
