/**
 * 最小系统页 —— 要求 2
 *
 * STM32F302R8T6 最小系统：晶振 / 复位 / BOOT / SWD / 全套去耦
 *
 * 本页器件：

 *   U3  STM32F302R8T6 LQFP-64   C504601   主控
 *   Y1  8MHz 无源晶振 SMD3225   C400090   HSE（PF0/PF1）
 *   SW2 SW3 TS-1187A 轻触按键    C318884   RESET / BOOT
 *   J11 SWD 调试口 2x5 2.54mm   C42431818
 *   C 去耦：VDD×4 各 100nF + 4.7µF 总容 + VDDA 1µF/10nF + 晶振负载电容
 *
 * 分页方式：实现时用 <subcircuit name="MCU" schSheetName="mcu"> 包住，
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
export const McuSection = () => null
