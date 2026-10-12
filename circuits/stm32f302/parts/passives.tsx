/**
 * 无源件子电路 —— I2C 上拉对、电压分压
 *
 * 为什么封装：
 *   · I2C 上拉对全板 **3 组**（每条总线一组），且「上拉到哪个电源」写错不会报错
 *   · 电压分压全板 **3 组**，分压比算错等于采样值全错
 *   两者的正确性都在「参数」而不是「结构」，封装后参数集中、结构不可能写歪。
 */
import { R0603, C0603, partProps } from "./codes"
import { NET } from "../nets"

/** I2C 上拉对：SCL 与 SDA 各一颗上拉到指定电源 */
export const I2cPullupPair = (props: {
  scl: string
  sda: string
  resistance: keyof typeof R0603
  supply: string
  sclNet: string
  sdaNet: string
  pcbX: number
  pcbY: number
  schX: number
  schY: number
}) => (
  <>
    <resistor name={props.scl} resistance={props.resistance} footprint="0603"
      {...partProps(R0603[props.resistance])}
      pcbX={props.pcbX} pcbY={props.pcbY} schX={props.schX} schY={props.schY} />
    <resistor name={props.sda} resistance={props.resistance} footprint="0603"
      {...partProps(R0603[props.resistance])}
      pcbX={props.pcbX + 4} pcbY={props.pcbY} schX={props.schX + 4} schY={props.schY} />
    <trace name={`${props.scl}_RAIL`} from={`${props.scl}.pin1`} to={props.supply} />
    <trace name={`${props.scl}_NET`} from={`${props.scl}.pin2`} to={props.sclNet} />
    <trace name={`${props.sda}_RAIL`} from={`${props.sda}.pin1`} to={props.supply} />
    <trace name={`${props.sda}_NET`} from={`${props.sda}.pin2`} to={props.sdaNet} />
  </>
)

/**
 * 电压分压 + 滤波 —— 分压比 = R下 / (R上 + R下)
 *
 * ⚠️ 调用方负责保证 inputNet 上的电压 × 分压比 < ADC 参考（本板 3.3V）。
 *    本板三路满量程读数都落在 ~2.5V，留了 0.8V 余量。
 */
export const VoltageDivider = (props: {
  top: string
  bottom: string
  cap: string
  topValue: keyof typeof R0603
  bottomValue: keyof typeof R0603
  inputNet: string
  /** 分压中点（去 ADC 的网络） */
  senseNet: string
  pcbX: number
  pcbY: number
  schX: number
  schY: number
}) => (
  <>
    <resistor name={props.top} resistance={props.topValue} footprint="0603"
      {...partProps(R0603[props.topValue])}
      pcbX={props.pcbX} pcbY={props.pcbY + 4} schX={props.schX} schY={props.schY + 4} />
    <resistor name={props.bottom} resistance={props.bottomValue} footprint="0603"
      {...partProps(R0603[props.bottomValue])}
      pcbX={props.pcbX} pcbY={props.pcbY} schX={props.schX} schY={props.schY} />
    <capacitor name={props.cap} capacitance="100nF" footprint="0603"
      {...partProps(C0603["100nF"])}
      pcbX={props.pcbX} pcbY={props.pcbY - 4} schX={props.schX} schY={props.schY - 4} />
    <trace name={`${props.top}_IN`} from={`${props.top}.pin1`} to={props.inputNet} />
    <trace name={`${props.top}_SENSE`} from={`${props.top}.pin2`} to={props.senseNet} />
    <trace name={`${props.bottom}_SENSE`} from={`${props.bottom}.pin1`} to={props.senseNet} />
    <trace name={`${props.bottom}_GND`} from={`${props.bottom}.pin2`} to={NET.GND}   width="0.4mm" />
    <trace name={`${props.cap}_SENSE`} from={`${props.cap}.pin1`} to={props.senseNet} />
    <trace name={`${props.cap}_GND`} from={`${props.cap}.pin2`} to={NET.GND}   width="0.4mm" />
  </>
)
