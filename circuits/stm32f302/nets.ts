/**
 * 网络注册表 —— 全工程唯一权威
 *
 * 为什么必须集中定义：跨页连接**完全靠网络名字符串相同**。
 * 写错一个字符（UART1_TX vs UART1_RX、I2C1_SCL vs I2C1_SDA）
 * tscircuit **不会报错**，只会把一条网络静默拆成两条互不相连的网络 ——
 * 电气上等于两根线各自悬空，而原理图和 PCB 看起来都"正常"。
 * 这是本项目最难查的一类错误，所以网络名只在本文档里出现一次。
 *
 * 命名约束（tscircuit）：网络名必须以字母或下划线开头，只能含字母/数字/下划线。
 * 所以不能用 "+5V" / "3V3" 这类写法，写成 V5 / V3_3。
 *
 * 跨页连接方式：一条网络的两端分别写在两个模块里，两边都引用同一个 NET.X，
 * 即自动连通 —— 不需要任何显式的"跨页连线"语句。
 */

export const NET = {
  // ── 电源轨（电源页产生，其余八页消费）──────────────────────────────
  /** 12V 输入（XT30 进来、经总开关之后） */
  V12: "net.V12",
  /** 降压输出 */
  V5: "net.V5",
  /** LDO 输出 */
  V3_3: "net.V3_3",
  /** 地 */
  GND: "net.GND",
  /** 模拟电源（经磁珠从 3.3V 隔离出来，供 VDDA / VREF+） */
  VDDA: "net.VDDA",

  // ── 电源页内部中间节点 ──────────────────────────────────────────────
  /** RY8411 开关节点（接电感） */
  SW: "net.SW",
  /** 反馈分压中点 */
  FB: "net.FB",

  // ── 复位与启动（最小系统页）────────────────────────────────────────
  NRST: "net.NRST",
  BOOT0: "net.BOOT0",

  // ── HSE 8MHz 晶振（最小系统页）─────────────────────────────────────
  HSE_IN: "net.HSE_IN",
  HSE_OUT: "net.HSE_OUT",

  // ── 三路串口（最小系统页 ↔ 串口页）────────────────────────────────
  UART1_TX: "net.UART1_TX",
  UART1_RX: "net.UART1_RX",
  UART2_TX: "net.UART2_TX",
  UART2_RX: "net.UART2_RX",
  UART3_TX: "net.UART3_TX",
  UART3_RX: "net.UART3_RX",

  // ── 三路 I2C（最小系统页 ↔ I2C 页）─────────────────────────────────
  I2C1_SCL: "net.I2C1_SCL",
  I2C1_SDA: "net.I2C1_SDA",
  I2C2_SCL: "net.I2C2_SCL",
  I2C2_SDA: "net.I2C2_SDA",
  I2C3_SCL: "net.I2C3_SCL",
  I2C3_SDA: "net.I2C3_SDA",

  // ── 两路 SPI（最小系统页 ↔ SPI 页）────────────────────────────────
  SPI2_SCK: "net.SPI2_SCK",
  SPI2_MISO: "net.SPI2_MISO",
  SPI2_MOSI: "net.SPI2_MOSI",
  SPI2_CS: "net.SPI2_CS",
  SPI3_SCK: "net.SPI3_SCK",
  SPI3_MISO: "net.SPI3_MISO",
  SPI3_MOSI: "net.SPI3_MOSI",
  SPI3_CS: "net.SPI3_CS",

  // ── CAN（最小系统页 ↔ CAN 页）──────────────────────────────────────
  CAN_TX: "net.CAN_TX",
  CAN_RX: "net.CAN_RX",

  // ── 六路 PWM（最小系统页 ↔ PWM 页）────────────────────────────────
  PWM1: "net.PWM1",
  PWM2: "net.PWM2",
  PWM3: "net.PWM3",
  PWM4: "net.PWM4",
  PWM5: "net.PWM5",
  PWM6: "net.PWM6",

  // ── 三路 ADC 采样（最小系统页 ↔ ADC 页）───────────────────────────
  ADC_12V: "net.ADC_12V",
  ADC_5V: "net.ADC_5V",
  ADC_3V3: "net.ADC_3V3",

  // ── 三路 GPIO 指示灯（最小系统页 ↔ 指示灯页）──────────────────────
  // ⚠️ 名字特意加 GPIO_ 前缀：网络名不能与位号重名。
  //    指示灯页的元件位号就叫 LED1/2/3，若网络也叫 LED1/2/3，
  //    tscircuit 会报 'Multiple immediate children found with name "LED1"'。
  GPIO_LED1: "net.GPIO_LED1",
  GPIO_LED2: "net.GPIO_LED2",
  GPIO_LED3: "net.GPIO_LED3",

  // ── CAN 总线侧（CAN 页内部）────────────────────────────────────────
  CANH: "net.CANH",
  CANL: "net.CANL",

  // ── MCP23S17 复位（SPI 页内部，由 R26 上拉）────────────────────────
  MCP_RESET: "net.MCP_RESET",

  // ── 调试口（最小系统页 ↔ SWD 排针，同页）──────────────────────────
  SWDIO: "net.SWDIO",
  SWCLK: "net.SWCLK",
} as const

export type NetName = (typeof NET)[keyof typeof NET]
