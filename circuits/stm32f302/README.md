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
| `<schematicsection>` | 官方文档主推它做分区，**该版本不支持** | 只用 `<schematicsheet>` |
| 多页导出 | 不是多个文件，是**一张 `tscircuit-stacked-schematic`**，所有页垂直堆叠 | 截图时按需裁剪，或用 A4 页高 751px 定位 |
| 该型号外设 | **没有 SPI1 / TIM3 / TIM4 / GPIOE** | 见 `PINMAP.md` §3 |

---

## 当前状态

| 项 | 状态 |
|----|------|
| 需求清单 | ✅ 完成 |
| 引脚分配 | ✅ 完成（64 脚零冲突） |
| 器件 BOM | ✅ 完成（23/23 封装库全有，零自绘库） |
| 工程骨架 + 9 页分页 | ✅ 完成并构建通过 |
| **9 个模块电路** | ❌ **全部未实现**（当前返回 `null`） |
| PCB 布局布线 | ❌ 未开始 |
| 交付物导出 | ❌ 未开始 |
