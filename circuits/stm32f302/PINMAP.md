# 引脚分配表 — STM32F302R8T6（LQFP-64）

> **唯一权威源**：ST 官方 `STM32_open_pin_data` 仓库的 `STM32F302R(6-8)Tx.xml`（Package=LQFP64）
> `https://github.com/STMicroelectronics/STM32_open_pin_data`
> 本文档由该 XML 程序化生成并逐脚校验，**不是手抄**。

**校验结论**：64 脚全覆盖、无重复分配、每个复用功能均在该脚真实存在。

---

## 1. 完整引脚表（1–64）

| 脚 | 端口 | 本板用途 | 复用功能 | 连接对象 |
|---:|------|----------|----------|----------|
| 1 | **VBAT** | VBAT 备份电源 | `—` | VBAT 接 3.3V（或 100nF 到地） |
| 2 | **PC13** | 留空 | `RTC/WKUP` | 不用 |
| 3 | **PC14** | 留空 | `OSC32_IN` | 不装 LSE，留空 |
| 4 | **PC15** | 留空 | `OSC32_OUT` | 不装 LSE，留空 |
| 5 | **PF0** | HSE 晶振输入 | `RCC_OSC_IN` | 8MHz 3225 晶振 |
| 6 | **PF1** | HSE 晶振输出 | `RCC_OSC_OUT` | 8MHz 3225 晶振 |
| 7 | **NRST** | 复位 | `—` | RESET 按键 + 上拉 + 100nF |
| 8 | **PC0** | PWM1 | `TIM1_CH1` | PWM 排针 第1排 脚1 |
| 9 | **PC1** | PWM2 | `TIM1_CH2` | PWM 排针 第1排 脚2 |
| 10 | **PC2** | PWM3 | `TIM1_CH3` | PWM 排针 第1排 脚3 |
| 11 | **PC3** | PWM4 | `TIM1_CH4` | PWM 排针 第1排 脚4 |
| 12 | **VSSA** | 模拟地 | `—` | 接 GND |
| 13 | **VDDA** | 模拟电源 | `—` | VDDA 滤波 1µF + 10nF |
| 14 | **PA0** | ADC 采 12V | `ADC1_IN1` | 12V 分压网络 |
| 15 | **PA1** | ADC 采 5V | `ADC1_IN2` | 5V 分压网络 |
| 16 | **PA2** | USART2_TX | `USART2_TX` | PH2.0 UART2 |
| 17 | **PA3** | USART2_RX | `USART2_RX` | PH2.0 UART2 |
| 18 | **VSS** | 数字地 | `—` | 接 GND |
| 19 | **VDD** | 数字电源 | `—` | 100nF 去耦 |
| 20 | **PA4** | SPI3_NSS | `SPI3_NSS` | PH2.0 SPI-B（片选） |
| 21 | **PA5** | 留空 | `TIM2_CH1` | 不用 |
| 22 | **PA6** | PWM5 | `TIM16_CH1` | PWM 排针 第1排 脚5 |
| 23 | **PA7** | PWM6 | `TIM17_CH1` | PWM 排针 第1排 脚6 |
| 24 | **PC4** | USART1_TX | `USART1_TX` | PH2.0 UART1 |
| 25 | **PC5** | USART1_RX | `USART1_RX` | PH2.0 UART1 |
| 26 | **PB0** | ADC 采 3.3V | `ADC1_IN11` | 3.3V 分压网络 |
| 27 | **PB1** | 留空 | `TIM1_CH3N` | 不用 |
| 28 | **PB2** | BOOT1 | `BOOT1` | 10k 下拉到 GND |
| 29 | **PB10** | USART3_TX | `USART3_TX` | PH2.0 UART3 |
| 30 | **PB11** | USART3_RX | `USART3_RX` | PH2.0 UART3 |
| 31 | **VSS** | 数字地 | `—` | 接 GND |
| 32 | **VDD** | 数字电源 | `—` | 100nF 去耦 |
| 33 | **PB12** | SPI2_NSS | `SPI2_NSS` | MCP23S17 CS |
| 34 | **PB13** | SPI2_SCK | `SPI2_SCK` | MCP23S17 SCK |
| 35 | **PB14** | SPI2_MISO | `SPI2_MISO` | MCP23S17 SO |
| 36 | **PB15** | SPI2_MOSI | `SPI2_MOSI` | MCP23S17 SI |
| 37 | **PC6** | LED1 | `GPIO` | LED + 限流电阻 |
| 38 | **PC7** | LED2 | `GPIO` | LED + 限流电阻 |
| 39 | **PC8** | LED3 | `GPIO` | LED + 限流电阻 |
| 40 | **PC9** | I2C3_SDA | `I2C3_SDA` | PH2.0 I2C |
| 41 | **PA8** | I2C3_SCL | `I2C3_SCL` | PH2.0 I2C |
| 42 | **PA9** | I2C2_SCL | `I2C2_SCL` | TMP1075 SCL |
| 43 | **PA10** | I2C2_SDA | `I2C2_SDA` | TMP1075 SDA |
| 44 | **PA11** | CAN_RX | `CAN_RX` | TCAN332 RXD |
| 45 | **PA12** | CAN_TX | `CAN_TX` | TCAN332 TXD |
| 46 | **PA13** | SWDIO | `SYS_JTMS-SWDIO` | SWD 排针 |
| 47 | **VSS** | 数字地 | `—` | 接 GND |
| 48 | **VDD** | 数字电源 | `—` | 100nF 去耦 |
| 49 | **PA14** | SWCLK | `SYS_JTCK-SWCLK` | SWD 排针 |
| 50 | **PA15** | 留空 | `JTDI` | 不用（SWD 模式下释放） |
| 51 | **PC10** | SPI3_SCK | `SPI3_SCK` | PH2.0 SPI-B |
| 52 | **PC11** | SPI3_MISO | `SPI3_MISO` | PH2.0 SPI-B |
| 53 | **PC12** | SPI3_MOSI | `SPI3_MOSI` | PH2.0 SPI-B |
| 54 | **PD2** | 留空 | `—` | 不用 |
| 55 | **PB3** | 留空 | `JTDO` | 不用 |
| 56 | **PB4** | 留空 | `NJTRST` | 不用 |
| 57 | **PB5** | 留空 | `I2C1_SMBA` | 不用 |
| 58 | **PB6** | I2C1_SCL | `I2C1_SCL` | AT24C64D SCL |
| 59 | **PB7** | I2C1_SDA | `I2C1_SDA` | AT24C64D SDA |
| 60 | **BOOT0** | BOOT0 | `—` | 10k 下拉 + BOOT 按键到 3.3V |
| 61 | **PB8** | 留空 | `CAN_RX(alt)` | 不用 |
| 62 | **PB9** | 留空 | `CAN_TX(alt)` | 不用 |
| 63 | **VSS** | 数字地 | `—` | 接 GND |
| 64 | **VDD** | 数字电源 | `—` | 100nF 去耦 |

---

## 2. 外设分配汇总

### UART ×3（要求 3）→ 各一个 PH2.0 1×4

| 外设 | TX | RX | 引出 |
|------|----|----|------|
| USART1 | PC4 (脚24) | PC5 (脚25) | PH2.0 #1 |
| USART2 | PA2 (脚16) | PA3 (脚17) | PH2.0 #2 |
| USART3 | PB10 (脚29) | PB11 (脚30) | PH2.0 #3 |

### I2C ×3（要求 4）

| 外设 | SCL | SDA | 连接对象 |
|------|-----|-----|----------|
| I2C1 | PB6 (脚58) | PB7 (脚59) | **AT24C64D** EEPROM |
| I2C2 | PA9 (脚42) | PA10 (脚43) | **TMP1075** 温度传感器 |
| I2C3 | PA8 (脚41) | PC9 (脚40) | **PH2.0** 引出 |

### SPI ×2（要求 5）

| 外设 | SCK | MISO | MOSI | NSS | 连接对象 |
|------|-----|------|------|-----|----------|
| SPI2 | PB13 (34) | PB14 (35) | PB15 (36) | PB12 (33) | **MCP23S17** → 2×8 排针 |
| SPI3 | PC10 (51) | PC11 (52) | PC12 (53) | PA4 (20) | **PH2.0 1×6** |

### CAN ×1（要求 6）

| 信号 | 引脚 | 连接对象 |
|------|------|----------|
| CAN_TX | PA12 (脚45) | TCAN332 TXD |
| CAN_RX | PA11 (脚44) | TCAN332 RXD |

### PWM ×6（要求 7）

| 通道 | 引脚 | 定时器 | 排针位置 |
|------|------|--------|----------|
| PWM1 | PC0 (脚8) | `TIM1_CH1` | 第1排 脚1 |
| PWM2 | PC1 (脚9) | `TIM1_CH2` | 第1排 脚2 |
| PWM3 | PC2 (脚10) | `TIM1_CH3` | 第1排 脚3 |
| PWM4 | PC3 (脚11) | `TIM1_CH4` | 第1排 脚4 |
| PWM5 | PA6 (脚22) | `TIM16_CH1` | 第1排 脚5 |
| PWM6 | PA7 (脚23) | `TIM17_CH1` | 第1排 脚6 |

> PWM 排针摆法：3 个 1×6 排针**平行紧贴**（行距 2.54mm），
> 第1排 = PWM1–6，第2排 = 5V×6，第3排 = GND×6。竖看每列即一个标准 3 脚舵机接口。

### ADC ×3（要求 8）

| 采样对象 | 引脚 | 通道 |
|----------|------|------|
| 12V | PA0 (脚14) | `ADC1_IN1` |
| 5V | PA1 (脚15) | `ADC1_IN2` |
| 3.3V | PB0 (脚26) | `ADC1_IN11` |

### GPIO LED ×3（要求 9）

| LED | 引脚 |
|-----|------|
| LED1 | PC6 (脚37) |
| LED2 | PC7 (脚38) |
| LED3 | PC8 (脚39) |

### 系统与调试

| 功能 | 引脚 | 说明 |
|------|------|------|
| HSE 8MHz | PF0 / PF1 (脚5/6) | 3225 封装无源晶振 + 负载电容 |
| SWDIO | PA13 (脚46) | SWD 排针 |
| SWCLK | PA14 (脚49) | SWD 排针 |
| NRST | 脚7 | RESET 按键 + 10k 上拉 + 100nF |
| BOOT0 | 脚60 | 10k 下拉 + BOOT 按键到 3.3V |
| BOOT1 | PB2 (脚28) | 10k 下拉 |

---

## 3. 冲突求解过程（为什么是这样分）

本设计有 **3 个被逼死的选择**，不是随便挑的：

1. **I2C2 只能走 PA9/PA10。** ST 数据里 `I2C2_SCL/SDA` 只有两组可选：
   `PF1/PF0` 与 `PA9/PA10`。而 PF0/PF1 被 8MHz HSE 晶振占用（要求 2 强制要晶振），
   所以 I2C2 别无选择。
2. **USART1 因此必须让位。** `USART1_TX/RX` 的常规位置正是 PA9/PA10，被 I2C2 占了，
   所以改走 **PC4/PC5**（该型号上 USART1 的合法备用位置）。
3. **PA13/PA14 锁死给 SWD。** `SWDIO/SWCLK` 只有唯一位置，因此
   `USART2_TX` 不能用 PA14、`I2C1_SDA` 不能用 PA14 —— 都避开。

另外两个「能过就好」的取舍：

- **SPI 落在 SPI2/SPI3**：该型号**没有 SPI1**（见 REQUIREMENTS.md §4.1）。
- **PWM 用 TIM1(4路) + TIM16 + TIM17**：该型号**没有 TIM3/TIM4**；
  PC0–PC3 是 TIM1_CH1–CH4 且物理相邻（脚8–11），PA6/PA7 是 TIM16/17 且相邻（脚22/23），
  两组各自成排，走线干净。

---

## 4. 未使用引脚（12 个）

| 脚 | 端口 | 处理 |
|---:|------|------|
| 2 | PC13 | 留空 |
| 3 | PC14-OSC32_IN | 留空（不装 LSE） |
| 4 | PC15-OSC32_OUT | 留空（不装 LSE） |
| 21 | PA5 | 留空 |
| 27 | PB1 | 留空 |
| 50 | PA15 | 留空（JTDI，SWD 模式释放） |
| 54 | PD2 | 留空 |
| 55 | PB3 | 留空（JTDO） |
| 56 | PB4 | 留空（NJTRST） |
| 57 | PB5 | 留空 |
| 61 | PB8 | 留空 |
| 62 | PB9 | 留空 |

> 建议：未用引脚在 PCB 上留测试点或短焊盘，方便后期扩展；也可全部悬空（该型号内部有保护）。
> **不要**把未用引脚接地或接电源。

---

## 5. 电源引脚

| 脚 | 名称 | 数量 | 处理 |
|---:|------|------|------|
| 19, 32, 48, 64 | VDD | 4 | 每脚一颗 100nF 就近去耦 + 一颗 4.7µF 总容 |
| 18, 31, 47, 63 | VSS | 4 | 接 GND |
| 13 | VDDA/VREF+ | 1 | 1µF + 10nF 滤波（经磁珠或 0Ω 从 3.3V 引入） |
| 12 | VSSA/VREF- | 1 | 接 GND |
| 1 | VBAT | 1 | 接 3.3V 或 100nF 到地 |

> **注意**：F302 系列**没有 VCAP 引脚**（与 F4 不同），不需要外接内核电容。
