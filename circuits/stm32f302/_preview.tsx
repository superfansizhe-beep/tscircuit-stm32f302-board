/**
 * 单页预览工具 —— 一次性工具，不是成品电路
 *
 * 干什么：只渲染**一个模块**及其对应的一页原理图，用于放大检查细节。
 *
 * 为什么需要它：`main.tsx` 会把 9 页垂直堆叠成一张 1000×6743 的
 * `tscircuit-stacked-schematic`，缩略图里每页只剩一百多像素高，看不清。
 * 想看某一页的真实效果，就得单独渲染。
 *
 * 用法：把下面 PREVIEW / SHEET_NAME / SHEET_DISPLAY_NAME 换成要看的模块，然后
 *   export PATH="$HOME/Desktop/tscircuit/.tooling/bun/bin:$PATH"
 *   ./tsci-run export circuits/stm32f302/_preview.tsx -f schematic-svg -o ../../out/stm32f302/preview.sch.svg
 *   bun scripts/svg2png.ts ../../out/stm32f302/preview.sch.svg /tmp/preview.png 1800
 *
 * 注意：原理图 SVG 的处理方式不同 ——
 *   单页图 → resvg（scripts/svg2png.ts）正常
 *   多页堆叠图 → resvg 会 panic，只能走 macOS 的 qlmanage
 */
import { PAGES } from "./pages"
import { LedSection } from "./modules/09-led"

// 当前预览：指示灯页
const SHEET_NAME: (typeof PAGES)[number]["name"] = "led"
const SHEET_DISPLAY_NAME = "指示灯"
const PREVIEW = <LedSection />

export default () => (
  <board width="80mm" height="80mm" layers={2}>
    <schematicsheet name={SHEET_NAME} displayName={SHEET_DISPLAY_NAME} sheetIndex={1} />
    {PREVIEW}
  </board>
)
