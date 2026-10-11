/**
 * 指示灯页 —— 要求 9
 *
 * 三路 GPIO 驱动的 LED 指示灯
 *
 * 本页器件：

 *   LED1  PC6 (脚37)  NCD0603G1  C84267  绿
 *   LED2  PC7 (脚38)  NCD0603G1  C84267  绿
 *   LED3  PC8 (脚39)  NCD0603G1  C84267  绿
 *   R  限流电阻 ×3
 *
 * 分页方式：实现时用 <subcircuit name="LED" schSheetName="led"> 包住，
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
export const LedSection = () => null
