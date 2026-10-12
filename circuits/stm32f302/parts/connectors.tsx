/**
 * 连接器子电路 —— PH2.0 接口
 *
 * 为什么封装：全板一共 **7 个** PH2.0 接口（3 路 UART + 1 路 I2C + 1 路 SPI + 1 路 CAN），
 *   每个都要写封装、料号、厂商型号、引脚标签、电源/地属性，重复度极高且极易写漏属性。
 *
 * 料号按针数查表（后缀 ZZ = 直插通孔立式，全板统一）
 */
import { partProps } from "./codes"

export const PH20 = {
  3: { jlc: "C5359600", mpn: "WAFER-PH2.0-3PZZ" },
  4: { jlc: "C5359601", mpn: "WAFER-PH2.0-4PZZ" },
  6: { jlc: "C5359603", mpn: "WAFER-PH2.0-6PZZ" },
} as const

export const Ph20Port = (props: {
  ref: string
  pinCount: keyof typeof PH20
  pinLabels: Record<string, string>
  /** 哪些引脚对外供电 / 需要地。用于让 tscircuit 的电源检查认得这个口 */
  powerPins?: string[]
  groundPins?: string[]
  pcbX: number
  pcbY: number
  schX: number
  schY: number
  /**
   * 插拔方向。**必须如实声明**，不能靠旋转去迎合检查。
   *
   * PH2.0 的 ZZ 后缀是**直插立式**：线缆从**板子上方垂直**插入，
   * 不需要朝向板边。不声明的话 tscircuit 会从 footprint 的
   * cable_insertion_center 去"推断"，而那个推断对 ZZ 封装是错的
   * （实测推断结果永远是 x−，且不随旋转翻转），于是误报
   * pcb_connector_not_in_accessible_orientation_warning。
   */
  insertionDirection?: "from_above" | "from_below" | "from_left" | "from_right" | "from_top" | "from_bottom"
}) => {
  const attrs: Record<string, { providesPower?: boolean; requiresGround?: boolean }> = {}
  for (const p of props.powerPins ?? []) attrs[p] = { providesPower: true }
  for (const p of props.groundPins ?? []) attrs[p] = { requiresGround: true }
  return (
    <connector
      name={props.ref}
      footprint={`jlcpcb:${PH20[props.pinCount].jlc}`}
      {...partProps(PH20[props.pinCount])}
      pinLabels={props.pinLabels}
      pinAttributes={attrs}
      pcbX={props.pcbX}
      pcbY={props.pcbY}
      pcbRotation={props.pcbRotation ?? 0}
      schX={props.schX}
      schY={props.schY}
    >
      {props.insertionDirection ? (
        <footprint insertionDirection={props.insertionDirection} />
      ) : null}
    </connector>
  )
}
