/**
 * ADC 采样页 —— 要求 8
 *
 * 三路 ADC 电压采样：12V / 5V / 3.3V 电源电压
 *
 * 本页器件：

 *   采样点  引脚        通道
 *   12V     PA0 (脚14)  ADC1_IN1   ← 分压网络
 *   5V      PA1 (脚15)  ADC1_IN2   ← 分压网络
 *   3.3V    PB0 (脚26)  ADC1_IN11  ← 分压网络
 *   R  分压电阻 ×6（含滤波电容）
 *
 * 分页方式：实现时用 <subcircuit name="ADC" schSheetName="adc"> 包住，
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
export const AdcSection = () => null
