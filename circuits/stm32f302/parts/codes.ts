/**
 * 元件料号表（值 → { 嘉立创 C 编号, 厂商型号 }）—— 全工程唯一权威
 *
 * 为什么单独一个文件：本项目已经**两次**因为随手写 C 编号而出错 ——
 *   · R5 反馈电阻写成 C25767，实际那是 0402 的 220kΩ，不是 0603 的 19.1kΩ
 *   · 120Ω 终端电阻凭印象写成 C20633，实查是 C22787
 * 两次都是「构建成功、元件也在，只是料号是错的」—— 最难看出来的那类错误。
 * 集中查表后，写电路时只需要给**值**，编号与厂商型号都由这张表兜底。
 *
 * 所有编号都经过嘉立创官方接口实查（不是从文档抄的）。
 */

export type Part = { jlc: string; mpn: string }

/** 0603 电阻 */
export const R0603 = {
  "120": { jlc: "C22787", mpn: "0603WAF1200T5E" }, //  120Ω   库存 239 万
  "330": { jlc: "C23138", mpn: "0603WAF3300T5E" }, //  330Ω
  "1k": { jlc: "C21190", mpn: "0603WAF1001T5E" }, //  1kΩ
  "4.7k": { jlc: "C23162", mpn: "0603WAF4701T5E" }, //  4.7kΩ
  "10k": { jlc: "C25804", mpn: "0603WAF1002T5E" }, //  10kΩ   嘉立创基础库
  "19.1k": { jlc: "C22897", mpn: "0603WAF1912T5E" }, //  19.1kΩ RY8411 反馈下分压
  "27k": { jlc: "C22967", mpn: "0603WAF2702T5E" }, //  27kΩ
  "33k": { jlc: "C4216", mpn: "0603WAF3302T5E" }, //  33kΩ
  "100k": { jlc: "C25803", mpn: "0603WAF1003T5E" }, //  100kΩ
} as const

/** 0603 电容 */
export const C0603 = {
  "10nF": { jlc: "C1589", mpn: "CL10B103KB8NNNC" }, //   50V X7R
  "100nF": { jlc: "C14663", mpn: "CC0603KRX7R9BB104" }, //   50V X7R  基础库
  "1uF": { jlc: "C15849", mpn: "CL10A105KB8NNNC" }, //   50V X5R
  "4.7uF": { jlc: "C19666", mpn: "CL10A475KO8NNNC" }, //   16V X5R
  "12pF": { jlc: "C107034", mpn: "CC0603JRNPO9BN120" }, //   50V NP0  晶振负载
} as const

/** 0805 电容（大容量在 0603 里耐压吃紧，放到 0805） */
export const C0805 = {
  "22uF": { jlc: "C45783", mpn: "CL21A226MAQNNNE" }, //   25V X5R
} as const

/**
 * 0603 LED：颜色 → { C 编号, 厂商型号, pin1 是什么 }
 *
 * ⚠️ 实测：同一批 0603 LED 的**极性约定并不统一** ——
 *     红色 pin1 = 阳极，而绿色/蓝色 pin1 = 阴极。
 *   套用同一个约定会让绿/蓝两颗焊反、不亮。
 *   把极性写进这张表，调用方就不可能再写错。
 */
export const LED0603 = {
  red: { jlc: "C2286", mpn: "KT-0603R", pin1: "anode" },
  green: { jlc: "C84267", mpn: "NCD0603G1", pin1: "cathode" },
  blue: { jlc: "C84266", mpn: "NCD0603B1", pin1: "cathode" },
} as const

/** 磁珠 0603 600Ω@100MHz 500mA */
export const FB_0603 = { jlc: "C19330", mpn: "BLM18AG601SN1D" } as const

/**
 * 一次给出 `manufacturerPartNumber` 与 `supplierPartNumbers` 两个属性。
 *
 * 用法：<resistor {...partProps(R0603["10k"])} ... />
 * 这样料号与厂商型号永远成对出现，不可能只填一个。
 */
export const partProps = (p: Part) => ({
  manufacturerPartNumber: p.mpn,
  supplierPartNumbers: { jlcpcb: [p.jlc] },
})
