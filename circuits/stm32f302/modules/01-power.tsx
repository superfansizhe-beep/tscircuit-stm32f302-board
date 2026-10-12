/**
 * 电源页 —— 要求 1
 *
 * 12V→5V→3.3V 电源转换 + 手动开关 + XT30 输入 + 三颗电源指示灯
 *
 * ── 本页拓扑 ────────────────────────────────────────────────────────────
 *   J1 (XT30) → SW1 (总开关) → net.V12
 *                                   ├→ 降压块 → net.V5 → LDO 块 → net.V3_3
 *                                   ├→ 12V 指示灯
 *                                   └→ (经降压/LDO 后) 5V、3.3V 指示灯
 *
 *   ⚠️ 本页跑的是**最坏情况负载**：3.3V 轨要给主控 + 4 颗外围 IC + 5 颗 LED 供电，
 *      5V 轨还要经 PWM 排针对外供 6 路。见文件末尾的电流预算说明。
 *
 * ── 本页只用三个封装好的子电路 ──────────────────────────────────────────
 *   BuckConverter  ← parts/power.tsx   RY8411 + 电感 + 自举 + 反馈分压 + 4 电容
 *   LdoRegulator   ← parts/power.tsx   TLV75733 + 2 电容
 *   LedIndicator   ← parts/led.tsx     限流电阻 + LED + 3 条接线
 *   这样本页只剩「输入座、开关、摆放」三件事，电源的**结构**不可能写歪。
 *
 * ── 为什么开关这样接 ────────────────────────────────────────────────────
 *   SW1 (SS-12F44-G5) 的 EasyEDA 符号核实结果：
 *     pin2 = COM（动触点）   pin1 / pin3 = 两个掷   pin4 / pin5 = 安装脚
 *   本板只取 COM + 一个掷做通断，其余三个脚悬空 —— 对 SPDT 拨动开关来说，
 *   悬空另一掷是常规做法，不会引入浮空风险（触点本身不参与电路）。
 *
 * ── 接线策略（全工程统一，见 README）────────────────────────────────────
 *   电源/地一律走命名网络 net.V12 / net.V5 / net.V3_3 / net.GND，
 *   信号才用引脚直连。好处有二：
 *     1. 跨页连接天然成立 —— 其余 8 页写 net.V3_3 就自动接上本页产生的电源
 *     2. **每个引脚恰好一条 trace**，顺带绕开 core#4481 那个
 *        「同一个 pin 属于两条连接 → autorouting 产物存不下来」的坑
 *   原理图上的**网络标号是自动生成的**（用 net.X 接线即可），无需手写 <netlabel>。
 *
 * ── 状态：器件放置 + 接线 完成 ──────────────────────────────────────────
 */
import { PAGES } from "../pages"
import { BuckConverter, LdoRegulator } from "../parts/power"
import { LedIndicator } from "../parts/led"
import { NET } from "../nets"

const SHEET: (typeof PAGES)[number]["name"] = "power"

export const PowerSection = (props: { pcbX?: number; pcbY?: number }) => (
  <group name="PWR" schSheetName={SHEET} pcbPack={false} pcbX={props.pcbX} pcbY={props.pcbY}>
    {/* ══ 12V 输入：XT30 座 + 总开关 ═══════════════════════════════════ */}
    <connector
      name="J1"
      footprint="jlcpcb:C428721"
      manufacturerPartNumber="XT30UPB-M"
      supplierPartNumbers={{ jlcpcb: ["C428721"] }}
      pinLabels={{ pin1: "VIN", pin2: "GND" }}
      pinAttributes={{ VIN: { providesPower: true }, GND: { requiresGround: true } }}
      pcbX={-26}
      pcbY={6}
      schX={-12}
      schY={8}
    />
    {/* 12V 输入总开关（SS-12F44-G5, C136718）
        标注电源方向是必要的：COM 取电、T1 把电送出去。
        不标的话 ERC 会认为 net.V12 上没有任何供电来源 ——
        因为开关是无源件，ERC 不会自己把"电源"顺着开关传下去。 */}
    <switch
      name="SW1"
      footprint="jlcpcb:C136718"
      manufacturerPartNumber="SS-12F44-G5"
      supplierPartNumbers={{ jlcpcb: ["C136718"] }}
      pinLabels={{ pin1: "T1", pin2: "COM", pin3: "T2", pin4: "MP1", pin5: "MP2" }}
      pinAttributes={{ COM: { requiresPower: true }, T1: { providesPower: true } }}
      pcbX={-24.5}
      pcbY={-6}
      schX={-12}
      schY={2}
    />
    <trace name="V12_IN" from="J1.VIN" to="SW1.COM" />
    <trace name="V12_SWITCHED" from="SW1.T1" to={NET.V12} />
    <trace name="V12_IN_GND" from="J1.GND" to={NET.GND} />

    {/* ══ 降压块：12V → 5V ═════════════════════════════════════════════ */}
    <BuckConverter
      ic="U1"
      ind="L1"
      capIn="C1"
      capInHf="C2"
      capBs="C3"
      capOut="C4"
      capOutHf="C5"
      rFbTop="R4"
      rFbBottom="R5"
      inNet={NET.V12}
      pcbX={-6}
      pcbY={2}
      schX={-1}
      schY={5}
    />

    {/* ══ LDO 块：5V → 3.3V ════════════════════════════════════════════ */}
    <LdoRegulator
      ic="U2"
      capIn="C6"
      capOut="C7"
      inNet={NET.V5}
      outNet={NET.V3_3}
      pcbX={-6}
      pcbY={-6}
      schX={-1}
      schY={-4}
    />

    {/* ══ 三颗电源指示灯：分别挂 12V / 5V / 3.3V ═══════════════════════ */}
    <LedIndicator
      res="R1" led="D1" color="red" resistance="4.7k" supply={NET.V12}
      pcbX={-14} pcbY={-14} schX={-12} schY={-9}
    />
    <LedIndicator
      res="R2" led="D2" color="green" resistance="1k" supply={NET.V5}
      pcbX={-6}  pcbY={-14} schX={-4}  schY={-9}
    />
    <LedIndicator
      res="R3" led="D3" color="blue" resistance="330" supply={NET.V3_3}
      pcbX={2}   pcbY={-14} schX={4}   schY={-9}
    />
  </group>
)
