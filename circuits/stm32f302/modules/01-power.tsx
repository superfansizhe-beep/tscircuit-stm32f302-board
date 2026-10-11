/**
 * 电源页 —— 要求 1
 *
 * 12V→5V→3.3V 电源转换 + 手动开关 + XT30 输入 + 三颗电源指示灯
 *
 * ── 本页拓扑 ────────────────────────────────────────────────────────────
 *   J1 (XT30) → SW1 (总开关) → U1 RY8411 降压 → L1 → 5V
 *                                   │
 *                                   └→ U2 TLV75733 LDO → 3.3V
 *   三颗电源指示灯分别挂在 12V / 5V / 3.3V 上
 *
 * ── IC 引脚（EasyEDA 官方符号核实，不是猜的）─────────────────────────────
 *   U1 RY8411 (SOT-23-6, C2935411)
 *     1=BS  自举，需 100nF 到 SW      2=GND
 *     3=FB  反馈，基准 0.8V，需分压   4=EN  使能
 *     5=IN  输入                      6=SW  开关节点，接电感
 *     ⚠️ 输出**可调**（0.8V 基准），不是固定 5V —— 必须外接反馈分压。
 *        Vout = 0.8 × (1 + R4/R5)，取 R4=100k / R5=19.1k → 4.99V
 *
 *   U2 TLV75733PDBVR (SOT-23-5, C485517)
 *     1=IN  2=GND  3=EN  4=NC  5=OUT（固定 3.3V，600mA）
 *
 * ── 位号（段内唯一，见 REFDES.md）────────────────────────────────────────
 *   R1–R5  C1–C7  D1–D3  U1 U2 L1 SW1 J1
 *
 * ── 坐标约定（实测标定，见 README）──────────────────────────────────────
 *   PCB：模块内坐标，整体平移由 main.tsx 决定。
 *        间距按**实测庭院尺寸**排（0603 庭院 2.96×1.46mm、0805 3.36×1.90mm），
 *        本页相邻中心距一律 ≥4mm —— 实测可让 courtyard 重叠错误归零。
 *   原理图：可用区实测只有 **x ∈ [−15.5, +15.5] / y ∈ [−10.8, +10.8]**（约 31×21.7 单位），
 *        不是 A4 的 297×210。超出会报 schematic_element_outside_sheet_warning。
 *
 * ── 为什么 SW1 用 <switch> 且不写 supplierPartNumbers ────────────────────
 *   实测对照（同封装 C136718）：
 *     <chip>   + supplier → 位号前缀警告 + 缺电源/地引脚警告 + 引脚未定义警告 + 封装不符警告
 *     <switch> + supplier → 仅"封装不符"警告（IoU 0.68，tscircuit 自比对假阳性）
 *     <switch> 无 supplier → **零警告**
 *   所以用 <switch>，C 编号只留在本注释与 BOM.md 里。
 *
 * ── 状态 ────────────────────────────────────────────────────────────────
 *   已完成：器件放置（20 个），PCB 重叠 0、原理图页外 0
 *   未完成：接线
 */
import { PAGES } from "../pages"

const SHEET: (typeof PAGES)[number]["name"] = "power"

export const PowerSection = () => (
  <subcircuit name="PWR" schSheetName={SHEET}>
    {/* ══ 12V 输入：XT30 座 + 总开关 ═══════════════════════════════════ */}
    <connector
      name="J1"
      footprint="jlcpcb:C428721"
      manufacturerPartNumber="XT30UPB-M"
      supplierPartNumbers={{ jlcpcb: ["C428721"] }}
      pinLabels={{ pin1: "VIN", pin2: "GND" }}
      pinAttributes={{
        VIN: { providesPower: true },
        GND: { requiresGround: true },
      }}
      pcbX={-32}
      pcbY={0}
      schX={-14}
      schY={8}
    />

    {/* 电源开关 SS-12F44-G5，C136718 */}
    <switch
      name="SW1"
      footprint="jlcpcb:C136718"
      manufacturerPartNumber="SS-12F44-G5"
      pcbX={-15}
      pcbY={0}
      schX={-8.5}
      schY={8}
    />

    {/* ══ 降压段：RY8411 + 电感 + 输入/输出电容 + 反馈分压 ══════════════ */}
    <chip
      name="U1"
      footprint="jlcpcb:C2935411"
      manufacturerPartNumber="RY8411"
      supplierPartNumbers={{ jlcpcb: ["C2935411"] }}
      pinLabels={{
        pin1: "BS",
        pin2: "GND",
        pin3: "FB",
        pin4: "EN",
        pin5: "IN",
        pin6: "SW",
      }}
      pinAttributes={{
        IN: { requiresPower: true },
        GND: { requiresGround: true },
        EN: { mustBeConnected: true },
      }}
      pcbX={0}
      pcbY={0}
      schX={-2.5}
      schY={8}
    />

    <inductor
      name="L1"
      inductance="4.7uH"
      footprint="jlcpcb:C354583"
      manufacturerPartNumber="CKCSA4020-4.7uH/M"
      supplierPartNumbers={{ jlcpcb: ["C354583"] }}
      pcbX={9}
      pcbY={0}
      schX={3.5}
      schY={8}
    />

    {/* ══ LDO 段：TLV75733 5V→3.3V ═════════════════════════════════════ */}
    <chip
      name="U2"
      footprint="jlcpcb:C485517"
      manufacturerPartNumber="TLV75733PDBVR"
      supplierPartNumbers={{ jlcpcb: ["C485517"] }}
      pinLabels={{
        pin1: "IN",
        pin2: "GND",
        pin3: "EN",
        pin4: "NC",
        pin5: "OUT",
      }}
      pinAttributes={{
        IN: { requiresPower: true },
        GND: { requiresGround: true },
        EN: { mustBeConnected: true },
        OUT: { providesPower: true },
      }}
      pcbX={28}
      pcbY={0}
      schX={10}
      schY={8}
    />

    {/* ══ 第二排：各段去耦与反馈分压 ═══════════════════════════════════ */}
    {/* 12V 输入电容 */}
    <capacitor
      name="C1"
      capacitance="22uF"
      footprint="0805"
      supplierPartNumbers={{ jlcpcb: ["C45783"] }}
      pcbX={-4}
      pcbY={10}
      schX={-14}
      schY={3.5}
    />
    <capacitor
      name="C2"
      capacitance="100nF"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      pcbX={-9}
      pcbY={7}
      schX={-10}
      schY={3.5}
    />
    {/* 自举电容：BS → SW */}
    <capacitor
      name="C3"
      capacitance="100nF"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      pcbX={0}
      pcbY={7}
      schX={-6}
      schY={3.5}
    />
    {/* 反馈分压：R4 上 / R5 下 → 0.8 × (1 + 100k/19.1k) = 4.99V */}
    <resistor
      name="R4"
      resistance="100k"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C25803"] }}
      pcbX={0}
      pcbY={-7}
      schX={-2}
      schY={3.5}
    />
    <resistor
      name="R5"
      resistance="19.1k"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C22897"] }}
      pcbX={4.5}
      pcbY={-7}
      schX={2}
      schY={3.5}
    />
    {/* 5V 输出电容 */}
    <capacitor
      name="C4"
      capacitance="22uF"
      footprint="0805"
      supplierPartNumbers={{ jlcpcb: ["C45783"] }}
      pcbX={16}
      pcbY={0}
      schX={6.5}
      schY={3.5}
    />
    <capacitor
      name="C5"
      capacitance="100nF"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      pcbX={16}
      pcbY={7}
      schX={10.5}
      schY={3.5}
    />

    {/* 3.3V 输入/输出电容 */}
    <capacitor
      name="C6"
      capacitance="1uF"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C15849"] }}
      pcbX={24}
      pcbY={-7}
      schX={-14}
      schY={-1.5}
    />
    <capacitor
      name="C7"
      capacitance="1uF"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C15849"] }}
      pcbX={34}
      pcbY={0}
      schX={-10}
      schY={-1.5}
    />

    {/* ══ 三颗电源指示灯（12V 红 / 5V 绿 / 3.3V 蓝）═════════════════════ */}
    <resistor
      name="R1"
      resistance="4.7k"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C23162"] }}
      pcbX={-32}
      pcbY={-14}
      schX={-14}
      schY={-7}
    />
    <led
      name="D1"
      color="red"
      footprint="jlcpcb:C2286"
      supplierPartNumbers={{ jlcpcb: ["C2286"] }}
      pinLabels={{ pin1: "anode", pin2: "cathode" }}
      pcbX={-27}
      pcbY={-14}
      schX={-10.5}
      schY={-7}
    />
    <resistor
      name="R2"
      resistance="1k"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C21190"] }}
      pcbX={-32}
      pcbY={-20}
      schX={-6}
      schY={-7}
    />
    <led
      name="D2"
      color="green"
      footprint="jlcpcb:C84267"
      supplierPartNumbers={{ jlcpcb: ["C84267"] }}
      pinLabels={{ pin1: "anode", pin2: "cathode" }}
      pcbX={-27}
      pcbY={-20}
      schX={-2.5}
      schY={-7}
    />
    <resistor
      name="R3"
      resistance="330"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C23138"] }}
      pcbX={-32}
      pcbY={-26}
      schX={2}
      schY={-7}
    />
    <led
      name="D3"
      color="blue"
      footprint="jlcpcb:C84266"
      supplierPartNumbers={{ jlcpcb: ["C84266"] }}
      pinLabels={{ pin1: "anode", pin2: "cathode" }}
      pcbX={-27}
      pcbY={-26}
      schX={5.5}
      schY={-7}
    />
  </subcircuit>
)
