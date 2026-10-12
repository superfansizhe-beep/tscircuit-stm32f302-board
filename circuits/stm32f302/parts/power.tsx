/**
 * 电源子电路 —— 降压与 LDO
 *
 * 为什么封装：这两块都是「输入去耦 + 芯片 + 输出去耦 + 若干外围」的固定套路，
 *   摊在页面里会把电源页淹掉，也容易漏接（本项目早期就漏过 EN 脚与电容正端）。
 *   封装后每个电源块只暴露「输入网络 / 输出网络 / 位号 / 坐标」。
 *
 * 引脚依据（EasyEDA 官方符号核实）：
 *   RY8411     1=BS 2=GND 3=FB 4=EN 5=IN 6=SW
 *   TLV75733   1=IN 2=GND 3=EN 4=NC 5=OUT
 *
 * ⚠️ RY8411 输出是**可调**的（反馈基准 0.8V），必须外接分压：
 *      Vout = 0.8 × (1 + R上/R下)。取 100k/19.1k → 4.99V。
 */
import { R0603, C0603, C0805, partProps } from "./codes"
import { NET } from "../nets"

/** 降压子电路：RY8411 + 电感 + 自举电容 + 反馈分压 + 输入/输出电容 */
export const BuckConverter = (props: {
  ic: string // U1
  ind: string // L1
  capIn: string // C1  22µF
  capInHf: string // C2  100nF
  capBs: string // C3  100nF 自举
  capOut: string // C4  22µF
  capOutHf: string // C5  100nF
  rFbTop: string // R4  100k
  rFbBottom: string // R5  19.1k
  inNet: string // net.V12
  pcbX: number
  pcbY: number
  schX: number
  schY: number
}) => (
  <>
    <chip
      name={props.ic}
      footprint="jlcpcb:C2935411"
      manufacturerPartNumber="RY8411"
      supplierPartNumbers={{ jlcpcb: ["C2935411"] }}
      pinLabels={{ pin1: "BS", pin2: "GND", pin3: "FB", pin4: "EN", pin5: "IN", pin6: "SW" }}
      pinAttributes={{
        IN: { requiresPower: true },
        GND: { requiresGround: true },
        EN: { mustBeConnected: true },
      }}
      pcbX={props.pcbX}
      pcbY={props.pcbY}
      schX={props.schX}
      schY={props.schY}
    />
    <inductor
      name={props.ind}
      inductance="4.7uH"
      footprint="jlcpcb:C354583"
      manufacturerPartNumber="CKCSA4020-4.7uH/M"
      supplierPartNumbers={{ jlcpcb: ["C354583"] }}
      pcbX={props.pcbX + 6}
      pcbY={props.pcbY}
      schX={props.schX + 6}
      schY={props.schY}
    />
    <capacitor name={props.capIn} capacitance="22uF" footprint="0805"
      {...partProps(C0805["22uF"])}
      pcbX={props.pcbX + 4} pcbY={props.pcbY - 2.6} schX={props.schX - 10} schY={props.schY - 5} />
    <capacitor name={props.capInHf} capacitance="100nF" footprint="0603"
      {...partProps(C0603["100nF"])}
      pcbX={props.pcbX + 4} pcbY={props.pcbY + 2.6} schX={props.schX - 6} schY={props.schY - 5} />
    <capacitor name={props.capBs} capacitance="100nF" footprint="0603"
      {...partProps(C0603["100nF"])}
      pcbX={props.pcbX} pcbY={props.pcbY + 3.4} schX={props.schX - 2} schY={props.schY - 5} />
    <resistor name={props.rFbTop} resistance="100k" footprint="0603"
      {...partProps(R0603["100k"])}
      pcbX={props.pcbX - 4.4} pcbY={props.pcbY - 1.6} schX={props.schX + 2} schY={props.schY - 5} />
    <resistor name={props.rFbBottom} resistance="19.1k" footprint="0603"
      {...partProps(R0603["19.1k"])}
      pcbX={props.pcbX - 4.4} pcbY={props.pcbY - 4.6} schX={props.schX + 6} schY={props.schY - 5} />
    <capacitor name={props.capOut} capacitance="22uF" footprint="0805"
      {...partProps(C0805["22uF"])}
      pcbX={props.pcbX + 8.8} pcbY={props.pcbY + 1.5} schX={props.schX + 11} schY={props.schY - 5} />
    <capacitor name={props.capOutHf} capacitance="100nF" footprint="0603"
      {...partProps(C0603["100nF"])}
      pcbX={props.pcbX + 8.8} pcbY={props.pcbY - 1.5} schX={props.schX + 11} schY={props.schY - 1.5} />

    {/* 输入侧 */}
    <trace name={`${props.capIn}_IN`} from={`${props.capIn}.pin1`} to={props.inNet} />
    <trace name={`${props.capInHf}_IN`} from={`${props.capInHf}.pin1`} to={props.inNet} />
    <trace name={`${props.ic}_IN`} from={`${props.ic}.IN`} to={props.inNet} />
    <trace name={`${props.ic}_EN`} from={`${props.ic}.EN`} to={props.inNet} />
    <trace name={`${props.capIn}_GND`} from={`${props.capIn}.pin2`} to={NET.GND}   width="0.4mm" />
    <trace name={`${props.capInHf}_GND`} from={`${props.capInHf}.pin2`} to={NET.GND}   width="0.4mm" />
    <trace name={`${props.ic}_GND`} from={`${props.ic}.GND`} to={NET.GND}   width="0.4mm" />

    {/* 开关节点 + 自举 */}
    <trace name={`${props.ic}_SW`} from={`${props.ic}.SW`} to={NET.SW} />
    <trace name={`${props.ind}_SW`} from={`${props.ind}.pin1`} to={NET.SW} />
    <trace name={`${props.capBs}_SW`} from={`${props.capBs}.pin2`} to={NET.SW} />
    <trace name={`${props.ic}_BS`} from={`${props.ic}.BS`} to={`${props.capBs}.pin1`} />

    {/* 反馈分压 */}
    <trace name={`${props.rFbTop}_OUT`} from={`${props.rFbTop}.pin1`} to={NET.V5}   width="0.5mm" />
    <trace name={`${props.rFbBottom}_FB`} from={`${props.rFbBottom}.pin1`} to={NET.FB} />
    <trace name={`${props.rFbTop}_FB`} from={`${props.rFbTop}.pin2`} to={NET.FB} />
    <trace name={`${props.ic}_FB`} from={`${props.ic}.FB`} to={NET.FB} />
    <trace name={`${props.rFbBottom}_GND`} from={`${props.rFbBottom}.pin2`} to={NET.GND}   width="0.4mm" />

    {/* 输出侧 */}
    <trace name={`${props.ind}_OUT`} from={`${props.ind}.pin2`} to={NET.V5}   width="0.5mm" />
    <trace name={`${props.capOut}_OUT`} from={`${props.capOut}.pin1`} to={NET.V5}   width="0.5mm" />
    <trace name={`${props.capOutHf}_OUT`} from={`${props.capOutHf}.pin1`} to={NET.V5}   width="0.5mm" />
    <trace name={`${props.capOut}_GND`} from={`${props.capOut}.pin2`} to={NET.GND}   width="0.4mm" />
    <trace name={`${props.capOutHf}_GND`} from={`${props.capOutHf}.pin2`} to={NET.GND}   width="0.4mm" />
  </>
)

/** LDO 子电路：TLV75733 + 输入/输出电容 */
export const LdoRegulator = (props: {
  ic: string // U2
  capIn: string // C6
  capOut: string // C7
  inNet: string // net.V5
  outNet: string // net.V3_3
  pcbX: number
  pcbY: number
  schX: number
  schY: number
}) => (
  <>
    <chip
      name={props.ic}
      footprint="jlcpcb:C485517"
      manufacturerPartNumber="TLV75733PDBVR"
      supplierPartNumbers={{ jlcpcb: ["C485517"] }}
      pinLabels={{ pin1: "IN", pin2: "GND", pin3: "EN", pin4: "NC", pin5: "OUT" }}
      pinAttributes={{
        IN: { requiresPower: true },
        GND: { requiresGround: true },
        EN: { mustBeConnected: true },
        OUT: { providesPower: true },
      }}
      pcbX={props.pcbX}
      pcbY={props.pcbY}
      schX={props.schX}
      schY={props.schY}
    />
    <capacitor name={props.capIn} capacitance="1uF" footprint="0603"
      {...partProps(C0603["1uF"])}
      pcbX={props.pcbX - 4} pcbY={props.pcbY - 3} schX={props.schX - 6} schY={props.schY} />
    <capacitor name={props.capOut} capacitance="1uF" footprint="0603"
      {...partProps(C0603["1uF"])}
      pcbX={props.pcbX - 4} pcbY={props.pcbY + 3} schX={props.schX + 6} schY={props.schY} />

    <trace name={`${props.capIn}_IN`} from={`${props.capIn}.pin1`} to={props.inNet} />
    <trace name={`${props.ic}_IN`} from={`${props.ic}.IN`} to={props.inNet} />
    <trace name={`${props.ic}_EN`} from={`${props.ic}.EN`} to={props.inNet} />
    <trace name={`${props.capIn}_GND`} from={`${props.capIn}.pin2`} to={NET.GND}   width="0.4mm" />
    <trace name={`${props.ic}_GND`} from={`${props.ic}.GND`} to={NET.GND}   width="0.4mm" />
    <trace name={`${props.ic}_OUT`} from={`${props.ic}.OUT`} to={props.outNet} />
    <trace name={`${props.capOut}_OUT`} from={`${props.capOut}.pin1`} to={props.outNet} />
    <trace name={`${props.capOut}_GND`} from={`${props.capOut}.pin2`} to={NET.GND}   width="0.4mm" />
  </>
)
