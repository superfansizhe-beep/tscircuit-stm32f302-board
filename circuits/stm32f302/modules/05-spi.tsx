/**
 * SPI页 —— 要求 5
 *
 * 两路 SPI：MCP23S17 扩 16 路 GPIO + 一路 PH2.0 引出
 *
 * 本页器件：

 *   U6  MCP23S17T-E/SS SSOP-28  C128577   SPI→16 路 GPIO  ← SPI2 PB12~PB15
 *   J12 2x8 2.54mm 排针          C68234    MCP23S17 的 16 路 GPIO 全部引出
 *   J6  PH2.0 1x6               C5359603  第二路 SPI 引出  ← SPI3 PC10~PC12 + PA4
 *
 * 分页方式：实现时用 <subcircuit name="SPI" schSheetName="spi"> 包住，
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
export const SpiSection = () => null
