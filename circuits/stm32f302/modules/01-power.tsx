/**
 * 电源页 —— 要求 1
 *
 * 12V→5V→3.3V 电源转换 + 手动开关 + XT30 输入 + 三颗电源指示灯
 *
 * 本页器件：

 *   U1  RY8411 SOT-23-6        C2935411  12V→5V 同步降压
 *   U2  TLV75733PDBVR SOT-23-5  C485517   5V→3.3V LDO
 *   L1  CKCSA4020-4.7µH 4x4mm   C354583   降压功率电感
 *   D1~D3 电源指示灯（12V 红 / 5V 绿 / 3.3V 蓝）
 *   SW1 SS-12F44-G5 拨动开关     C136718   12V 输入总开关
 *   J1  XT30UPB-M               C428721   电源输入座
 *   C1~C8 输入/输出/储能电容
 *
 * 分页方式：实现时用 <subcircuit name="PWR" schSheetName="power"> 包住，
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
export const PowerSection = () => null
