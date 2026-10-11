/**
 * 串口 UART页 —— 要求 3
 *
 * 三路 UART，全部用 PH2.0 引出（3.3V / GND / TX / RX）
 *
 * 本页器件：

 *   J2  PH2.0 1x4  C5359601  USART1  PC4(TX) / PC5(RX)
 *   J3  PH2.0 1x4  C5359601  USART2  PA2(TX) / PA3(RX)
 *   J4  PH2.0 1x4  C5359601  USART3  PB10(TX) / PB11(RX)
 *
 * 分页方式：实现时用 <subcircuit name="UART" schSheetName="uart"> 包住，
 *           schSheetName 会整块继承给所有子元件（实测确认，见 pages.ts 注释）。
 *
 * 状态：**未实现**，暂时返回 null。
 *
 * ⚠️ 为什么不是直接写一个空的 <subcircuit>：实测 core 0.0.2119 下，
 *    空 <subcircuit> 单个还能构建，**多个同时存在必炸**
 *    （Error generating circuit JSON: TypeError: undefined is not an object
 *      (evaluating 'component.componentId')）。
 *     所以未实现的模块一律返回 null，实现后再换成 <subcircuit>。
 */
export const UartSection = () => null
