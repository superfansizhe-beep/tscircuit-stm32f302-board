/**
 * I2C页 —— 要求 4
 *
 * 三路 I2C：EEPROM / 温度传感器 / 对外引出
 *
 * 本页器件：

 *   U4  AT24C64D-SSHM-T SOIC-8  C6487     64Kb EEPROM   ← I2C1 PB6/PB7
 *   U5  TMP1075DGKR VSSOP-8     C2864807  温度传感器     ← I2C2 PA9/PA10
 *   J5  PH2.0 1x4               C5359601  对外引出       ← I2C3 PA8/PC9
 *   R 三组 I2C 上拉电阻（每组 SCL/SDA 各一）
 *
 * 分页方式：实现时用 <subcircuit name="I2C" schSheetName="i2c"> 包住，
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
export const I2cSection = () => null
