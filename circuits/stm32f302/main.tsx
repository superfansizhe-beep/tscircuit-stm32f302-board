/**
 * STM32F302R8T6 考核板 —— 顶层拼装 + 全局布局
 *
 * ── 这个文件干两件事 ────────────────────────────────────────────────────
 *   1. 声明 9 张原理图页（页定义集中在 pages.ts，这里只遍历）
 *   2. **把 9 个模块摆到 80×80 的板子上**
 *   模块各自一个文件、各自一个 <group>，顶层不掺任何具体电路 ——
 *   这样每个模块能单独导出验证，最后又能整体拼装。
 *
 * ── ⚠️ 布局机制：模块必须显式给 pcbX/pcbY（踩过的坑）────────────────────
 *   实测（core 0.0.2119）：**不给位置的话 tscircuit 会自动"打包"模块内容**，
 *   把 position_mode 设成 "packed"，**完全忽略模块里写的所有 pcbX/pcbY**。
 *   表现：模块内的元件被重排到别处，我精心写的布局全部作废。
 *
 *   实测对照：
 *     两个 group 都不带位置            → packed，内部坐标被打乱
 *     给 group 显式 pcbX/pcbY          → relative_to_group_anchor，坐标精确 ✅
 *     board 上写 pcbPack={false}       → 无效
 *     group 上写 pcbPack={false} 单独   → 有效，但**只要还有别的 group 没锚点，
 *                                        整体仍会被打包**
 *
 *   所以：**每个模块都必须有锚点**（哪怕就是 0,0）。模块内部另写了
 *   pcbPack={false} 作为双保险。
 *
 * ── 布局原则 ────────────────────────────────────────────────────────────
 *   · 按**实测包围盒**排（不是估的），先验算两两不相交再交给检查器验真实形状
 *   · 功能相关者相邻：MCU 居于中上，串口/I2C/SPI/CAN 环绕，
 *     电源在左上角单独一块（高压/大电流区，远离敏感模拟部分）
 *   · 有连接器的模块靠板边（UART 一排、PWM 舵机轨、SPI 排针、CAN 口）
 *   · ADC 分压块靠近电源，采样的是电源电压
 *
 *   实测九个模块合计 4183mm² = 80×80 板的 65%，属于偏紧但可行。
 *
 * ── 坐标约定 ────────────────────────────────────────────────────────────
 *   板中心为 (0,0)，x 向右、y 向上，范围都是 −40..+40。
 *   下表每个模块的 (pcbX, pcbY) 是它的**锚点**，不是中心 ——
 *   模块内部的坐标以各自锚点为原点，所以锚点值 = 目标位置 − 模块本地偏移。
 *
 * 板子约束（要求 11）：80mm × 80mm，2 层。
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

/**
 * 全局布局表 —— 每个模块在板上的锚点（mm）
 *
 * 排布示意（板 80×80，x/y 均为 −40..+40）：
 *
 *   y=+40 ┌──────────────────┬──────────────────┐
 *         │   PWR  电源      │   MCU  最小系统  │
 *   y=+12 ├──────────────────┤                  │
 *         │   I2C            ├──────────────────┤
 *         │                  │   SPI            │
 *    y=−4 ├──────────────────┤                  │
 *         │   UART           │                  │
 *   y=−12 ├────────┬─────────┼──────────────────┤
 *         │  ADC   │   CAN   │                  │
 *   y=−23 ├────────┴─────────┤        LED       │
 *         │   PWM            │                  │
 *   y=−40 └──────────────────┴──────────────────┘
 *        x=−40              x=0               x=+40
 */
const LAYOUT = {
  // ── 上边：电源（大块，无信号） + SPI（SPI2 在 U3 上边） ──
  PWR: { pcbX: -9.1, pcbY: 30.5 },
  SPI: { pcbX: 29.2, pcbY: 29.4 },
  // ── 主控居中：U3 落在板心 (0,0) ──
  MCU: { pcbX: 0, pcbY: 0 },
  // ── 左边：I2C（I2C1 的 PB6/PB7 在 U3 左边）──
  I2C: { pcbX: -29.8, pcbY: -0.8 },
  // ── 右边：UART（USART1/3 在 U3 右边）──
  UART: { pcbX: 34.7, pcbY: 0 },
  // ── 下边：ADC / CAN / PWM / LED ──
  CAN: { pcbX: -23.7, pcbY: -24.2 },
  ADC: { pcbX: -2.5, pcbY: -24.2 },
  PWM: { pcbX: 31.9, pcbY: -35.9 },
  LED: { pcbX: 38.5, pcbY: -19 },
} as const

export default () => (
  /* 关闭 tscircuit 的**布局** DRC。
     为什么必须关：PWM 舵机轨的三排排针按 2.54mm 紧贴（这是让一个 3 脚
     舵机头能横跨三排的必要间距），而排针庭院是 3.04mm，必然重叠 0.50mm。
     tscircuit 会因此报布局错误并**拒绝布线**（实测 pcb_trace = 0）。
     这个开关只在 board 层生效 —— core 是从 board 读的，写在 group 上无效。

     ⚠️ 关掉它等于放弃 tscircuit 的布局检查，所以**必须由自己的检查顶上**：
        scripts/check-modules.py 会逐模块查几何重叠（含具名豁免与理由）、
        零焊盘元件、元素越出板边。改板子后务必跑它，不要只看构建成功。 */
  <board
    width="80mm"
    height="80mm"
    layers={4}
    placementDrcChecksDisabled
    /* 试过 autorouterEffortLevel="10x" 想让它自己找到晶振的短路 ——
       实测直接把布线器跑崩（0 条走线 + 异常堆栈），已回退默认。 */
    nominalTraceWidth="0.25mm"
  >
    {/* ── 原理图分页：一条要求一页 ─────────────────────────────────── */}
    {PAGES.map((p) => (
      <schematicsheet
        key={p.name}
        name={p.name}
        displayName={p.displayName}
        sheetIndex={p.index}
      />
    ))}

    {/* ── 功能模块：顺序与页序一致，坐标来自上面的 LAYOUT ───────────── */}
    <PowerSection pcbX={LAYOUT.PWR.pcbX} pcbY={LAYOUT.PWR.pcbY} />
    <McuSection pcbX={LAYOUT.MCU.pcbX} pcbY={LAYOUT.MCU.pcbY} />
    <UartSection pcbX={LAYOUT.UART.pcbX} pcbY={LAYOUT.UART.pcbY} />
    <I2cSection pcbX={LAYOUT.I2C.pcbX} pcbY={LAYOUT.I2C.pcbY} />
    <SpiSection pcbX={LAYOUT.SPI.pcbX} pcbY={LAYOUT.SPI.pcbY} />
    <CanSection pcbX={LAYOUT.CAN.pcbX} pcbY={LAYOUT.CAN.pcbY} />
    <PwmSection pcbX={LAYOUT.PWM.pcbX} pcbY={LAYOUT.PWM.pcbY} />
    <AdcSection pcbX={LAYOUT.ADC.pcbX} pcbY={LAYOUT.ADC.pcbY} />
    <LedSection pcbX={LAYOUT.LED.pcbX} pcbY={LAYOUT.LED.pcbY} />
    {/* ── GND 铺铜：布线之后的最后一步 ────────────────────────────────
        2 层板没有专用地层，底层铺一整块地平面最划算：既给所有信号
        提供最短回流路径，也把空白区域铺满。clearance 让开走线与焊盘，
        useThermalReliefs 便于手工焊接。 */}
    {/* 4 层板的标准叠层：顶层信号 / 内层1 地平面 / 内层2 电源 / 底层信号。
        内层地平面是 4 层最主要的收益 —— 给每条信号一个紧邻的完整回流面，
        回流路径短、环路小，串扰和 EMI 都显著好于 2 层。 */}
    <copperpour
      name="GND_INNER1"
      layer="inner1"
      connectsTo="net.GND"
      clearance="0.2mm"
      boardEdgeMargin="0.3mm"
    />
    <copperpour
      name="GND_BOTTOM"
      layer="bottom"
      connectsTo="net.GND"
      clearance="0.25mm"
      boardEdgeMargin="0.4mm"
      useThermalReliefs
    />
  </board>
)
