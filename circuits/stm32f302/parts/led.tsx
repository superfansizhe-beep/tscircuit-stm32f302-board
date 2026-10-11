/**
 * 指示灯子电路 —— 限流电阻 + LED + 三条接线
 *
 * 干什么：把一个「电源轨 → 限流电阻 → LED → 地」的指示灯封装成一个组件。
 * 为什么值得封装：全板一共 **6 个** 这样的指示灯（电源页 3 个 + 指示灯页 3 个），
 *   而 LED 极性恰好是本项目最容易写错的地方（红色 pin1=阳极，绿/蓝 pin1=阴极）。
 *   把极性查表放进 codes.ts 之后，调用方只给颜色，不可能写错。
 *
 * 接线方向固定为「供电 → 电阻 → LED 阳极，阴极 → 地」，即**高电平/常亮**接法；
 * 指示灯页的 GPIO 版只需把 supply 换成 GPIO 网络即可复用。
 */
import { R0603, LED0603 } from "./codes"
import { NET } from "../nets"

export const LedIndicator = (props: {
  /** 限流电阻位号，如 R1 */
  res: string
  /** LED 位号，如 D1 */
  led: string
  /** LED 颜色，决定料号与极性 */
  color: keyof typeof LED0603
  /** 限流电阻阻值（必须是 R0603 表里的键） */
  resistance: keyof typeof R0603
  /** 供电网络，如 net.V12 / net.V5 / net.V3_3，或某 GPIO 的 net */
  supply: string
  pcbX: number
  pcbY: number
  schX: number
  schY: number
}) => {
  const p = LED0603[props.color]
  const pin2 = p.pin1 === "anode" ? "cathode" : "anode"
  return (
    <>
      <resistor
        name={props.res}
        resistance={props.resistance}
        footprint="0603"
        supplierPartNumbers={{ jlcpcb: [R0603[props.resistance]] }}
        pcbX={props.pcbX}
        pcbY={props.pcbY}
        schX={props.schX}
        schY={props.schY}
      />
      <led
        name={props.led}
        color={props.color}
        footprint={`jlcpcb:${p.jlc}`}
        supplierPartNumbers={{ jlcpcb: [p.jlc] }}
        pinLabels={{ pin1: p.pin1, pin2 }}
        pcbX={props.pcbX + 4}
        pcbY={props.pcbY}
        schX={props.schX + 4}
        schY={props.schY}
      />
      <trace name={`${props.res}_RAIL`} from={`${props.res}.pin1`} to={props.supply} />
      <trace name={`${props.led}_LIMIT`} from={`${props.res}.pin2`} to={`${props.led}.anode`} />
      <trace name={`${props.led}_GND`} from={`${props.led}.cathode`} to={NET.GND} />
    </>
  )
}
