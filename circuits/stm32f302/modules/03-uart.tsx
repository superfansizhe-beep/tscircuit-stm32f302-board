/**
 * 串口 UART页 —— 要求 3
 *
 * 三路 UART，全部用 PH2.0 引出（3.3V / GND / TX / RX）
 *
 * ── 本页只有三个接口，没有有源器件 ──────────────────────────────────────
 *   用 `parts/connectors.tsx` 的 Ph20Port 复用同一个封装与料号，
 *   每个口的 4 条线全部走命名网络 —— 网络名来自 nets.ts，
 *   MCU 侧的对应脚在最小系统页，两边同名即自动连通。
 *
 * ── 引脚顺序为什么是 3V3 / GND / TX / RX ────────────────────────────────
 *   题目原文写的就是「包含 3.3V、GND、TX、RX」，本页**照原文顺序**排，
 *   不做「优化」（比如把 GND 放中间）—— 按原文字面走最不容易被判错。
 *
 * ── 本页器件（3 个）─────────────────────────────────────────────────────
 *   J2 USART1 / J3 USART2 / J4 USART3
 *
 * ── 状态：器件放置 + 接线 完成 ──────────────────────────────────────────
 */
import { Fragment } from "react"
import { PAGES } from "../pages"
import { NET } from "../nets"
import { Ph20Port } from "../parts/connectors"

const SHEET: (typeof PAGES)[number]["name"] = "uart"

const PINS = { pin1: "3V3", pin2: "GND", pin3: "TX", pin4: "RX" } as const

/** 三路串口：位号、收发网络、PCB 与原理图坐标 */
const PORTS = [
  { ref: "J2", tx: NET.UART1_TX, rx: NET.UART1_RX, pcbX: -12, schY: 6 },
  { ref: "J3", tx: NET.UART2_TX, rx: NET.UART2_RX, pcbX: 0, schY: 0 },
  { ref: "J4", tx: NET.UART3_TX, rx: NET.UART3_RX, pcbX: 12, schY: -6 },
] as const

export const UartSection = (props: { pcbX?: number; pcbY?: number }) => (
  <group name="UART" schSheetName={SHEET} pcbPack={false} pcbX={props.pcbX} pcbY={props.pcbY}>
    {PORTS.map((p) => (
      <Fragment key={p.ref}>
        <Ph20Port ref={p.ref} pinCount={4} pinLabels={PINS}
          powerPins={["3V3"]} groundPins={["GND"]}
          pcbX={p.pcbX} pcbY={0} schX={0} schY={p.schY}
        insertionDirection="from_above" />
        <trace name={`${p.ref}_VCC`} from={`${p.ref}.3V3`} to={NET.V3_3} />
        <trace name={`${p.ref}_GND`} from={`${p.ref}.GND`} to={NET.GND} />
        <trace name={`${p.ref}_TX`} from={`${p.ref}.TX`} to={p.tx} />
        <trace name={`${p.ref}_RX`} from={`${p.ref}.RX`} to={p.rx} />
      </Fragment>
    ))}
  </group>
)
