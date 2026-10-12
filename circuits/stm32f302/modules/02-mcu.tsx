/**
 * 最小系统页 —— 要求 2
 *
 * STM32F302R8T6 最小系统：8MHz 外部晶振 + RESET 按键 + BOOT 按键 + SWD 调试口 + 全套去耦
 * 题目明说「可以不用低速晶振」，所以**不装 LSE（32.768kHz）**，PC14/PC15 留空。
 *
 * ── 本页是全局枢纽 ──────────────────────────────────────────────────────
 *   主控的每个功能引脚都接到一条**命名网络**上，其余八页各自引用同一个网名，
 *   跨页连接就自动成立 —— 本页不需要知道对方在哪一页。
 *   网名全部来自 `nets.ts`（唯一权威），避免手写字符串写串而不报错。
 *
 * ── 器件内部关系（EasyEDA 符号/封装核实，不是猜的）──────────────────────
 *   Y1 8MHz 3225 四脚晶振：pin1/pin3 = 晶振端子，pin2/pin4 = 外壳地
 *     （依据：PCB 图白点定 pin1 在左下、逆时针编号；符号图显示端子走对角）
 *   SW2/SW3 TS-1187A 四脚轻触开关：**pin1=pin2 是一组触点，pin3=pin4 是另一组**
 *     （依据：符号图上下两根横杠各把两个脚连在一起）
 *     本项目把四个脚都接上，既保证导通，也不留悬空脚。
 *
 * ── 引脚表从哪来 ────────────────────────────────────────────────────────
 *   64 条 pinLabels 由 ST 官方 STM32_open_pin_data 的 STM32F302R(6-8)Tx.xml
 *   **程序化生成**，不是手抄。完整分配见 PINMAP.md。
 *
 *   ⚠️ 多实例电源脚（VDD 有 4 个、VSS 有 4 个）同名，引用时必须用**脚号**
 *      （U3.pin19 / pin32 / pin48 / pin64），用名字只能指到其中一个。
 *
 * ── 坐标（实测标定）─────────────────────────────────────────────────────
 *   PCB：U3 庭院 13.99×13.99mm、按键 7.51×5.71mm、SWD 排针 13.23×5.58mm，
 *        间距按这些真实数字排。本页约 48 × 34 mm（九页里最大的）。
 *   原理图：可用区 x ∈ [−15.5, 15.5] / y ∈ [−10.8, 10.8]，不是 A4 的 297×210。
 *
 * ── 状态：器件放置 + 接线 完成 ──────────────────────────────────────────
 */
import { PAGES } from "../pages"
import { NET } from "../nets"
import { R0603, C0603, FB_0603, partProps } from "../parts/codes"

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

export const McuSection = (props: { pcbX?: number; pcbY?: number }) => (
  <group name="MCU" schSheetName={SHEET} pcbPack={false} pcbX={props.pcbX} pcbY={props.pcbY}>
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

    {/* ══ HSE 8MHz 晶振 ═════════════════════════════════════════════════ */}
    {/* 晶振必须**贴近 PF0/PF1**：tscircuit 会给晶振网络的走线自动加
        10mm 长度上限（core 里的 DEFAULT_CRYSTAL_MAX_TRACE_LENGTH_MM），
        而 PF0/PF1 在 U3 的**底边**。原来把晶振放在顶边外，绕出 14.66mm，
        直接导致 autorouter 拒绝布线。挪到底边后约 8.5mm。 */}
    <crystal name="Y1" frequency="8MHz" loadCapacitance="10pF" pinVariant="four_pin"
      footprint="jlcpcb:C400090" manufacturerPartNumber="TAXM8M4RDBCCT2T"
      supplierPartNumbers={{ jlcpcb: ["C400090"] }}
      pcbX={-1.5} pcbY={-9.7} schX={-6} schY={7} />
    <capacitor name="C18" capacitance="12pF" footprint="0603"
      {...partProps(C0603["12pF"])}
      pcbX={-5} pcbY={-8.7} schX={-10} schY={7} />
    <capacitor name="C19" capacitance="12pF" footprint="0603"
      {...partProps(C0603["12pF"])}
      pcbX={3} pcbY={-8.7} schX={-2} schY={7} />

    {/* ══ VDD 去耦 ══════════════════════════════════════════════════════ */}
    <capacitor name="C10" capacitance="100nF" footprint="0603"
      {...partProps(C0603["100nF"])} pcbX={-9.5} pcbY={8.5} schX={2} schY={7} />
    <capacitor name="C11" capacitance="100nF" footprint="0603"
      {...partProps(C0603["100nF"])} pcbX={9.5} pcbY={8.5} schX={6} schY={7} />
    <capacitor name="C12" capacitance="100nF" footprint="0603"
      {...partProps(C0603["100nF"])} pcbX={-9.5} pcbY={-8.5} schX={10} schY={7} />
    <capacitor name="C13" capacitance="100nF" footprint="0603"
      {...partProps(C0603["100nF"])} pcbX={9.5} pcbY={-8.5} schX={-10} schY={-3} />
    <capacitor name="C14" capacitance="4.7uF" footprint="0603"
      {...partProps(C0603["4.7uF"])} pcbX={-9.5} pcbY={0} schX={-6} schY={3} />

    {/* ══ VBAT ══════════════════════════════════════════════════════════ */}
    <capacitor name="C17" capacitance="100nF" footprint="0603"
      {...partProps(C0603["100nF"])} pcbX={13} pcbY={8} schX={10} schY={3} />

    {/* ══ VDDA 隔离与滤波 ═══════════════════════════════════════════════ */}
    <chip name="FB1" footprint="jlcpcb:C19330"
      {...partProps(FB_0603)}
      pinLabels={{ pin1: "IN", pin2: "OUT" }}
      pinAttributes={{ IN: { requiresPower: true }, OUT: { providesPower: true } }}
      pcbX={-13.5} pcbY={0} schX={-2} schY={3} />
    <capacitor name="C15" capacitance="1uF" footprint="0603"
      {...partProps(C0603["1uF"])} pcbX={-13.5} pcbY={4.5} schX={2} schY={3} />
    <capacitor name="C16" capacitance="10nF" footprint="0603"
      {...partProps(C0603["10nF"])} pcbX={-13.5} pcbY={-4.5} schX={6} schY={3} />

    {/* ══ RESET / BOOT 阻容与按键 ═══════════════════════════════════════ */}
    <resistor name="R10" resistance="10k" footprint="0603"
      {...partProps(R0603["10k"])} pcbX={-18} pcbY={4} schX={-6} schY={-3} />
    <capacitor name="C20" capacitance="100nF" footprint="0603"
      {...partProps(C0603["100nF"])} pcbX={-18} pcbY={8} schX={-2} schY={-3} />
    <resistor name="R11" resistance="10k" footprint="0603"
      {...partProps(R0603["10k"])} pcbX={-13.5} pcbY={-8} schX={2} schY={-3} />
    <resistor name="R12" resistance="10k" footprint="0603"
      {...partProps(R0603["10k"])} pcbX={-18} pcbY={-8} schX={6} schY={-3} />
    <switch name="SW2" footprint="jlcpcb:C318884"
      manufacturerPartNumber="TS-1187A-B-A-B"
      supplierPartNumbers={{ jlcpcb: ["C318884"] }}
      pinLabels={{ pin1: "A1", pin2: "A2", pin3: "B1", pin4: "B2" }}
      pcbX={-4} pcbY={10} schX={-10} schY={-7} />
    <switch name="SW3" footprint="jlcpcb:C318884"
      manufacturerPartNumber="TS-1187A-B-A-B"
      supplierPartNumbers={{ jlcpcb: ["C318884"] }}
      pinLabels={{ pin1: "A1", pin2: "A2", pin3: "B1", pin4: "B2" }}
      pcbX={4} pcbY={10} schX={-6} schY={-7} />

    {/* ══ SWD 调试口 ════════════════════════════════════════════════════ */}
    {/* SWD 调试口。立式 2×5 排针 —— 线缆从**板子上方垂直**插入，
        ⚠️ pinLabels 是必需的：引脚若只靠封装提供，一旦夹一个 <footprint> 子元素
           去声明插入方向，那个子元素会替换掉字符串封装、把引脚全部顶掉。
           实测过：不加 pinLabels 的 J11 会变成 0 个 port，7 条接线全断。
           地脚写 GND1/2/3 而不是都叫 GND，避免同名引脚歧义。
        所以声明 insertionDirection="from_above" 如实表达插拔方式。
        不声明的话 tscircuit 会从 footprint 的 cable_insertion_center 去"推断"，
        推断结果对这类立式排针是错的，会误报"连接器朝向不可达"。 */}
    <connector name="J11" footprint="jlcpcb:C42431818"
      manufacturerPartNumber="PZ2.54-2X5P-H25"
      supplierPartNumbers={{ jlcpcb: ["C42431818"] }}
      pinLabels={{
        pin1: "VCC", pin2: "SWDIO", pin3: "GND1", pin4: "SWCLK", pin5: "GND2",
        pin6: "SWO", pin7: "KEY", pin8: "NC", pin9: "GND3", pin10: "NRST",
      }}
      pinAttributes={{
        VCC: { providesPower: true },
        GND1: { requiresGround: true },
        GND2: { requiresGround: true },
        GND3: { requiresGround: true },
      }}
      pcbX={11} pcbY={0} pcbRotation={90} schX={10} schY={-3}
    >
      <footprint insertionDirection="from_above" />
    </connector>

    {/* ══ 接线：电源与地 ════════════════════════════════════════════════ */}
    {/* VDD 有 4 个同名脚，只能按脚号引用 */}
    <trace name="VDD1" from="U3.pin19" to={NET.V3_3} />
    <trace name="VDD2" from="U3.pin32" to={NET.V3_3} />
    <trace name="VDD3" from="U3.pin48" to={NET.V3_3} />
    <trace name="VDD4" from="U3.pin64" to={NET.V3_3} />
    <trace name="VSS1" from="U3.pin18" to={NET.GND} />
    <trace name="VSS2" from="U3.pin31" to={NET.GND} />
    <trace name="VSS3" from="U3.pin47" to={NET.GND} />
    <trace name="VSS4" from="U3.pin63" to={NET.GND} />
    <trace name="VBAT" from="U3.pin1" to={NET.V3_3} />
    <trace name="VSSA" from="U3.pin12" to={NET.GND} />

    {/* VDDA 经磁珠从 3.3V 隔离 */}
    <trace name="VDDA_FROM_3V3" from="FB1.IN" to={NET.V3_3} />
    <trace name="VDDA_TO_MCU" from="FB1.OUT" to={NET.VDDA} />
    <trace name="VDDA_MCU" from="U3.VDDA" to={NET.VDDA} />
    <trace name="VDDA_C15" from="C15.pin1" to={NET.VDDA} />
    <trace name="VDDA_C16" from="C16.pin1" to={NET.VDDA} />
    <trace name="C15_GND" from="C15.pin2" to={NET.GND} />
    <trace name="C16_GND" from="C16.pin2" to={NET.GND} />

    {/* VDD 去耦电容 */}
    <trace name="C10_VDD" from="C10.pin1" to={NET.V3_3} />
    <trace name="C11_VDD" from="C11.pin1" to={NET.V3_3} />
    <trace name="C12_VDD" from="C12.pin1" to={NET.V3_3} />
    <trace name="C13_VDD" from="C13.pin1" to={NET.V3_3} />
    <trace name="C14_VDD" from="C14.pin1" to={NET.V3_3} />
    <trace name="C10_GND" from="C10.pin2" to={NET.GND} />
    <trace name="C11_GND" from="C11.pin2" to={NET.GND} />
    <trace name="C12_GND" from="C12.pin2" to={NET.GND} />
    <trace name="C13_GND" from="C13.pin2" to={NET.GND} />
    <trace name="C14_GND" from="C14.pin2" to={NET.GND} />

    {/* VBAT 去耦 */}
    <trace name="C17_VBAT" from="C17.pin1" to={NET.V3_3} />
    <trace name="C17_GND" from="C17.pin2" to={NET.GND} />

    {/* ══ 接线：HSE 晶振 ════════════════════════════════════════════════ */}
    <trace name="HSE_IN_MCU" from="U3.pin5" to={NET.HSE_IN} />
    <trace name="HSE_OUT_MCU" from="U3.pin6" to={NET.HSE_OUT} />
    <trace name="Y1_IN" from="Y1.pin1" to={NET.HSE_IN} />
    <trace name="Y1_OUT" from="Y1.pin3" to={NET.HSE_OUT} />
    <trace name="Y1_GND1" from="Y1.pin2" to={NET.GND} />
    <trace name="Y1_GND2" from="Y1.pin4" to={NET.GND} />
    <trace name="C18_HSE" from="C18.pin1" to={NET.HSE_IN} />
    <trace name="C18_GND" from="C18.pin2" to={NET.GND} />
    <trace name="C19_HSE" from="C19.pin1" to={NET.HSE_OUT} />
    <trace name="C19_GND" from="C19.pin2" to={NET.GND} />

    {/* ══ 接线：复位 ════════════════════════════════════════════════════ */}
    <trace name="NRST_MCU" from="U3.NRST" to={NET.NRST} />
    <trace name="R10_RAIL" from="R10.pin1" to={NET.V3_3} />
    <trace name="R10_NRST" from="R10.pin2" to={NET.NRST} />
    <trace name="C20_NRST" from="C20.pin1" to={NET.NRST} />
    <trace name="C20_GND" from="C20.pin2" to={NET.GND} />
    {/* SW2 的 pin1=pin2、pin3=pin4 各是一组触点，四个脚都接，不留悬空 */}
    {/* pin1=pin2 是同一组触点、pin3=pin4 是另一组，所以**每组只接一个脚**即可：
        两边都接会被 tscircuit 判成"开关两端接到同一网络"（误认为短接）。
        留空的 pin2/pin4 与已接的脚在器件内部本来就通，电气上无损。 */}
    <trace name="SW2_A" from="SW2.A1" to={NET.NRST} />
    <trace name="SW2_B" from="SW2.B1" to={NET.GND} />

    {/* ══ 接线：BOOT0 / BOOT1 ═══════════════════════════════════════════ */}
    <trace name="BOOT0_MCU" from="U3.BOOT0" to={NET.BOOT0} />
    <trace name="R11_BOOT0" from="R11.pin1" to={NET.BOOT0} />
    <trace name="R11_GND" from="R11.pin2" to={NET.GND} />
    <trace name="SW3_A" from="SW3.A1" to={NET.BOOT0} />
    <trace name="SW3_B" from="SW3.B1" to={NET.V3_3} />
    {/* BOOT1 = PB2（脚28），下拉保证从 Flash 启动 */}
    <trace name="R12_BOOT1" from="R12.pin1" to="U3.pin28" />
    <trace name="R12_GND" from="R12.pin2" to={NET.GND} />

    {/* ══ 接线：SWD 调试口 ══════════════════════════════════════════════ */}
    {/* ARM 标准 10 脚：1=VCC 2=SWDIO 3=GND 4=SWCLK 5=GND 6=SWO 7=KEY 8=NC 9=GND 10=NRST */}
    <trace name="SWDIO_MCU" from="U3.pin46" to={NET.SWDIO} />
    <trace name="SWCLK_MCU" from="U3.pin49" to={NET.SWCLK} />
    <trace name="J11_VCC" from="J11.VCC" to={NET.V3_3} />
    <trace name="J11_SWDIO" from="J11.SWDIO" to={NET.SWDIO} />
    <trace name="J11_GND1" from="J11.GND1" to={NET.GND} />
    <trace name="J11_SWCLK" from="J11.SWCLK" to={NET.SWCLK} />
    <trace name="J11_GND2" from="J11.GND2" to={NET.GND} />
    <trace name="J11_GND3" from="J11.GND3" to={NET.GND} />
    <trace name="J11_NRST" from="J11.NRST" to={NET.NRST} />

    {/* ══ 接线：三路串口 ════════════════════════════════════════════════ */}
    <trace name="UART1_TX_MCU" from="U3.pin24" to={NET.UART1_TX} />
    <trace name="UART1_RX_MCU" from="U3.pin25" to={NET.UART1_RX} />
    <trace name="UART2_TX_MCU" from="U3.pin16" to={NET.UART2_TX} />
    <trace name="UART2_RX_MCU" from="U3.pin17" to={NET.UART2_RX} />
    <trace name="UART3_TX_MCU" from="U3.pin29" to={NET.UART3_TX} />
    <trace name="UART3_RX_MCU" from="U3.pin30" to={NET.UART3_RX} />

    {/* ══ 接线：三路 I2C ════════════════════════════════════════════════ */}
    <trace name="I2C1_SCL_MCU" from="U3.pin58" to={NET.I2C1_SCL} />
    <trace name="I2C1_SDA_MCU" from="U3.pin59" to={NET.I2C1_SDA} />
    <trace name="I2C2_SCL_MCU" from="U3.pin42" to={NET.I2C2_SCL} />
    <trace name="I2C2_SDA_MCU" from="U3.pin43" to={NET.I2C2_SDA} />
    <trace name="I2C3_SCL_MCU" from="U3.pin41" to={NET.I2C3_SCL} />
    <trace name="I2C3_SDA_MCU" from="U3.pin40" to={NET.I2C3_SDA} />

    {/* ══ 接线：两路 SPI ════════════════════════════════════════════════ */}
    <trace name="SPI2_SCK_MCU" from="U3.pin34" to={NET.SPI2_SCK} />
    <trace name="SPI2_MISO_MCU" from="U3.pin35" to={NET.SPI2_MISO} />
    <trace name="SPI2_MOSI_MCU" from="U3.pin36" to={NET.SPI2_MOSI} />
    <trace name="SPI2_CS_MCU" from="U3.pin33" to={NET.SPI2_CS} />
    <trace name="SPI3_SCK_MCU" from="U3.pin51" to={NET.SPI3_SCK} />
    <trace name="SPI3_MISO_MCU" from="U3.pin52" to={NET.SPI3_MISO} />
    <trace name="SPI3_MOSI_MCU" from="U3.pin53" to={NET.SPI3_MOSI} />
    <trace name="SPI3_CS_MCU" from="U3.pin20" to={NET.SPI3_CS} />

    {/* ══ 接线：CAN ═════════════════════════════════════════════════════ */}
    <trace name="CAN_TX_MCU" from="U3.pin45" to={NET.CAN_TX} />
    <trace name="CAN_RX_MCU" from="U3.pin44" to={NET.CAN_RX} />

    {/* ══ 接线：六路 PWM（前四路 TIM1 物理相邻，后两路 PA6/PA7 相邻）═══ */}
    <trace name="PWM1_MCU" from="U3.pin8" to={NET.PWM1} />
    <trace name="PWM2_MCU" from="U3.pin9" to={NET.PWM2} />
    <trace name="PWM3_MCU" from="U3.pin10" to={NET.PWM3} />
    <trace name="PWM4_MCU" from="U3.pin11" to={NET.PWM4} />
    <trace name="PWM5_MCU" from="U3.pin22" to={NET.PWM5} />
    <trace name="PWM6_MCU" from="U3.pin23" to={NET.PWM6} />

    {/* ══ 接线：三路 ADC 采样 ═══════════════════════════════════════════ */}
    <trace name="ADC_12V_MCU" from="U3.pin14" to={NET.ADC_12V} />
    <trace name="ADC_5V_MCU" from="U3.pin15" to={NET.ADC_5V} />
    <trace name="ADC_3V3_MCU" from="U3.pin26" to={NET.ADC_3V3} />

    {/* ══ 接线：三路 GPIO 指示灯 ════════════════════════════════════════ */}
    <trace name="LED1_MCU" from="U3.pin37" to={NET.GPIO_LED1} />
    <trace name="LED2_MCU" from="U3.pin38" to={NET.GPIO_LED2} />
    <trace name="LED3_MCU" from="U3.pin39" to={NET.GPIO_LED3} />
  </group>
)
