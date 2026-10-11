/**
 * GY-302 风格 BH1750FVI 环境光模块 —— 5V 输入 / 板载 3.3V LDO / I2C 上拉 / 电源灯 / 调试测试点
 *
 * 驱动配方（I2C，7 位地址）：
 *   1. 写 0x01 → Power On
 *   2. 写 0x10 → 连续高分辨率模式
 *   3. 等 120ms
 *   4. 读 2 字节，lux = raw / 1.2
 *   地址：ADDR 接地 = 0x23；ADDR 接 3.3V = 0x5C（可挂两颗同总线）
 *
 * 料号核实（实测跑通，勿照抄旧文档）：
 *   U1 = jlcpcb:C78960  = BH1750FVI-TR，WSOF-6 六脚 + 中心裸露焊盘(pad7，悬空)
 *       —— 原给的 C78560 不存在（Component not found）
 *   U2 = jlcpcb:C39051  = MCP1700T-3302E/TT，3.3V/250mA SOT-23
 *       —— 原给的 XC6206P332MR / C8884 有两个问题：XC6206 未上架 JLCPCB；
 *          而 C8884 实际是 VH-4A 四脚接线端子，会加载成完全错误的元件。
 *          MCP1700 同为 3.3V/250mA/SOT-23，且数据手册同样要求输入输出各 ≥1uF，
 *          引脚顺序 (1=GND, 2=VOUT, 3=VIN) 与 XC6206 完全一致，可直接替换。
 */
export default () => (
  <board width="18mm" height="14mm">
    <schematicsheet name="main" />
    {/* ── 5V 输入排针：VIN / GND / SCL / SDA / ADDR ───────────────────────── */}
    <pinheader
      name="J1"
      pinCount={5}
      pitch="2.54mm"
      pinLabels={["VIN", "GND", "SCL", "SDA", "ADDR"]}
      showSilkscreenPinLabels={true}
      pcbX={0}
      pcbY={5.2}
    />

    {/* ── 3.3V LDO：5V 降到 3.3V 供传感器；C1/C2 各 ≥1uF 保证环路稳定 ─────── */}
    <chip
      name="U2"
      footprint="jlcpcb:C39051"
      manufacturerPartNumber="MCP1700T-3302E/TT"
      supplierPartNumbers={{ jlcpcb: ["C39051"] }}
      pinLabels={{ pin1: "GND", pin2: "VOUT", pin3: "VIN" }}
      pcbX={-6}
      pcbY={-0.3}
      pcbRotation={90}
    />
    <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={-6} pcbY={-3.4} />
    <capacitor name="C2" capacitance="1uF" footprint="0603" pcbX={-6.9} pcbY={2.6} />

    {/* ── 光传感器：WSOF-6，pad7 裸露背焊盘故意悬空（不进任何网络）────────── */}
    <chip
      name="U1"
      footprint="jlcpcb:C78960"
      manufacturerPartNumber="BH1750FVI-TR"
      supplierPartNumbers={{ jlcpcb: ["C78960"] }}
      pinLabels={{
        pin1: "VCC",
        pin2: "ADDR",
        pin3: "GND",
        pin4: "SDA",
        pin5: "DVI",
        pin6: "SCL",
      }}
      schPinArrangement={{
        topSide: { pins: ["VCC", "DVI", "ADDR"], direction: "left-to-right" },
        bottomSide: { pins: ["GND"], direction: "left-to-right" },
        rightSide: { pins: ["SDA", "SCL"], direction: "top-to-bottom" },
      }}
      pcbX={0}
      pcbY={-1.2}
    />

    {/* ── 去耦：C3 贴 VCC、C4 贴 DVI，均在 2mm 内 ─────────────────────────── */}
    <capacitor name="C3" capacitance="100nF" footprint="0402" pcbX={-3.05} pcbY={-0.7} pcbRotation={180} />
    {/* DVI 复位：C4 把 DVI 拉到地，与 DVI 接 V3_3 共同在上电时产生 >1us 低电平窗口。
        若 5V 上电沿很缓，DVI 应改由 MCU GPIO 驱动，别靠 RC。            */}
    <capacitor name="C4" capacitance="100nF" footprint="0402" pcbX={2.9} pcbY={-1.3} />

    {/* ── I2C 上拉（R1→SDA, R2→SCL）与 ADDR 下拉（默认 0x23）────────────── */}
    <resistor name="R1" resistance="4.7k" footprint="0402" pcbX={3.6} pcbY={-3.2} />
    <resistor name="R2" resistance="4.7k" footprint="0402" pcbX={3.6} pcbY={0.6} />
    <resistor name="R3" resistance="4.7k" footprint="0402" pcbX={7.9} pcbY={2.8} />

    {/* ── 电源指示灯：R4 限流，压在右下角，远离 U1 进光窗口 ───────────────── */}
    <resistor name="R4" resistance="1k" footprint="0402" pcbX={6.5} pcbY={-0.6} />
    <led
      name="D1"
      color="red"
      footprint="0603"
      pinLabels={{ pin1: "cathode", pin2: "anode" }}
      pcbX={7.2}
      pcbY={-2.4}
    />

    {/* ── 调试测试点：底边一排，间距 4mm ─────────────────────────────────── */}
    <testpoint name="TP1" footprintVariant="pad" padShape="circle" padDiameter="1mm" pcbX={-6} pcbY={-5.4} />
    <testpoint name="TP2" footprintVariant="pad" padShape="circle" padDiameter="1mm" pcbX={-2} pcbY={-5.4} />
    <testpoint name="TP3" footprintVariant="pad" padShape="circle" padDiameter="1mm" pcbX={2} pcbY={-5.4} />
    <testpoint name="TP4" footprintVariant="pad" padShape="circle" padDiameter="1mm" pcbX={6} pcbY={-5.4} />

    {/* ── 光学净空：U1 正上方 3×3mm 禁止走线与布件（窗口仅 0.25×0.3mm）──── */}
    <keepout shape="rect" width="3mm" height="3mm" pcbX={0} pcbY={1.35} />

    {/* ══ VIN：J1.1 / U2.VIN / C1.1 ═══════════════════════════════════════ */}
    <trace from="net.VIN" to=".J1 > .VIN" maxLength="30mm" />
    <trace from=".J1 > .VIN" to=".U2 > .VIN" maxLength="30mm" />
    <trace from=".U2 > .VIN" to=".C1 > .pin1" maxLength="30mm" />

    {/* ══ V3_3：LDO 输出及全部负载 ════════════════════════════════════════ */}
    <trace from="net.V3_3" to=".U2 > .VOUT" maxLength="30mm" />
    <trace from=".U2 > .VOUT" to=".C2 > .pin1" maxLength="30mm" />
    <trace from=".U2 > .VOUT" to=".C3 > .pin1" maxLength="30mm" />
    <trace from=".U2 > .VOUT" to=".C4 > .pin1" maxLength="30mm" />
    <trace from=".U2 > .VOUT" to=".R1 > .pin1" maxLength="30mm" />
    <trace from=".U2 > .VOUT" to=".R2 > .pin1" maxLength="30mm" />
    <trace from=".U2 > .VOUT" to=".U1 > .VCC" maxLength="30mm" />
    <trace from=".U2 > .VOUT" to=".U1 > .DVI" maxLength="30mm" />
    <trace from=".U2 > .VOUT" to=".R4 > .pin1" maxLength="30mm" />
    <trace from=".U2 > .VOUT" to=".TP1 > .pin1" maxLength="30mm" />

    {/* ══ GND ═════════════════════════════════════════════════════════════ */}
    <trace from="net.GND" to=".J1 > .GND" maxLength="30mm" />
    <trace from=".J1 > .GND" to=".U2 > .GND" maxLength="30mm" />
    <trace from=".J1 > .GND" to=".C1 > .pin2" maxLength="30mm" />
    <trace from=".J1 > .GND" to=".C2 > .pin2" maxLength="30mm" />
    <trace from=".J1 > .GND" to=".C3 > .pin2" maxLength="30mm" />
    <trace from=".J1 > .GND" to=".C4 > .pin2" maxLength="30mm" />
    <trace from=".J1 > .GND" to=".R3 > .pin2" maxLength="30mm" />
    <trace from=".J1 > .GND" to=".D1 > .cathode" maxLength="30mm" />
    <trace from=".J1 > .GND" to=".U1 > .GND" maxLength="30mm" />
    <trace from=".J1 > .GND" to=".TP2 > .pin1" maxLength="30mm" />

    {/* ══ SCL / SDA：等长并行，走 U1 右侧，绕开光学净空 ═══════════════════ */}
    <trace from="net.SCL" to=".J1 > .SCL" maxLength="30mm" />
    <trace from=".J1 > .SCL" to=".U1 > .SCL" maxLength="30mm" />
    <trace from=".U1 > .SCL" to=".R2 > .pin2" maxLength="30mm" />
    <trace from=".U1 > .SCL" to=".TP3 > .pin1" maxLength="30mm" />
    <trace from="net.SDA" to=".J1 > .SDA" maxLength="30mm" />
    <trace from=".J1 > .SDA" to=".U1 > .SDA" maxLength="30mm" />
    <trace from=".U1 > .SDA" to=".R1 > .pin2" maxLength="30mm" />
    <trace from=".U1 > .SDA" to=".TP4 > .pin1" maxLength="30mm" />

    {/* ══ ADDR：R3 下拉 → 默认 0x23；外部接 3.3V 则切到 0x5C ═════════════ */}
    <trace from="net.ADDR" to=".J1 > .ADDR" maxLength="30mm" />
    <trace from=".J1 > .ADDR" to=".U1 > .ADDR" maxLength="30mm" />
    <trace from=".J1 > .ADDR" to=".R3 > .pin1" maxLength="30mm" />

    {/* ── 电源灯阳极：经 R4 限流后接 V3_3 ───────────────────────────────── */}
    <trace from="net.LED" to=".R4 > .pin2" maxLength="30mm" />
    <trace from=".R4 > .pin2" to=".D1 > .anode" maxLength="30mm" />

    {/* ── 电源网络标签 ──────────────────────────────────────────────────── */}
    <netlabel net="VIN" connectsTo=".J1 > .VIN" />
    <netlabel net="V3_3" connectsTo=".U2 > .VOUT" />
    <netlabel net="GND" connectsTo=".J1 > .GND" />

    {/* ── 丝印：标题、接线说明、测试点网络名 ─────────────────────────────── */}
    <silkscreentext text="BH1750 5V MODULE" fontSize={0.7} pcbX={0} pcbY={4.15} />
    <silkscreentext
      text="VIN 5V, VCC 3.3V, ADDR: GND=0x23 / 3.3V=0x5C"
      fontSize={0.4}
      pcbX={0}
      pcbY={-6.75}
    />
    <silkscreentext text="V3_3" fontSize={0.45} pcbX={-6} pcbY={-6.2} />
    <silkscreentext text="GND" fontSize={0.45} pcbX={-2} pcbY={-6.2} />
    <silkscreentext text="SCL" fontSize={0.45} pcbX={2} pcbY={-6.2} />
    <silkscreentext text="SDA" fontSize={0.45} pcbX={6} pcbY={-6.2} />
  </board>
)