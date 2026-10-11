/**
 * 最小系统页 —— 要求 2
 *
 * STM32F302R8T6 最小系统：8MHz 外部晶振 + RESET 按键 + BOOT 按键 + SWD 调试口 + 全套去耦
 * 题目明说「可以不用低速晶振」，所以**不装 LSE（32.768kHz）**，PC14/PC15 留空。
 *
 * ── 本页器件（20 个）────────────────────────────────────────────────────
 *   U3   STM32F302R8T6  LQFP-64       C504601   主控
 *   Y1   8MHz 无源晶振   SMD3225-4P    C400090   HSE（接 PF0 / PF1）
 *   SW2  RESET 按键      SMD-4P        C318884
 *   SW3  BOOT 按键       SMD-4P        C318884
 *   J11  SWD 调试口      2x5 2.54mm    C42431818
 *   FB1  磁珠 600Ω@100MHz 0603         C19330    VDDA 隔离（BLM18AG601SN1D）
 *   C10–C13  100nF ×4   0603   C14663   VDD 逐脚去耦
 *   C14      4.7µF      0603   C19666   VDD 总储能
 *   C15      1µF        0603   C15849   VDDA 滤波
 *   C16      10nF       0603   C1589    VDDA 高频
 *   C17      100nF      0603   C14663   VBAT 去耦
 *   C18 C19  12pF ×2    0603   C107034  晶振负载电容
 *   C20      100nF      0603   C14663   NRST 滤波
 *   R10      10k        0603   C25804   NRST 上拉
 *   R11      10k        0603   C25804   BOOT0 下拉
 *   R12      10k        0603   C25804   BOOT1(PB2) 下拉
 *
 * ── 晶振负载电容怎么算的（不是随手填 12pF）──────────────────────────────
 *   CL = C/2 + Cstray，Y1 规格 CL = 10pF，Cstray 取 ~4pF
 *   → C = 2 × (10 − 4) = 12pF。两颗都用 12pF。
 *
 * ── 引脚表从哪来 ────────────────────────────────────────────────────────
 *   64 条 pinLabels 由 ST 官方 STM32_open_pin_data 的 STM32F302R(6-8)Tx.xml
 *   **程序化生成**，不是手抄。同名端口在 PINMAP.md 里有完整分配。
 *
 * ── 坐标（实测标定）─────────────────────────────────────────────────────
 *   PCB：实测庭院尺寸 —— U3 是 13.99×13.99mm、按键 7.51×5.71mm、
 *        SWD 排针 13.23×5.58mm。间距按这些真实数字排，不靠感觉。
 *        本页约 **48 × 34 mm**（9 个模块里最大的一个）。
 *   原理图：可用区 x ∈ [−15.5, 15.5] / y ∈ [−10.8, 10.8]，不是 A4 的 297×210。
 *
 * ── 实测踩的坑 ──────────────────────────────────────────────────────────
 *   磁珠最初选 C1002（GZ1608D601TF），构建报成功但 **FB1 一个焊盘都没有** ——
 *   EasyEDA 库里没有这个元件的封装（external_footprint_load_error）。
 *   同系列的 C1003 也一样。改用 Murata BLM18AG601SN1D（C19330）后正常，2 个焊盘。
 *
 * ── 状态：器件放置完成，未接线 ──────────────────────────────────────────
 */
import { PAGES } from "../pages"

const SHEET: (typeof PAGES)[number]["name"] = "mcu"

/** 64 脚引脚名（ST 官方数据生成） */
const F302_PINS = {
        pin1: "VBAT",
        pin2: "PC13",
        pin3: "PC14",
        pin4: "PC15",
        pin5: "PF0",
        pin6: "PF1",
        pin7: "NRST",
        pin8: "PC0",
        pin9: "PC1",
        pin10: "PC2",
        pin11: "PC3",
        pin12: "VSSA",
        pin13: "VDDA",
        pin14: "PA0",
        pin15: "PA1",
        pin16: "PA2",
        pin17: "PA3",
        pin18: "VSS",
        pin19: "VDD",
        pin20: "PA4",
        pin21: "PA5",
        pin22: "PA6",
        pin23: "PA7",
        pin24: "PC4",
        pin25: "PC5",
        pin26: "PB0",
        pin27: "PB1",
        pin28: "PB2",
        pin29: "PB10",
        pin30: "PB11",
        pin31: "VSS",
        pin32: "VDD",
        pin33: "PB12",
        pin34: "PB13",
        pin35: "PB14",
        pin36: "PB15",
        pin37: "PC6",
        pin38: "PC7",
        pin39: "PC8",
        pin40: "PC9",
        pin41: "PA8",
        pin42: "PA9",
        pin43: "PA10",
        pin44: "PA11",
        pin45: "PA12",
        pin46: "PA13",
        pin47: "VSS",
        pin48: "VDD",
        pin49: "PA14",
        pin50: "PA15",
        pin51: "PC10",
        pin52: "PC11",
        pin53: "PC12",
        pin54: "PD2",
        pin55: "PB3",
        pin56: "PB4",
        pin57: "PB5",
        pin58: "PB6",
        pin59: "PB7",
        pin60: "BOOT0",
        pin61: "PB8",
        pin62: "PB9",
        pin63: "VSS",
        pin64: "VDD",
} as const

export const McuSection = () => (
  <subcircuit name="MCU" schSheetName={SHEET}>
    {/* ══ 主控 ═══════════════════════════════════════════════════════════ */}
    <chip
      name="U3"
      footprint="jlcpcb:C504601"
      manufacturerPartNumber="STM32F302R8T6"
      supplierPartNumbers={{ jlcpcb: ["C504601"] }}
      pinLabels={F302_PINS}
      pinAttributes={{
        VDD: { requiresPower: true },
        VDDA: { requiresPower: true },
        VSS: { requiresGround: true },
        VSSA: { requiresGround: true },
        NRST: { mustBeConnected: true },
        BOOT0: { mustBeConnected: true },
      }}
      pcbX={0} pcbY={0} schX={0} schY={0}
    />

    {/* ══ HSE 8MHz 晶振 + 12pF 负载电容 ═════════════════════════════════ */}
    <crystal name="Y1" frequency="8MHz" loadCapacitance="10pF" pinVariant="four_pin"
      footprint="jlcpcb:C400090"
      manufacturerPartNumber="TAXM8M4RDBCCT2T"
      supplierPartNumbers={{ jlcpcb: ["C400090"] }}
      pcbX={0} pcbY={12} schX={-6} schY={7} />
    <capacitor name="C18" capacitance="12pF" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C107034"] }}
      pcbX={-4.5} pcbY={12} schX={-10} schY={7} />
    <capacitor name="C19" capacitance="12pF" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C107034"] }}
      pcbX={4.5} pcbY={12} schX={-2} schY={7} />

    {/* ══ VDD 去耦：四颗 100nF 贴四角 + 一颗 4.7µF 总储能 ══════════════ */}
    <capacitor name="C10" capacitance="100nF" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      pcbX={-10} pcbY={9.5} schX={2} schY={7} />
    <capacitor name="C11" capacitance="100nF" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      pcbX={10} pcbY={9.5} schX={6} schY={7} />
    <capacitor name="C12" capacitance="100nF" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      pcbX={-10} pcbY={-9.5} schX={10} schY={7} />
    <capacitor name="C13" capacitance="100nF" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      pcbX={10} pcbY={-9.5} schX={-10} schY={-3} />
    <capacitor name="C14" capacitance="4.7uF" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C19666"] }}
      pcbX={-10} pcbY={0} schX={-6} schY={3} />

    {/* ══ VBAT 去耦 ═════════════════════════════════════════════════════ */}
    <capacitor name="C17" capacitance="100nF" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      pcbX={10} pcbY={0} schX={10} schY={3} />

    {/* ══ VDDA 隔离与滤波 ═══════════════════════════════════════════════ */}
    <chip name="FB1" footprint="jlcpcb:C19330"
      manufacturerPartNumber="BLM18AG601SN1D"
      supplierPartNumbers={{ jlcpcb: ["C19330"] }}
      pinLabels={{ pin1: "1", pin2: "2" }}
      pcbX={-14} pcbY={0} schX={-2} schY={3} />
    <capacitor name="C15" capacitance="1uF" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C15849"] }}
      pcbX={-14} pcbY={5} schX={2} schY={3} />
    <capacitor name="C16" capacitance="10nF" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C1589"] }}
      pcbX={-14} pcbY={-5} schX={6} schY={3} />

    {/* ══ RESET：上拉 + 滤波 ═══════════════════════════════════════════ */}
    <resistor name="R10" resistance="10k" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C25804"] }}
      pcbX={-14} pcbY={12} schX={-6} schY={-3} />
    <capacitor name="C20" capacitance="100nF" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      pcbX={-19} pcbY={12} schX={-2} schY={-3} />

    {/* ══ BOOT：BOOT0 下拉 + BOOT1(PB2) 下拉 ═══════════════════════════ */}
    <resistor name="R11" resistance="10k" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C25804"] }}
      pcbX={-19} pcbY={-9.5} schX={2} schY={-3} />
    <resistor name="R12" resistance="10k" footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C25804"] }}
      pcbX={-14} pcbY={-9.5} schX={6} schY={-3} />

    {/* ══ 按键 ═════════════════════════════════════════════════════════ */}
    <switch name="SW2" footprint="jlcpcb:C318884"
      manufacturerPartNumber="TS-1187A-B-A-B"
      pcbX={-10} pcbY={-16} schX={-10} schY={-7} />
    <switch name="SW3" footprint="jlcpcb:C318884"
      manufacturerPartNumber="TS-1187A-B-A-B"
      pcbX={0} pcbY={-16} schX={-6} schY={-7} />

    {/* ══ SWD 调试口 2x5 ═══════════════════════════════════════════════ */}
    <connector name="J11" footprint="jlcpcb:C42431818"
      manufacturerPartNumber="PZ2.54-2X5P-H25"
      supplierPartNumbers={{ jlcpcb: ["C42431818"] }}
      pcbX={20} pcbY={12} schX={10} schY={-3} />
  </subcircuit>
)
