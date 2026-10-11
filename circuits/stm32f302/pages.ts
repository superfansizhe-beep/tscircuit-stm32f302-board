/**
 * 原理图分页定义 —— 全工程唯一权威
 *
 * 为什么单独一个文件：页名同时被两处用到 —— main.tsx 里声明 <schematicsheet>，
 * 各模块里用 schSheetName 把元件挂到页上。两边必须逐字一致，否则元件会
 * 悄悄落到默认页而不报错。集中定义一次，模块里只引用常量。
 *
 * 分页策略：题目 11 条要求里，第 1~9 条是电路，各自独立成页（1:1 对应，
 * 便于按评分表逐条核对）；第 10、11 条是全局约束（封装 / 板子尺寸），不单独成页。
 *
 * 实测确认（core 0.0.2119）：
 *   - <schematicsheet> 支持 name / displayName / sheetIndex
 *   - schSheetName 放在 <subcircuit> 上会**整块继承**给所有子元件
 *   - schematic-svg 导出会把多页**垂直堆叠**成一张 tscircuit-stacked-schematic
 */
export const PAGES = [
  { name: "power", displayName: "电源", index: 1, requirement: "要求 1" },
  { name: "mcu", displayName: "最小系统", index: 2, requirement: "要求 2" },
  { name: "uart", displayName: "串口 UART", index: 3, requirement: "要求 3" },
  { name: "i2c", displayName: "I2C", index: 4, requirement: "要求 4" },
  { name: "spi", displayName: "SPI", index: 5, requirement: "要求 5" },
  { name: "can", displayName: "CAN", index: 6, requirement: "要求 6" },
  { name: "pwm", displayName: "PWM", index: 7, requirement: "要求 7" },
  { name: "adc", displayName: "ADC 采样", index: 8, requirement: "要求 8" },
  { name: "led", displayName: "指示灯", index: 9, requirement: "要求 9" },
] as const

export type PageName = (typeof PAGES)[number]["name"]
