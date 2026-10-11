/**
 * PWM页 —— 要求 7
 *
 * 六路 PWM 输出，三排平行紧贴的舵机轨
 *
 * 本页器件：

 *   J8  J9 J10  1x6 2.54mm 排针 ×3  C37208
 *     排列：3 个排针平行紧贴（行距 2.54mm）
 *           第1排 = PWM1~PWM6（PC0/PC1/PC2/PC3/PA6/PA7）
 *           第2排 = +5V × 6
 *           第3排 = GND × 6
 *     竖看每一列 = 一个标准 3 脚舵机接口（信号/电源/地）
 *
 * 分页方式：实现时用 <subcircuit name="PWM" schSheetName="pwm"> 包住，
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
export const PwmSection = () => null
