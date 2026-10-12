# STM32F302R8T6 考核板

用 tscircuit（TSX 描述电路）画的一块 STM32F302R8T6 开发板，对应硬件部考核题 11 条要求。

**硬截止：2026-10-13 18:00** ｜ 交付：原理图截图 + PCB 正反面截图 + `.epro2` → `sorenlin21@gmail.com`

---

## 文件地图

```
circuits/stm32f302/
├── README.md            ← 本文件：怎么跑
├── REQUIREMENTS.md        题目 11 条要求 → 41 个可验收条目 + 10 项决策记录
├── PINMAP.md / pinmap.json 64 脚完整引脚分配表（ST 官方数据程序化生成）
├── BOM.md                 23 种器件清单 + 封装库可用性实测结论
├── pages.ts               原理图分页定义（全工程唯一权威）
├── nets.ts                跨模块电源网络定义（全工程唯一权威）
├── main.tsx             ★ 顶层：声明 9 张页 + 拼装 9 个模块
├── modules/               9 个功能模块，一条要求一个文件
│   ├── 01-power.tsx       要求 1  电源
│   ├── 02-mcu.tsx         要求 2  最小系统
│   ├── 03-uart.tsx        要求 3  三路 UART
│   ├── 04-i2c.tsx         要求 4  三路 I2C
│   ├── 05-spi.tsx         要求 5  两路 SPI
│   ├── 06-can.tsx         要求 6  CAN
│   ├── 07-pwm.tsx         要求 7  六路 PWM
│   ├── 08-adc.tsx         要求 8  三路 ADC 采样
│   └── 09-led.tsx         要求 9  三路 GPIO LED
└── _libcheck.tsx          封装库自检工具（一次性，非成品电路）
```

产物写到 `out/stm32f302/`（已 gitignore）。

---

## 怎么跑

Bun **不在 PATH**，在工作区外层；命令统一走 `./tsci-run`（**不要**用 `bunx`，会绕开钉死的依赖树）。

```bash
cd ~/Desktop/tscircuit/my-tscircuit
export PATH="$HOME/Desktop/tscircuit/.tooling/bun/bin:$PATH"

# 构建 + 出网表（最快的连通性检查）
./tsci-run export circuits/stm32f302/main.tsx -f readable-netlist -o ../../out/stm32f302/main.netlist.txt

# 原理图（多页会垂直堆叠成一张总图）
./tsci-run export circuits/stm32f302/main.tsx -f schematic-svg -o ../../out/stm32f302/main.sch.svg

# PCB 正反面
./tsci-run export circuits/stm32f302/main.tsx -f pcb-svg -o ../../out/stm32f302/main.pcb.svg
./tsci-run export circuits/stm32f302/main.tsx -f pcb-png -o ../../out/stm32f302/main.pcb.png

# 交付用的 KiCad（供在 EasyEDA Pro 里转 epro2）
./tsci-run export circuits/stm32f302/main.tsx -f kicad_pcb -o ../../out/stm32f302/main.kicad_pcb
./tsci-run export circuits/stm32f302/main.tsx -f kicad_sch -o ../../out/stm32f302/main.kicad_sch
```

> ⚠️ `-o` 是**完整文件名**，且相对**电路文件所在目录**解析，所以要写 `../../out/...`。

其它可用检查：`./tsci-run check netlist|placement|shorts|pcb-style|schematic-placement main.tsx`

### 两个必跑的验收脚本

```bash
# 1) 模块验收：元件数 / 丢件 / 零焊盘 / 几何冲突 / 页外 / 位号约定
./tsci-run export circuits/stm32f302/main.tsx -f circuit-json -o ../../out/stm32f302/main.json
python3 scripts/check-modules.py

# 2) ERC 电气规则检查：短路 / 重复网络 / 悬空引脚 / 必连未连 / 供电无源 / 接地非地 / 多驱动
python3 scripts/erc.py
```

### ERC 的做法（`scripts/erc.py`）

不做"顺着 trace 追"——那是画法，不是电气事实。tscircuit 给每个 `source_port`
打了 `subcircuit_connectivity_map_key`，**同 key 的引脚就是同一个电气网络**，
用它建网表才是权威连通性。

| 检查 | 含义 |
|------|------|
| A 电源短路 | 两个不同网络名被并成同一个连通组 |
| A2 电地短接 | GND 网络上出现 `provides_power` 的引脚 |
| B 重复网络 | 同一个网络名分裂成多个互不相连的组 |
| C 悬空引脚 | 孤立单脚网络 + 完全未接入的引脚（带"刻意留空"白名单） |
| D 必连未连 | `must_be_connected` 的引脚网络里只有自己 |
| E 供电无源 | `requires_power` 的网络里没有任何 `provides_power` |
| F 接地非地 | `requires_ground` 的引脚不在 GND 网络上 |
| G 多驱动 | 同一网络上有两个以上 IC 在供电（可能对顶） |

> ⚠️ **一个会让 ERC 误报的坑**：未接任何线的引脚，其 `connectivity_map_key` 是
> **`None`**。如果把 `None` 当成一个网络名分组，28 个毫不相干的空脚会被并成
> 一个"28 脚网络"，看起来像把所有未用脚短接在一起。实测这些引脚之间
> `source_trace` 数 = 0，电气上互不相连 —— **必须把 `None` 单独处理**。

> 另一个坑：ERC 不会把"电源"顺着无源件传下去。12V 经拨动开关送到 `net.V12`，
> 但开关是无源件，所以必须给开关标 `COM: requiresPower` / `T1: providesPower`，
> 否则 E 检查会误报"net.V12 无人供电"。

---

## 架构

**一条要求 = 一个模块文件 = 一张原理图页。**

- 每个模块导出 React 组件，内部是一个 `<subcircuit>`，组件上挂 `schSheetName`。
- **`schSheetName` 放在 `<subcircuit>` 上会整块继承给所有子元件** —— 子元件不用各写一遍（实测确认）。
- `<subcircuit pcbX pcbY>` 能把整块模块在 PCB 上整体平移，所以模块内坐标以自身原点为准，布局在 `main.tsx` 里统一决定。
- 页名与网络名的字符串**只在 `pages.ts` / `nets.ts` 里定义一次**。写串了不会报错，只会让元件悄悄落到默认页、或让网络断成两条。

### 实测记录的坑（core 0.0.2119）

| 坑 | 现象 | 规避 |
|----|------|------|
| **空 `<subcircuit>`** | 单个还能构建，**多个同时存在必炸**：`TypeError: undefined is not an object (evaluating 'component.componentId')` | 未实现的模块返回 `null`，实现后再换成 `<subcircuit>` |
| **`<crystal>` 缺 `loadCapacitance`** | 元件**静默消失**（构建仍报成功），只留一条 `source_failed_to_create_component_error` | 必填 `loadCapacitance`；4 焊盘 3225 再加 `pinVariant="four_pin"` |
| **`<led>` 用 jlcpcb 封装** | 原理图不画符号，只印红字 `Could not match ports for symbol led_right` | 必须显式写 `pinLabels={{pin1:"anode",pin2:"cathode"}}` |
| **`<chip>` + `supplierPartNumbers`** | 报"封装不符"假阳性（同 C 编号自比对，IoU 0.68） | 对开关这类用 `<switch>` 且不写 supplier；C 编号留在注释与 BOM.md |
| `<schematicsection>` | 官方文档主推它做分区，**该版本不支持** | 只用 `<schematicsheet>` |
| **原理图坐标区** | 不是 A4 的 297×210，实际只有约 **31×21.7 单位**；超界报 `schematic_element_outside_sheet_warning` | 见下方「原理图坐标」 |
| 多页导出 | 不是多个文件，是**一张 `tscircuit-stacked-schematic`**，所有页垂直堆叠 | 单页预览用 `_preview.tsx`；渲染见下 |
| `schematic-pdf` 导出 | 本机 Rust panic（`failed to initiate panic, error 5`） | 改用 `schematic-svg` |
| 多页 SVG 渲染 | resvg 会 panic（`Option::unwrap() on a None value`） | **单页走 resvg，多页走 macOS `qlmanage`** |
| 该型号外设 | **没有 SPI1 / TIM3 / TIM4 / GPIOE** | 见 `PINMAP.md` §3 |

### ⚠️ 最重要的一条：模块必须用 `<group>`，不能用 `<subcircuit>`

**实测结论：`<subcircuit>` 会把 `net.X` 的命名空间隔离在子电路内部。**

| 写法 | 结果 |
|------|------|
| 两个 `<subcircuit>` 各自连 `net.GND` | **2 个互不相连的 GND 网络** + 警告 |
| 再加 board 层 `<net name="GND" />` | **更糟：3 个** |
| 两个 `<group>` 各自连 `net.GND` | ✅ **1 个 GND 网络** |
| 不用分组（同层） | ✅ 1 个网络 |

这本身是合理设计 —— `<subcircuit>` 的语义是**可复用 IP 块**，网络命名空间隔离是特性。
但我们的场景是「**一块板分成多页组织**」，跨页要靠同名网络自动连通，
所以必须用 `<group>`。

`<group>` 同时满足分页与布局需求（实测）：

- `schSheetName` 挂在 `<group>` 上 → 子元件正确落到指定页
- `pcbX/pcbY` 挂在 `<group>` 上 → 子元件整体偏移

> 另一个坑：网络名**不能与位号重名**。指示灯页的元件位号是 `LED1/2/3`，
> 若网络也叫 `LED1/2/3`，会报 `Multiple immediate children found with name "LED1"`。
> 所以网络改名为 `net.GPIO_LED1/2/3`。

### ⚠️ 第二条同样重要：不打锚点，tscircuit 会自动「打包」布局

实测（core 0.0.2119）：**模块 `<group>` 不给 `pcbX/pcbY` 的话，
tscircuit 会把 position_mode 设成 `"packed"`，完全忽略模块里写的所有坐标。**

| 写法 | 结果 |
|------|------|
| 两个 group 都不带位置 | ❌ `packed`，模块内部坐标被打乱 |
| **给 group 显式 `pcbX/pcbY`** | ✅ `relative_to_group_anchor`，坐标精确生效 |
| board 上写 `pcbPack={false}` | ❌ 无效 |
| group 上写 `pcbPack={false}` | ⚠️ 单独导出有效，但**只要还有别的 group 没锚点，整体仍会被打包** |

**所以每个模块都必须有锚点**（哪怕就是 0,0）。九个模块都有 `pcbX/pcbY` 入参，
`main.tsx` 用一张 `LAYOUT` 表统一给坐标。

诊断办法：单独导出某个模块坐标正常，一放进整板就变 `packed` ——
这个对比能立刻定位到「是 board 在打包它的子 group」，而不是模块自身的问题。

### ⚠️ 第三条：给 `<connector>` 加 `<footprint>` 子元素会顶掉引脚

立式连接器（PH2.0 的 ZZ 后缀、SWD 排针）线缆是**从板子上方垂直插入**的，
不需要朝向板边。但 tscircuit 会从 footprint 的 `cable_insertion_center` 去"推断"
插拔方向，而那个推断对这类封装是错的（实测永远是 x−，且不随旋转翻转），
于是误报 `pcb_connector_not_in_accessible_orientation_warning`。

正确做法是如实声明：

```tsx
<connector name="J7" footprint="jlcpcb:C5359600" pinLabels={{...}}>
  <footprint insertionDirection="from_above" />
</connector>
```

**但有个坑**：这个子元素会**替换掉字符串形式的封装**。所以元件**必须同时给
`pinLabels`** —— 否则引脚全没了。实测没有 `pinLabels` 的 J11 变成 **0 个 port**，
7 条接线全断，报 `source_trace_not_connected_error`。

### 跨页连接是怎么成立的

一条网络的两端分别写在两个模块里，两边都引用 `nets.ts` 里的同一个常量，即自动连通 ——
不需要任何显式的"跨页连线"语句。原理图上的**网络标号是自动生成的**，无需手写 `<netlabel>`。

### 原理图坐标（实测标定）

从导出 SVG 的 `data-real-to-screen-transform` 矩阵反推出来的：

```
屏幕 x = 25.2778 × 真实 x + 600        （1 单位 ≈ 9.2mm）
屏幕 y = −25.2778 × 真实 y + 300       （y 轴向上）
A4 内框 → 真实坐标 x ∈ [−15.54, +15.54]  y ∈ [−10.83, +10.83]
```

**摆到 ±120 这种"像 mm"的数上，整页只会剩一个空图框。** 每个模块的 `schX/schY` 都要落在这个窄区间里。

### 封装庭院尺寸（实测，用来排间距）

| 封装 | 庭院 |
|------|------|
| 0603 阻容 | 2.96 × 1.46 mm |
| 0805 阻容 | 3.36 × 1.90 mm |
| LQFP-64 (U3) | 13.99 × 13.99 mm |
| TS-1187A 按键 | 7.51 × 5.71 mm |
| 2×5 SWD 排针 | 13.23 × 5.58 mm |

**经验值：行内中心距 ≥4mm、行距 ≥7mm**，实测可让重叠错误归零。

### 唯一的具名 DRC 例外：PWM 舵机轨

排针本体 2.54mm，但**庭院是 3.04mm**（本体外各 ~0.25mm 通用余量）。
PWM 页三排排针按 2.54mm 紧贴（舵机轨的必需间距）会让相邻庭院重叠 **0.50mm**，
tscircuit 报 `pcb_courtyard_overlap_error`。

**保留 2.54mm**（改动会破坏舵机轨），并在 `scripts/check-modules.py` 的
`COURTYARD_EXCEPTIONS` 里具名豁免 `J8+J9`、`J9+J10` —— 豁免必须写理由，
且脚本每次运行都会把豁免项打印出来，不会静默放过。

---

## 当前状态

| 项 | 状态 |
|----|------|
| 需求清单 | ✅ 完成（11 条要求 → 41 个可验收条目 + 10 项决策） |
| 引脚分配 | ✅ 完成（64 脚零冲突，ST 官方数据程序化生成） |
| 器件 BOM | ✅ 完成（23 种器件，封装库 23/23 全有，零自绘库） |
| 工程骨架 + 9 页分页 | ✅ 完成 |
| **九页器件放置** | ✅ **完成，共 84 个元件**（见下表） |
| **接线** | ✅ **九页全部完成** —— 284 条 trace / 50 个网络，未接引脚全部是刻意留空 |
| PCB 全局布局 | ❌ 未开始（模块目前都在原点，跨模块重叠属预期） |
| 布线 / DRC | ❌ 未开始 |
| 交付物导出 | ❌ 未开始 |

### 接线完整性（实测：337 个引脚，309 个已接，28 个刻意留空）

| 元件 | 未接引脚 | 原因 |
|------|----------|------|
| `U3` | PA15 PA5 PB1 PB3 PB4 PB5 PB8 PB9 PC13 PC14 PC15 PD2 | **正好 12 个**，与 `PINMAP.md` 的「未使用引脚」清单逐字一致 |
| `U7` / `U2` | NC1 NC2 / NC | 器件本身的空脚 |
| `U6` | INTA INTB | 本板不用中断，靠轮询 |
| `U5` | ALERT | 同上 |
| `SW1` | T2 MP1 MP2 | 空掷 + 安装脚 |
| `SW2` `SW3` | A2 B2 | 与 A1/B1 在器件内部相通（每组触点只接一个脚，否则会被判成"开关两端短接"） |
| `J11` | pin6 pin7 pin8 | SWO / KEY / NC（标准 SWD 10 脚定义） |

**没有任何功能性引脚被漏接。**

### 各页器件数（`python3 scripts/check-modules.py` 实测）

| 页 | 模块 | 器件数 | 关键器件 |
|----|------|:---:|----------|
| 1 | 电源 | 20 | RY8411 / TLV75733 / XT30 / 拨动开关 / 3 颗电源灯 |
| 2 | 最小系统 | 20 | STM32F302R8T6 / 8MHz 3225 / 按键 ×2 / SWD / 磁珠 |
| 3 | 串口 UART | 3 | PH2.0 1×4 ×3 |
| 4 | I2C | 11 | AT24C64D / TMP1075 / PH2.0 1×4 / 上拉 ×6 |
| 5 | SPI | 7 | MCP23S17 / 2×8 排针 / PH2.0 1×6 |
| 6 | CAN | 5 | TCAN332 / PH2.0 1×3 / 120Ω 终端 |
| 7 | PWM | 3 | 1×6 排针 ×3（舵机轨） |
| 8 | ADC 采样 | 9 | 三组分压 + 滤波 |
| 9 | 指示灯 | 6 | 0603 绿 LED ×3 + 限流 ×3 |
| | **合计** | **84** | 261 SMT 焊盘 + 76 通孔 |
