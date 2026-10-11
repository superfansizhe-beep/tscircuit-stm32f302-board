/**
 * CAN页 —— 要求 6
 *
 * 一路 CAN：TCAN332 收发器 + PH2.0 引出
 *
 * 本页器件：

 *   U7  TCAN332DR SOIC-8  C73651    CAN 收发器（注意是 3.3V 器件）
 *   J7  PH2.0 1x3         C5359600   CANH / CANL / GND
 *   R  120Ω 终端电阻 ×1
 *
 * 分页方式：实现时用 <subcircuit name="CAN" schSheetName="can"> 包住，
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
export const CanSection = () => null
