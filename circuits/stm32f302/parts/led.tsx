/**
 * 指示灯子电路 —— 限流电阻 + LED + 三条接线
 *
 * 干什么：把「供电轨 → 限流电阻 → LED → 地」的指示灯封装成一个组件。
 * 为什么值得封装：全板一共 **6 个** 这样的指示灯（电源页 3 个 + 指示灯页 3 个），
 *   而 LED 极性恰好是本项目最容易写错的地方（红色 pin1=阳极，绿/蓝 pin1=阴极）。
 *   极性查表在 codes.ts，调用方只给颜色，不可能写错。
 *
 * 接线方向固定「供电 → 电阻 → LED 阳极，阴极 → 地」，即高电平/常亮接法；
 * 指示灯页的 GPIO 版把 supply 换成 GPIO 网络即可复用。
 */
import { R0603, LED0603, partProps } from "./codes"
import { NET } from "../nets"

export const LedIndicator = (props: {
  res: string
  led: string
  color: keyof typeof LED0603
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
        {...partProps(R0603[props.resistance])}
        pcbX={props.pcbX}
        pcbY={props.pcbY}
        schX={props.schX}
        schY={props.schY}
      />
      <led
        name={props.led}
        color={props.color}
        footprint={`jlcpcb:${p.jlc}`}
        {...partProps(p)}
        pinLabels={{ pin1: p.pin1, pin2 }}
        pcbX={props.pcbX + 4}
        pcbY={props.pcbY}
        schX={props.schX + 4}
        schY={props.schY}
      />
      <trace name={`${props.res}_RAIL`} from={`${props.res}.pin1`} to={props.supply} />
      <trace name={`${props.led}_LIMIT`} from={`${props.res}.pin2`} to={`${props.led}.anode`} />
      <trace name={`${props.led}_GND`} from={`${props.led}.cathode`} to={NET.GND}   width="0.4mm" />
    </>
  )
}
