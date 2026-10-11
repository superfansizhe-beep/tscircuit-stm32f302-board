/**
 * SVG → PNG 转换工具
 *
 * 干什么：把 tscircuit 导出的 SVG（原理图 / PCB）转成 PNG，用来目视检查。
 *
 * 为什么需要它：`tsci export -f schematic-png` 不存在，而 `-f schematic-pdf`
 * 在本机实测会 Rust panic（`fatal runtime error: failed to initiate panic, error 5`）。
 * 但 `@resvg/resvg-js` 已经在 node_modules 里（CLI 的 pcb-png 走的就是它），所以直接用它。
 *
 * 用法（必须用 Bun 跑，且要在项目目录内）：
 *   export PATH="$HOME/Desktop/tscircuit/.tooling/bun/bin:$PATH"
 *   bun scripts/svg2png.ts <输入.svg> <输出.png> [宽度px]
 *
 * 例：
 *   bun scripts/svg2png.ts ../../out/stm32f302/main.sch.svg ../../out/stm32f302/main.sch.png 1600
 */
import { Resvg } from "@resvg/resvg-js"
import { readFileSync, writeFileSync } from "node:fs"

const [, , src, dst, widthArg] = process.argv

if (!src || !dst) {
  console.error("用法: bun scripts/svg2png.ts <输入.svg> <输出.png> [宽度px]")
  process.exit(1)
}

const width = Number(widthArg) || 1600
const svg = readFileSync(src, "utf8")

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: width },
  // 原理图底色是浅色，显式给白底避免透明背景在预览器里发黑
  background: "#ffffff",
})

writeFileSync(dst, resvg.render().asPng())
console.log(`已写出 ${dst}（宽 ${width}px）`)
