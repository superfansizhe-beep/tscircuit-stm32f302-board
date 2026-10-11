/**
 * 封装库可用性自检 —— 一次性工具，不属于成品电路
 *
 * 目的：逐个实例化本板要用的每一种器件，强制 tscircuit 去库里解析它的封装。
 * 任何一个器件在库里没有封装，这一步就会报错 —— 从而在画正式电路之前暴露出来。
 *
 * 全部走 jlcpcb:Cxxxx（EasyEDA 真实封装），不手写焊盘。
 */
export default () => (
  <board width="200mm" height="120mm">
    <chip name="U1" footprint="jlcpcb:C2935411" pcbX={-90} pcbY={40} />
    <chip name="U2" footprint="jlcpcb:C485517" pcbX={-66} pcbY={40} />
    <chip name="U3" footprint="jlcpcb:C504601" pcbX={-42} pcbY={40} />
    <chip name="U4" footprint="jlcpcb:C6487" pcbX={-18} pcbY={40} />
    <chip name="U5" footprint="jlcpcb:C2864807" pcbX={6} pcbY={40} />
    <chip name="U6" footprint="jlcpcb:C128577" pcbX={30} pcbY={40} />
    <chip name="U7" footprint="jlcpcb:C73651" pcbX={54} pcbY={40} />
    <chip name="L1" footprint="jlcpcb:C354583" pcbX={78} pcbY={40} />
    <chip name="Y1" footprint="jlcpcb:C400090" pcbX={-90} pcbY={0} />
    <chip name="J1" footprint="jlcpcb:C428721" pcbX={-66} pcbY={0} />
    <chip name="J2" footprint="jlcpcb:C5359601" pcbX={-42} pcbY={0} />
    <chip name="J6" footprint="jlcpcb:C5359603" pcbX={-18} pcbY={0} />
    <chip name="J7" footprint="jlcpcb:C5359600" pcbX={6} pcbY={0} />
    <chip name="J8" footprint="jlcpcb:C37208" pcbX={30} pcbY={0} />
    <chip name="J11" footprint="jlcpcb:C42431818" pcbX={54} pcbY={0} />
    <chip name="J12" footprint="jlcpcb:C68234" pcbX={78} pcbY={0} />
    <chip name="SW1" footprint="jlcpcb:C136718" pcbX={-90} pcbY={-40} />
    <chip name="SW2" footprint="jlcpcb:C318884" pcbX={-66} pcbY={-40} />
    <chip name="LED_G" footprint="jlcpcb:C84267" pcbX={-42} pcbY={-40} />
    <chip name="LED_R" footprint="jlcpcb:C2286" pcbX={-18} pcbY={-40} />
    <chip name="LED_B" footprint="jlcpcb:C84266" pcbX={6} pcbY={-40} />
    <chip name="R_10k" footprint="jlcpcb:C25804" pcbX={30} pcbY={-40} />
    <chip name="C_100n" footprint="jlcpcb:C14663" pcbX={54} pcbY={-40} />
  </board>
)
